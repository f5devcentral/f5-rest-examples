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
const AWS = require('aws-sdk');

AWS.config.update({accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey});
AWS.config.update({region: process.env.region});
const route53 = new AWS.Route53();

/**
 * Send listHostedZones AWS SDK request
 * @returns {Promise}
 */
const getHostedZones = function() {
    return new Promise((resolve, reject) => {
        route53.listHostedZones({}, (err,data) => {
            if(!err) {
                console.log(data);
                resolve(data);
            }
            reject(err);
        });
    })
};

/**
 * Send listResourceRecordSets AWS SDK request
 * @param {String} zoneName
 * @returns {Promise}
 */
const getRecords = function(zoneName) {
    return new Promise((resolve, reject) => {
        route53.listResourceRecordSets({HostedZoneId: zoneName}, (err,data) => {
            if(!err) {
                console.log(data);
                resolve(data);
            }
            reject(err);
        });
    });
};

module.exports = {
    getHostedZones: getHostedZones,
    getRecords: getRecords
};
