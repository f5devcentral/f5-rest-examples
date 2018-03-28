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

const logger = require('f5-logger').getInstance();

const util = require('./helper');

const uriPath = 'shared/iapp/ipAddressExpansion';

const configUrlPath = `${uriPath}/config`;
const deviceUrlPath = `${uriPath}/devices`;
const deviceGroupPath = `shared/resolver/device-groups/dockerContainers/devices`;

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

        this.setPresentationHtmlFilepath("iapps/ipAddressExpansion/index.html");

        success();
    }

    onStartCompleted(success) {
        logger.info('getting trusted devices');
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
        .catch((e) => {
            logger.severe(e);
        })
        .finally(() => {
            util.getDevicesAndConfig.call(this, configUrlPath, deviceUrlPath)
            .then((newState) => {
                state = Object.assign({}, newState);
            });
            success();
        });
    }

    /**
     * Get the state from devices and config workers
     * 
     * @param {any} restOperation 
     * @memberof HttpRequestWorker
     */
    onGet(restOperation) {
        util.getDevicesAndConfig.call(this, configUrlPath, deviceUrlPath)
        .then((newState) => {
            state = Object.assign({}, newState);
            restOperation.setBody(JSON.stringify(state));
            this.completeRestOperation(restOperation);
        })
        .catch((e) => {
            restOperation.fail(e);
        });
    }

    /**
     * Send updates out to all devices
     *
     * @param {any} restOperation
     * @memberof HttpRequestWorker
     */
    onPost(restOperation) {
        util.cleanRemoteDevices.call(this, state)
        .then(() => {
            return util.getConfigAndSendToDevices.call(this, configUrlPath, deviceUrlPath);
        })
        .catch((e) => {
            return util.getConfigAndSendToDevices.call(this, configUrlPath, deviceUrlPath);
        }).finally(() => {
            util.getDevicesAndConfig.call(this, configUrlPath, deviceUrlPath)
            .then((newState) => {
                state = Object.assign({}, newState);
                restOperation.setBody(JSON.stringify(state));
                this.completeRestOperation(restOperation);
            });
        });
    }
}

module.exports = HttpRequestWorker;
