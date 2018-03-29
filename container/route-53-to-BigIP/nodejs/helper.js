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

const url = require('url');
const logger = require('f5-logger').getInstance();

/**
 * Get device groups that start with a string
 *
 * @param {String} match
 * @returns {Promise}
 */
const getDeviceGroupsLike = function (match) {
    match = match || 'dockerContainers';

    const deviceGroupsUri = this.restHelper.makeRestjavadUri('shared/resolver/device-groups');
    const getDeviceGroups = sendGet.call(this, deviceGroupsUri);

    return getDeviceGroups.then((restOp) => {
        const body = restOp.getBody();
        if (!(body && body.items)) { return []; }

        return body.items.map((deviceGroup) => {
            if (deviceGroup && deviceGroup.groupName && deviceGroup.groupName.startsWith(match)) {
                return deviceGroup.groupName;
            }
            return false;
        }).filter(Boolean);
    });
};

/**
 * Send identified request
 * @param {String} fullUrl
 * @param {String} groupName
 * @returns {Promise}
 */
const sendGetTrusted = function (fullUrl, groupName) {
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(url.parse(fullUrl))
        .setIdentifiedDeviceRequest(true)
        .setIdentifiedDeviceGroupName(groupName);
    return this.restRequestSender.sendGet(restOp);
};

/**
 * Send identified request
 * @param {String} fullUrl
 * @param {String} groupName
 * @returns {Promise}
 */
const sendPostTrusted = function (fullUrl, obj, groupName) {
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(url.parse(fullUrl))
        .setBody(obj)
        .setIdentifiedDeviceRequest(true)
        .setIdentifiedDeviceGroupName(groupName);
    return this.restRequestSender.sendPost(restOp);
};

/**
 * Send identified request delete
 * @param {String} fullUrl
 * @param {String} groupName
 * @returns {Promise}
 */
const sendDeleteTrusted = function (fullUrl, groupName) {
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(url.parse(fullUrl))
        .setIdentifiedDeviceRequest(true)
        .setIdentifiedDeviceGroupName(groupName);
    return this.restRequestSender.sendDelete(restOp);
};

/**
 * Helper function to send GET
 * @param {String} fullUrl
 * @returns {Promise} Promise resolved with RestOperation
 */
const sendGet = function (fullUrl) {
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendGet(restOp);
};

/**
 * Helper function to send Delete
 * @param {String} fullUrl
 * @param {String} user
 * @param {String} password
 * @returns {Promise} Promise resolved with RestOperation
 */
const sendDelete = function (fullUrl, user, password) {
    const auth = 'Basic ' + new Buffer(`${user}:${password}`).toString('base64');
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setBasicAuthorization(auth)
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendDelete(restOp);
};

/**
 * Helper function to send POST off box
 * @param {String} fullUrl
 * @param {Object} obj
 * @param {String} user
 * @param {String} password
 * @returns {Promise} Promise resolved with RestOperation
 */
const sendPost = function (fullUrl, obj, user, password) {
    const auth = 'Basic ' + new Buffer(`${user}:${password}`).toString('base64');
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setBody(obj)
        .setBasicAuthorization(auth)
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendPost(restOp);
};

/**
 * Helper function to send POST w/o auth
 * @param {String} fullUrl
 * @returns {Promise} Promise resolved with RestOperation
 */
const sendLocalPost = function (fullUrl, obj) {
    const restOp = this.restOperationFactory.createRestOperationInstance()
        .setBody(obj)
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendPost(restOp);
};

/**
 * Get A list of all devices
 * @param {String} devicePath
 * @returns {Promise}
 */
const getDevices = function (devicePath) {
    const devicesUrl = this.restHelper.makeRestnodedUri(devicePath);
    return new Promise((resolve, reject) => {
        sendGet.call(this, devicesUrl)
        .then((response) => {
            const responseValue = response.getBody().value;
            resolve (responseValue);
        }).catch((e) => {
            reject(e);
        });
    });
};

