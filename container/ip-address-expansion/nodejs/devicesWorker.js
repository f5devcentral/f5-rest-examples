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
const deviceUrlPath = `${uriPath}/devices`;

/**
 * Collection which contains a list of devices
 * 
 * @class DevicesWorker
 */
class DevicesWorker {

    constructor() {
        this.WORKER_URI_PATH = deviceUrlPath;
        this.isPersisted = true;
        this.isPostIdempotent = true;
    }

    /**
     * If this function is defined on the worker then it is an odata worker
     * @return {Object} Entity model
     */
    getSchema() {
        return {
            name: 'Devices',
            key: {
                propertyRefs: [{ name: 'name' }]
            },
            properties: [
                { name: 'name', type: 'Edm.String', nullable: false},
                { name: 'trustGroup', type: 'Edm.String'},
                { name: 'mgmtIp', type: 'Edm.String'},
                { name: 'mgmtPort', type: 'Edm.Int32'},
                { name: 'virtualIp', type: 'Edm.String'},
                { name: 'virtualPort', type: 'Edm.Int32'},
                { name: 'username', type: 'Edm.String'},
                { name: 'password', type: 'Edm.String'}
            ]
        };
    }
}

const notify = function (item) {
    return util.notifyApp.call(this, uriPath, item);
};

// this is subject to a race
// likely need a onPostCompleted
DevicesWorker.prototype.onPost = notify;
DevicesWorker.prototype.onPut = notify;
DevicesWorker.prototype.onPatch = notify;
DevicesWorker.prototype.onDelete = notify;

module.exports = DevicesWorker;
