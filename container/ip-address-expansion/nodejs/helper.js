/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
*/


'use strict';

const url = require('url');

/**
 * Send identified request
 * @param {String} fullUrl
 * @param {String} groupName
 * @returns {Promise}
 */
const sendGetTrusted = function (fullUrl, groupName) {
    var restOp = this.restOperationFactory.createRestOperationInstance()
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
    var restOp = this.restOperationFactory.createRestOperationInstance()
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
    var restOp = this.restOperationFactory.createRestOperationInstance()
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
    var restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendGet(restOp);
};

/**
 * Helper function to send Delete
 * @param {String} fullUrl
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
    var restOp = this.restOperationFactory.createRestOperationInstance()
        .setBody(obj)
        .setUri(url.parse(fullUrl));
    return this.restRequestSender.sendPost(restOp);
};

/**
 * Notify app worker about changes in state
 * @param {Object} item
 */
const notifyApp = function (uriPath, item) {
    const appUrl = this.restHelper.makeRestnodedUri(uriPath);
    const postApp = sendLocalPost.call(this, appUrl, item || {});

    postApp.then((a) => {
        console.log('Posted to ipAddress worker');
    });

    return item;
};

/**
 * Get A list of all devices and config
 * @returns {Promise}
 */
const getDevicesAndConfig = function (configPath, devicePath) {
    const configUrl = this.restHelper.makeRestnodedUri(configPath);
    const devicesUrl = this.restHelper.makeRestnodedUri(devicePath);
    const getConfig = sendGet.call(this, configUrl);
    const getDevices = sendGet.call(this, devicesUrl);

    return new Promise((resolve, reject) => {
        Promise.all([getDevices, getConfig])
        .then((response) => {
            const newState = {
                config: response[1].getBody(),
                devices: response[0].getBody().value
            };

            resolve (newState);
        }).catch((e) => {
            reject(e);
        });
    });
};

/**
 * Get devices collection
 * @param {String} path
 * @returns {Promise}
 */