/**
 * Add a list of devices to device collection
 * @param {*} path
 * @param {*} devices 
 */
const createDevices = function (path, devices) {
    const promises = devices.map((device) => {
        if (device) {
            return createDevice.call(this, path, device);
        }
    });

    return Promise.all(promises);
};

/**
 * Add a device to the device collection
 * @param {String} path
 * @param {Object} device
 * @returns {Object}
 */
const createDevice = function (path, device) {
    const devicesUrl = this.restHelper.makeRestnodedUri(path);
    const createDevice = sendLocalPost.call(this, devicesUrl, device);

    return createDevice.then((restOp) => {
        return restOp.getBody();
    });
};

/**
 * Get the list of trusted devices from device
 * /shared/resolver/device-groups/{groupName}/devices
 * @param {String} url
 */
const getTrustedDevices = function (deviceGroupUrl, legacyDeviceGroupUrl) {
    const promise1 = sendGet.call(this, deviceGroupUrl);
    const promise2 = sendGet.call(this, legacyDeviceGroupUrl);
    return Promise.all([promise1, promise2]).then((responses) => {
        let data1 = responses[0].getBody();
        let data2 = responses[1].getBody();
        data1.items = data1.items.concat(data2.items);
        return data1;
    });
};

/**
 * Get the list of trusted devices from array of device groups
 * /shared/resolver/device-groups/{groupName}/devices
 *
 * @param {Array} deviceGroups array of group names
 * @returns {Promise}
 */
const getTrustedDevicesInGroups = function (deviceGroups) {
    deviceGroups = Array.isArray(deviceGroups) ? deviceGroups : [];
    const promises = deviceGroups.map((deviceGroup) => {
        const path = `shared/resolver/device-groups/${deviceGroup}/devices`;
        const deviceGroupUri = this.restHelper.makeRestjavadUri(path);
        return sendGet.call(this, deviceGroupUri);
    });

    return Promise.all(promises).then((responses) => {
        let trustedDevices = responses.map((response) => {

            if (response && response.getBody) {
                const data = response.getBody();
                if (data && data.items) {
                    return data.items;
                }
            }
        });

        return [].concat.apply([], trustedDevices);
    });
};

/**
 * Generate create zone command string
 * @param {Object} zone
 * @returns {String}
 */
const createZoneCommand = function (zone) {
    const zoneFile = 'cat << EOF > /var/tmp/' + zone.Name + '\n\
$ORIGIN ' + zone.Name + '\n\
@                 ' + zone.soaRecord + '\n\
                                            ' + zone.nsRecord + '\n\
\
EOF';

    return zoneFile + "\necho addZoneFile external " + zone.Name + " master db.external." + zone.Name + " \"/var/tmp/" + zone.Name + "\" | zrsh " + "rm -f /var/tmp/" + zone.Name + "";
};

/**
 * Creates zone on a list of BigIPs
 * @param {String} command
 * @param {String} zoneName
 * @param {Array} devices
 * @returns {Promise}
 */
const createZone = function (command, zoneName, devices) {
    executeBashCommands.call(this, command, devices)
    .then(() => {
        return createExpressZones.call(this, zoneName, devices);
    });
};

/**
 * Generate create record command string
 * @param {String} zoneName
 * @param {Object} record
 * @returns {String}
 */
const createRecordCommand = function (zoneName, record) {

    return "echo arr " + zoneName + " " + record.Name + " " + record.TTL + " " + record.Type + " " + record.getAddresses()[0] + " | zrsh";
};

/**
 * Generate delete record command string
 * @param {String} zoneName
 * @param {Object} record
 * @returns {String}
 */
const deleteRecordCommand = function (zoneName, record) {
    return "echo drr " + zoneName + " " + record.Name + " " + record.TTL + " " + record.Type + " " + record.getAddresses()[0] + " | zrsh";
};

/**
 * Add dns record
 * @param {String} zoneName
 * @param {Object} record
 * @param {Array} devices
 * @returns {Promise}
 */
