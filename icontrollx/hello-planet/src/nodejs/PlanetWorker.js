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

/**
 * Singleton Worker
 *
 * @class PlanetWorker
 */
class PlanetWorker {
    constructor() {
        this.WORKER_URI_PATH = '/Planet';
        this.isPersisted = true;
        this.isPublic = true;
        this.isSingleton = true;
    }

    /**
     * Return default state of document
     *
     * @returns {Object|Promise} default state at startup
     * @memberof PlanetWorker
     */
    getDefaultState() {
        return {
            planet: "Earth"
        };
    }

    /**
     * Return odata schema for document
     *
     * @returns {Object}
     * @memberof PlanetWorker
     */
    getSchema() {
        return {
            name: 'Planet',
            key: {
                propertyRefs: [{ name: 'planet' }]
            },
            properties: [
                { name: 'planet', type: 'Edm.String', nullable: false}
            ]
        };
    }
}

module.exports = PlanetWorker;
