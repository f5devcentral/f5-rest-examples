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
 * AddressWorker class
 *
 * @constructor
 */
class AddressWorker {
    constructor() {
        this.WORKER_URI_PATH = "shared/address";
        this.isPersisted = true;
        this.isInMemory = true;
        this.isPublic = true;
    }

    onStart(success) {
        success();
    }

    onPost(item) {
        const numRegEx = /\d/;

        // Matches "12345", "123456789", "12345-6789", "12345 6789", or "13245 - 6789"
        const zipCodeRegEx = /^\d{5}(?: |\s?-\s?)?(?:\d{4})?$/;

        if (numRegEx.test(item.city)) {
            throw new Error("City names can't have numbers.");
        }

        if (numRegEx.test(item.statename)) {
            throw new Error("State names can't have numbers.");
        }

        if (!zipCodeRegEx.test(item.zipcode)) {
            throw new Error("Invalid zip code format.");
        }

        return {
            name: item.name,
            blocknumber: item.blocknumber,
            street: item.street,
            unitnumber: item.unitnumber,
            city: item.city,
            statename: item.statename,
            zipcode: item.zipcode
        };
    }

    onGet(item) {
        return item;
    }

    /**
     * If this function is defined on the worker then it is a "collection"
     * @return {Object} Entity model
     * key is name.
     */
    getSchema() {
        return {
            name: 'Address',
            key: {
                propertyRefs: [{ name: 'name' }]
            },
            properties: [
                { name: 'name', type: 'Edm.String', nullable: false },
                { name: 'blocknumber', type: 'Edm.Int32', nullable: false },
                { name: 'street', type: 'Edm.String', nullable: false },
                { name: 'unitnumber', type: 'Edm.String', nullable: true },
                { name: 'city', type: 'Edm.String', nullable: false },
                { name: 'statename', type: 'Edm.String', nullable: true },
                { name: 'zipcode', type: 'Edm.String', nullable: false }
            ]
        };
    }
}

module.exports = AddressWorker;