const getDevices = function (path) {
    const devicesUrl = this.restHelper.makeRestnodedUri(path);
    const getDevices = sendGet.call(this, devicesUrl);

    return getDevices.then((restOp) => {
        return restOp.getBody().value;
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
 */
const createDevice = function (path, device) {
    const devicesUrl = this.restHelper.makeRestnodedUri(path);
    const createDevice = sendLocalPost.call(this, devicesUrl, device);

    return createDevice.then((restOp) => {
        return restOp.getBody();
    });
};

/**
 * Get config singleton
 * @param {String} path
 * @returns {Promise}
 */
const getConfig = function (path) {
    const configUrl = this.restHelper.makeRestnodedUri(path);
    const getConfig = sendGet.call(this, configUrl);

    return getConfig.then((restOp) => {
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
 * Get the config and update all devices
 * @param {String} configPath
 * @param {String} devicePath
 * @returns {Promise}
 */
const getConfigAndSendToDevices = function (configPath, devicePath) {
    let newState = {};

    return getConfig.call(this, configPath)
    .then((c) => {
        newState.config = c;
        return getDevices.call(this, devicePath);
    })
    .then((d) => {
        newState.devices = d;
        return createPools.call(this, newState.devices, newState.config);
    })
    .then((resolved) => {
        const restOp = resolved[0];
        if (restOp && restOp.getBody()) {
            const poolFullPath = restOp.getBody().fullPath;
            return createVirtuals.call(this, newState.devices, poolFullPath);
        }
        return null;
    },(rejected) => {
        const restOp = rejected.getResponseOperation();
        if (restOp && restOp.getBody()) {
            // hack to determine pool fullPath if already created
            const poolFullPath = `/Common/${newState.config.poolName}`;
            return createVirtuals.call(this, newState.devices, poolFullPath);
        }
        return null;
    })
    .then((r) => {
        return newState;
    })
    .catch((e) => {
        console.log(e);
    });
};

/**
 * Create a virtual server with a pool for a given list of devices
 * @param {Array} devices
 * @param {String} poolFullPath
 * @returns {Promise}
 */
const createVirtuals = function (devices, poolFullPath) {
    const promises = devices.map((device) => {
        if (!device.virtualIp || !device.virtualPort) {
            return Promise.resolve();
        }
        return createVirtualWithPool.call(this, device, poolFullPath);
    });

    return Promise.all(promises);
};

/**
 * Create a virtual server with a pool for a given device
 * @param {Object} device
 * @param {String} poolFullPath
 * @returns {Promise}
 */
const createVirtualWithPool = function (device, poolFullPath) {
    const virtualUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/virtual`;

    const virtual = {
        name: `${device.virtualIp}`,
        destination: `${device.virtualIp}:${device.virtualPort}`,
        mask: '255.255.255.255',
        pool: poolFullPath
    };

    if (device.trustGroup) {
        return sendPostTrusted.call(this, virtualUrl, virtual, device.trustGroup);
    }

    return sendPost.call(this, virtualUrl, virtual, device.username, device.password);
};

/**
 * Delete virtuals from a list of devices
 * @param {Array} devices
 */
const deleteVirtualFromDevices = function (devices) {
    const promises = devices.map((device) => {
        if (!device.virtualIp) {
            return Promise.resolve();
        }
        return deleteVirtualFromDevice.call(this, device);
    });

    return Promise.all(promises);
};

/**
 * Delete virtual from a device
 * @param {Object} device
 */
const deleteVirtualFromDevice = function (device) {
    const virtualUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/virtual/~Common~${device.virtualIp}`;

    if (device.trustGroup) {
        return sendDeleteTrusted.call(this, virtualUrl, device.trustGroup);
    }

    return sendDelete.call(this, virtualUrl, device.username, device.password);
};

/**
 * Create a pool for a give list of devices
 * @param {Array} devices
 * @param {Object} config
 * @returns {Promise}
 */
const createPools = function (devices, config) {
    const promises = devices.map((device) => {
        return createPool.call(this, device, config);
    });

    return Promise.all(promises);
};

/**
 * Create a pool on a device
 * @param {Object} device
 * @param {Object} config
 * @returns {Promise}
 */
const createPool = function (device, config) {
    const poolUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/pool`;

    const pool = {
        name: config.poolName,
        members: makePoolMembers(config)
    };

    if (device.trustGroup) {
        return sendPostTrusted.call(this, poolUrl, pool, device.trustGroup);
    }

    return sendPost.call(this, poolUrl, pool, device.username, device.password);
};

/**
 * Returns an array of pool members based off the
 * last octal of the ip range
 * @param {Object} config
 */
const makePoolMembers = function (config) {
    const result = [];
    const baseIp = config.poolStart.split('.').slice(0, 3).join('.');
    const start = parseInt(config.poolStart.split('.').pop(), 10);
    const end = parseInt(config.poolEnd.split('.').pop(), 10);
    const port = config.poolPort;

    for (let i = start; i <= end; i++) {
        result.push({
            name: `${baseIp}.${i}:${port}`,
            address: `${baseIp}.${i}`
        });
    }

    return result;
};

/**
 * Delete pool from list of devices
 * @param {Array} devices
 * @param {Object} config
 */
const deletePoolFromDevices = function (devices, config) {
    const promises = devices.map((device) => {
        if (!device.virtualIp) {
            return Promise.resolve();
        }
        return deletePoolFromDevice.call(this, device, config);
    });

    return Promise.all(promises);
};

/**
 * Delete pool from a device
 * @param {Object} device
 * @param {Object} config
 */
const deletePoolFromDevice = function (device, config) {
    const poolUrl = `https://${device.mgmtIp}:${device.mgmtPort}/mgmt/tm/ltm/pool/~Common~${config.poolName}`;

    if (device.trustGroup) {
        return sendDeleteTrusted.call(this, poolUrl, device.trustGroup);
    }

    return sendDelete.call(this, poolUrl, device.username, device.password);
};

/**
 * Delete virtual and pool from a list of devices
 * @param {Object} state
 */
const cleanRemoteDevices = function (state) {
    return deleteVirtualFromDevices.call(this, state.devices)
    .then(() => {
        return deletePoolFromDevices.call(this, state.devices, state.config);
    });
};


module.exports = {
    getDeviceGroupsLike: getDeviceGroupsLike,
    getTrustedDevicesInGroups: getTrustedDevicesInGroups,
    getDevicesAndConfig: getDevicesAndConfig,
    getConfigAndSendToDevices: getConfigAndSendToDevices,
    notifyApp: notifyApp,
    getTrustedDevices: getTrustedDevices,
    createDevices: createDevices,
    cleanRemoteDevices: cleanRemoteDevices
};
