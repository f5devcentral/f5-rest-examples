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


"use strict";

const util = require('./helper');

const uriPath = 'shared/iapp/ipAddressExpansion';
const configUrlPath = `${uriPath}/config`;

/**
 * Singleton which contains common config
 *
 * @class ConfigWorker
 */
class ConfigWorker {
    constructor() {
        this.WORKER_URI_PATH = configUrlPath;
        this.isPersisted = true;
        this.isPublic = true;
        this.isSingleton = true;
    }

    /**
     * Return default state of document
     *
     * @returns {Object|Promise} default state at startup
     * @memberof ConfigWorker
     */
    getDefaultState() {
        return {
            poolName: "TestPool",
            poolStart: "192.1.1.11",
            poolEnd: "192.1.1.21",
            poolPort: 8888
        };
    }

    /**
     * Return odata schema for document
     *
     * @returns {Object}
     * @memberof ConfigWorker
     */
    getSchema() {
        return {
            name: 'Config',
            key: {
                propertyRefs: [{ name: 'poolName' }]
            },
            properties: [
                { name: 'poolName', type: 'Edm.String', nullable: false},
                { name: 'poolStart', type: 'Edm.String'},
                { name: 'poolEnd', type: 'Edm.String'},
                { name: 'poolPort', type: 'Edm.Int32'}
            ]
        };
    }
}

const notify = function (item) {
    return util.notifyApp.call(this, uriPath, item);
};

// this is subject to a race
// likely need a onPostCompleted
ConfigWorker.prototype.onPut = notify;
ConfigWorker.prototype.onPatch = notify;

module.exports = ConfigWorker;
