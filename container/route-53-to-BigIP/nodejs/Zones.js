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
const logger = require('f5-logger').getInstance();

class Zones {

    constructor(Zones = []) {
        this.Zones = Zones;
    }

    /**
     * Add Zone to Zones Array
     * @param {Zone} zone
     */
    addZone(zone) {
        this.Zones.push(zone);
    }

    /**
     * Check if Zone is in Zones Array
     * @param {String} zoneId
     * @returns {Integer}
     */
    isZoneInSet(zoneId) {
        let location = -1;
        this.Zones.map((zone, index) => {
            if (zoneId === zone.Id) {
                location = index;
            }
        });
        return location;
    }

    /**
     * Delete Zone from Zones Array
     * @param {String} zoneId
     */
    deleteZone(zoneId) {
        let location = this.isZoneInSet(zoneId);
        if (location > -1){
            this.Zones.splice(location, 1);
        }
    }

    /**
     * Check if Current zone is different than the one in Zones Array
     * @param {Zone} zone
     * @returns {Boolean}
     */
    isZoneDifferent(zone) {
        let location = this.isZoneInSet(zone.Id);
        if (location > -1){
            let currentZone = JSON.parse(JSON.stringify(this.Zones[location]));
            delete currentZone.ResourceRecordSets;
            let comparisonZone = JSON.parse(JSON.stringify(zone));
            delete comparisonZone.ResourceRecordSets;
            return JSON.stringify(currentZone) !== JSON.stringify(comparisonZone);
        } else {
            return true;
        }
    }

    /**
     * Get list of Zones
     * @returns {Array}
     */
    listOfZones() {
        return this.Zones.map((zone) => (zone.Id));
    }

    /**
     * Get Zone by index
     * @param {Integer} index
     * @returns {Zone}
     */
    getZone(index) {
        return this.Zones[index];
    }
}

module.exports = Zones;