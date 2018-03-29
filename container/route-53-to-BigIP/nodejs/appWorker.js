/*
 * Copyright (c) 2017, F5 Networks, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
*/

'use strict';

const Zones = require("./Zones");
const Zone = require("./Zone");
const ResourceRecordSet = require("./ResourceRecordSet");

const url = require("url");
const logger = require('f5-logger').getInstance();
const util = require('./helper');
const awsHelper = require('./awsHelper');

const uriPath = 'shared/route53ToBigIP';
const configUrlPath = `${uriPath}/config`;
const deviceUrlPath = `${uriPath}/devices`;
const deviceGroupPath = `shared/resolver/device-groups/dockerContainers/devices`;
const legacyDeviceGroupPath = `shared/resolver/device-groups/dockerContainersLegacy/devices`;
const REFRESH = 60000;

// TODO remove in memory state, used for cleaning up config
let state = {};

/**
 * Worker which applies config to a list of
 * bigip devices.
 *
 * @class HttpRequestWorker
 */
class HttpRequestWorker {
    constructor() {
        this.WORKER_URI_PATH = uriPath;
        this.isPublic = true;
    }

    onStart(success, error) {
        const configUrl = this.restHelper.makeRestnodedUri(configUrlPath);
        const devicesUrl = this.restHelper.makeRestnodedUri(deviceUrlPath);
        const trustedUrl = this.restHelper.makeRestjavadUri(deviceGroupPath);

        this.dependencies.push(configUrl);
        this.dependencies.push(devicesUrl);
        this.dependencies.push(trustedUrl);

        //this.setPresentationHtmlFilepath("iapps/ipAddressExpansion/index.html");

        success();
    }

    onStartCompleted(success) {
        const deviceGroupUrl = this.restHelper.makeRestjavadUri(deviceGroupPath);
        const legacyDeviceGroupUrl = this.restHelper.makeRestjavadUri(legacyDeviceGroupPath);

        logger.info('getting trusted devices', deviceGroupUrl, legacyDeviceGroupUrl);

        util.getDeviceGroupsLike.call(this, 'dockerContainers')
        .then((deviceGroups) => {
            logger.info('device groups', deviceGroups);
            return util.getTrustedDevicesInGroups.call(this, deviceGroups);
        })
        .then((trustedDevices) => {
            logger.info('trusted devices', trustedDevices);
            return trustedDevices.map((device) => {
                if (device.hostname) {
                    return {
                        name: device.hostname,
                        trustGroup: device.groupName,
                        mgmtIp: device.managementAddress,
                        mgmtPort: device.httpsPort
                    };
                }
            });
        })
        .then((devices) => {
            logger.info('all devices', devices);
            return util.createDevices.call(this, deviceUrlPath, devices);
        })
        .then(() => {
            periodicPoll.call(this);
            return Promise.resolve();
        })
        .catch((e) => {
            logger.severe(e);
        })
        .finally(() => {
            success();
        });
    }
}

module.exports = HttpRequestWorker;

/**
 * Search in array of Objects for specific value in give property
 * @param {Array} array
 * @param {String} propertyName
 * @param {String} value
 * @returns {Boolean}
 */
const includesProperty = function (array, propertyName, value) {
    //logger.fine("[[includesProperty]]", JSON.stringify(array));
    let simpleArray = array.map((element) => (element[propertyName]));
    return simpleArray.includes(value);
};

/**
 * This function wraps setTimeout and return promise
 * @param {Integer} ms
 * @returns {Promise}
 */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Recursive polling function
 */
const periodicPoll = function (zones = new Zones()) {
    awsPoll.call(this, zones)
        .then(() => {
            return wait(REFRESH);
        })
        .then(() => {
            periodicPoll.call(this, zones);
        });
};


/**
 * Main pulling and updating function
 * @returns {Promise}
 */
const awsPoll = function (zones) {
    let devices;
    return new Promise((resolve, reject) => {
        util.getDevices.call(this, deviceUrlPath)
            .then((d)=> {
                devices = d;
                return awsHelper.getHostedZones();
            })
            .then((response = []) => {
                return handleGetHostedZonesResponse.call(this, response.HostedZones, zones, devices);
            })
            .then((listOfZones) => {
                return deleteMissingZones.call(this, listOfZones, zones, devices);
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });
};


/**
 * handle response of GetRecords AWS SDK call
 * @param {Object} response
 * @param {Integer} zoneLocation
 * @param {Zones} zones
 * @param {Array} devices
 * @returns {Promise}
 */
const handleGetRecordsResponse = function (response, zoneLocation, zones, devices) {
    let promises = [];
    let record;
    let zone = zones.getZone(zoneLocation);
    return new Promise((resolve, reject) => {
        //check which records need to be added
        response.ResourceRecordSets.forEach((recordSet) => {
            if ((recordSet.Type !== "NS")&&(recordSet.Type !== "SOA")) {
                if (zone.isRecordInSet(recordSet.Name) === -1) {
                    logger.fine("[[handleGetRecordsResponse]] ADD RR", recordSet.Name);
                    let address = recordSet.ResourceRecords[0].Value;
                    record = new ResourceRecordSet(recordSet.Name, recordSet.Type, recordSet.TTL, [address]);
                    zone.addRecordSet(record);
                    //send add record to Zone in BIGIP
                    promises.push(util.addRecord.call(this, zone.Name, record, devices));
                } else {
                    let existingRecord = zone.getRecord(recordSet.Name);
                    //check which records need to be modified
                    if (!((existingRecord.TTL === recordSet.TTL)&&(existingRecord.Type === recordSet.Type))) {
                        existingRecord.TTL = recordSet.TTL;
                        existingRecord.Type = recordSet.Type;
                        //send add record to Zone in BIGIP
                        promises.push(util.addRecord.call(this, zone.Name, existingRecord, devices));
                    }
                }
            }
        });
        //check which RecordSet need to be deleted
        let recordList = zone.getRecordList();
        recordList.forEach((element) => {
            if (!includesProperty(response.ResourceRecordSets, "Name", element)) {
                //delete the record
                logger.fine("[[handleGetRecordsResponse]] DELETE RR", element);
                promises.push(util.deleteRecord.call(this, zone.Name, zone.getRecord(element), devices));
            }
        });
        Promise.all(promises)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                logger.severe("[handleGetRecordsResponse]", err);
                reject(err);
            });
    });
};

