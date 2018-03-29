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

class ResourceRecordSet {

    constructor(name = "", type = "", ttl = 0, records = []) {
        this.Name = name;
        this.Type = type;
        this.TTL = ttl;
        this.Records = new Set(records);
    }

    /**
     * Add Address to Records Set
     * @param {String} record
     */
    addAddress(record) {
        this.Records.add(record);
    }

    /**
     * Remove Address from Records Set
     * @param {String} record
     */
    removeAddress(record) {
        this.Records.delete(record);
    }

    /**
     * Get all Addresses from Records Set
     * @returns {Array}
     */
    getAddresses() {
        return Array.from(this.Records);
    }

    /**
     * Checks if Addresses is in the Records Set
     * @returns {Boolean}
     */
    isAddressInSet(record) {
        return this.Records.has(record);
    }
}

module.exports = ResourceRecordSet;