const addRecord = function (zoneName, record, devices) {
    const command = createRecordCommand(zoneName, record);

    return executeBashCommands.call(this, command, devices)
};

/**
 * Delete dns record
 * @param {Object} zone
 * @param {Object} record
 * @param {Array} devices
 * @returns {Promise}
 */
const deleteRecord = function (zone, record, devices) {
    const command = deleteRecordCommand.call(this, zone, record);
    return executeBashCommands.call(this, command, devices)
};

/**
 * Delete DNZ Zone file on a list of devices
 * @param {String} zoneName
 * @param {Array} devices
 * @returns {Promise}
 */
const deleteZone = function (zoneName, devices) {
    const command = "echo delz external " + zoneName + " | zrsh";
    executeBashCommands.call(this, command, devices)
    .then(() => {
        return deleteExpressZones.call(this, zoneName, devices);
    });
};


/**
 * Execute bash command on a given list of devices
 * @param {String} command
 * @param {Array} devices
 * @returns {Promise}
 */
const executeBashCommands = function (command, devices) {
    const promises = devices.map((device) => {
        return executeBashCommand.call(this, command, device);
    });
    return Promise.all(promises);
};

/**
 * Execute bash command on a device
 * @param {String} command
 * @param {Object} device
 * @returns {Promise}
 */
const executeBashCommand = function (command, device) {
    const body = {"command": "run", "utilCmdArgs": "-c '"+command+"'"};

    logger.fine("[[executeBashCommand]]", JSON.stringify(body));

    const bashCommandUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/util/bash`;
    if (device.trustGroup) {
        return sendPostTrusted.call(this, bashCommandUrl, body, device.trustGroup);
    }
    return sendPost.call(this, bashCommandUrl, body, device.username, device.password);
};

/**
 * Create a DNS Express Zone for a give list of devices
 * @param {String} zoneName
 * @param {Array} devices
 * @returns {Promise}
 */
const createExpressZones = function (zoneName, devices) {
    const promises = [];
    devices.map((device) => {
        promises.push(createExpressZone.call(this, zoneName, device));
    });
    return Promise.all(promises);
};

/**
 * Create a DNS Express Zone for a give list of devices
 * @param {String} zoneName
 * @param {Array} devices
 * @returns {Promise}
 */
const deleteExpressZones = function (zoneName, devices) {
    const promises = devices.map((device) => {
        return deleteExpressZone.call(this, zoneName, device);
    });
    return Promise.all(promises);
};

/**
 * Create DNS express on remote device
 * @param {String} zoneName
 * @param {Object} device
 * @returns {Promise}
 */
const createExpressZone = function (zoneName, device) {
    let correctedZoneName = zoneName.replace(/\.$/, "");
    const body = {"name": correctedZoneName, "dnsExpressServer":"/Common/local"};
    const dnsExpressUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/dns/zone/`;
    if (device.trustGroup) {
        return sendPostTrusted.call(this, dnsExpressUrl, body, device.trustGroup);
    }
    return sendPost.call(this, dnsExpressUrl, body, device.username, device.password);
};

/**
 * Delete DNS express on remote device
 * @param {String} zoneName
 * @param {Object} device
 * @returns {Promise}
 */
const deleteExpressZone = function (zoneName, device) {
    let correctedZoneName = zoneName.replace(/\.$/, "");
    const dnsExpressUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/dns/zone/${correctedZoneName}`;
    if (device.trustGroup) {
        return sendDeleteTrusted.call(this, dnsExpressUrl, device.trustGroup);
    }
    return sendDelete.call(this, dnsExpressUrl, device.username, device.password);
};

module.exports = {
    getDeviceGroupsLike: getDeviceGroupsLike,
    getTrustedDevicesInGroups: getTrustedDevicesInGroups,
    getTrustedDevices: getTrustedDevices,
    createDevices: createDevices,
    deleteZone: deleteZone,
    addRecord: addRecord,
    deleteRecord: deleteRecord,
    createZone: createZone,
    createZoneCommand: createZoneCommand,
    getDevices: getDevices
};