/**
 * Handle response of GetHostedZones AWS SDK
 * @param {Array} hostedZones
 * @param {Zones} zones
 * @param {Array} devices
 * @returns {Promise}
 */
const handleGetHostedZonesResponse = function (hostedZones, zones, devices) {
    let listOfZones = [];
    let promises = [];
    return new Promise((resolve, reject) => {
        hostedZones.forEach((hostedZone) => {
            const zoneId = hostedZone.Id.replace("/hostedzone/", "");
            listOfZones.push(zoneId);
            promises.push(handleSingleZone.call(this, hostedZone, zoneId, zones, devices));
        });
        Promise.all(promises)
            .then(() => {
                resolve(listOfZones);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

/**
 * Handle creation of Zone, DNS express and Records
 * @param {Object} hostedZone
 * @param {String} zoneId
 * @param {Zones} zones
 * @param {Array} devices
 * @returns {Promise}
 */
const handleSingleZone = function (hostedZone, zoneId, zones, devices) {
    let localGetRecordsResponse;
    return new Promise((resolve, reject) => {
        awsHelper.getRecords(zoneId)
            .then((getRecordsResponse) => {
                localGetRecordsResponse = JSON.parse(JSON.stringify(getRecordsResponse));
                const zoneLocation = zones.isZoneInSet(zoneId);
                if (zoneLocation === -1) {
                    logger.fine("[handleSingleZone] adding zone", zoneId, "Zone name", hostedZone.Name);
                    const newZone = new Zone(zoneId, hostedZone.Name, getNSRecord(localGetRecordsResponse), getSoaRecord(localGetRecordsResponse));
                    zones.addZone(newZone);
                    let createZoneCommand = util.createZoneCommand(newZone);
                    return util.createZone.call(this, createZoneCommand, newZone.Name, devices);
                } else {
                    return Promise.resolve();
                }
                /*else {
                    const zone = zones.isZoneInSet(zoneId);
                    if (zones.isZoneDifferent(zone)) {
                        //promises.push();//todo send Zone delete + add API calls
                        zones.modifyZone(zone);
                    }
                }*/
            })
            .then(() => {
                const zoneLocation = zones.isZoneInSet(zoneId);
                return handleGetRecordsResponse.call(this, localGetRecordsResponse, zoneLocation, zones, devices);
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                logger.fine("[handleSingleZone] error", error);
                reject(error);
            });
    });
};

/**
 * Create NS record for zone file
 * @param {Object} getRecordsResponse
 * @returns {String}
 */
const getNSRecord = function (getRecordsResponse) {
    let NS = "";
    for (let i=0; i < getRecordsResponse.ResourceRecordSets.length; i++) {
        let record = getRecordsResponse.ResourceRecordSets[i];
        if (record.Type === "NS") {
            getRecordsResponse.ResourceRecordSets[i].ResourceRecords.forEach(function(r) {
                NS = NS + getRecordsResponse.ResourceRecordSets[i].TTL + ' NS    ' + r.Value + '\n                                            ';
            });
            getRecordsResponse.ResourceRecordSets.splice(i, 1);
            break;
        }
    }
    return NS;
};

/**
 * Create SOA record for zone file
 * @param {Object} getRecordsResponse
 * @returns {String}
 */
const getSoaRecord = function (getRecordsResponse) {
    let SOA;
    for (let i=0; i < getRecordsResponse.ResourceRecordSets.length; i++) {
        let record = getRecordsResponse.ResourceRecordSets[i];
        if (record.Type === "SOA") {
            let values = getRecordsResponse.ResourceRecordSets[i].ResourceRecords[0].Value.split(" ");
            SOA = getRecordsResponse.ResourceRecordSets[i].TTL + ' SOA ' + values[0] + ' ' + values[1] + '(' +
                '                                                                                         ' + values[2]+
                '                                                                                         ' + values[3]+
                '                                                                                         ' + values[4]+
                '                                                                                         ' + values[5]+
                '                                                                                         ' + values[6]+
                '                                                                                         )';
            getRecordsResponse.ResourceRecordSets.splice(i, 1);
            break;
        }
    }
    return SOA;
};

/**
 * Search if zone need to be deleted
 * @param {Array} listOfZones
 * @param {Zones} zones
 * @param {Array} devices
 * @returns {Promise}
 */
const deleteMissingZones = function (listOfZones, zones, devices) {
    let promises = [];
    return new Promise((resolve, reject) => {
        let currentList = zones.listOfZones();
        zones.listOfZones().forEach((zoneId) => {
            if (!listOfZones.includes(zoneId)) {
                let zone = zones.getZone(zones.isZoneInSet(zoneId));
                logger.fine("[[deleteMissingZones]] Deleting Zone", zoneId, "Zone name", zone.Name);
                zones.deleteZone(zoneId);
                promises.push(util.deleteZone.call(this, zone.Name, devices)); // send DELETE zone API call
            }
        });
        Promise.all(promises)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
    });
};
