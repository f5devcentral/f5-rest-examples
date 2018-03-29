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

class Zone {

    constructor(Id, Name, nsRecord, soaRecord) {
        this.Id = Id;
        this.Name = Name;
        this.nsRecord = nsRecord;
        this.soaRecord = soaRecord;
        this.ResourceRecordSets = [];
    }

    /**
     * Add record to resourceRecordSet
     * @param {ResourceRecordSet} record
     */
    addRecordSet(record) {
        this.ResourceRecordSets.push(record);
    }

    /**
     * Check if record in resourceRecordSet
     * @param {String} recordName
     * @returns {Integer}
     */
    isRecordInSet(recordName) {
        let location = -1;
        this.ResourceRecordSets.map((resourceRecord, index) => {
            if (recordName === resourceRecord.Name) {
                location = index;
            }
        });
        return location;
    }

    /**
     * Get list of records record in resourceRecordSet
     * @param {String} recordName
     * @returns {Object}
     */
    getRecord(recordName) {
        return this.ResourceRecordSets[this.isRecordInSet(recordName)];
    }

    /**
     * Get list of records record in resourceRecordSet
     * @returns {Array}
     */
    getRecordList() {
        return this.ResourceRecordSets.map((record) => (record.Name));
    }

    /**
     * Delete record in resourceRecordSet
     * @param {String} recordName
     */
    deleteRecord(recordName) {
        let location = this.isRecordInSet(recordName);
        if (location > -1){
            this.ResourceRecordSets.splice(location, 1);
        }
    }

    /**
     * Modify record in resourceRecordSet
     * @param {ResourceRecordSet} record
     */
    modifyRecord(record) {
        let location = this.isRecordInSet(record.Name);
        if (location > -1){
            this.ResourceRecordSets[location] = record;
        }
    }

    /**
     * Checks if Zone resourceRecordSet not equals to given resourceRecordSet
     * @param {Array} resourceRecordSets
     * @returns {Boolean}
     */
    areResourceRecordSetsDifferent(resourceRecordSets) {
        return JSON.stringify(this.ResourceRecordSets) !== JSON.stringify(resourceRecordSets);
    }
}

module.exports = Zone;