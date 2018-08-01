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

const rp = require('request-promise');

const user = process.env.USER;
const pass = process.env.PASS;

function checkRestEndpoint(uri, maxRetries) {
    const MAX_RETRIES = maxRetries || 30;

    return new Promise((resolve, reject) => {
        function check(retries) {
            return rp(getRequestOptions(uri))
            .then((data) => {
                try {
                    if (data && data.error) {
                        check(retries + 1);
                        return;
                    }
                    resolve(data);
                } catch (e) {
                    throw e;
                }
            })
            .catch((e) => {
                if (retries > MAX_RETRIES) { return reject(e); }
                setTimeout(check.bind(null, retries + 1), 1000);
            });
        }
        check(0);
    });
}

function postData(uri, data) {
    return rp(getRequestOptions(uri, 'POST', data));
}

function deleteData(uri) {
    return rp(getRequestOptions(uri, 'DELETE'));
}

function getRequestOptions(uri, method, data) {
    const opts = {
        uri: uri,
        json: true, // json parse response
        method: method || 'GET',
        headers: {
            Authorization: getBasicAuthorization(user, pass),
            'content-type': 'application/json'
        }
    };

    if (data) {
        opts.body = data;
    }

    return opts;
}

function getBasicAuthorization(user, pass) {
    return 'Basic ' + new Buffer(`${user}:${pass}`)
                    .toString('base64');
}

module.exports = {
    postData: postData,
    deleteData: deleteData,
    checkRestEndpoint: checkRestEndpoint,
    getRequestOptions: getRequestOptions,
    getBasicAuthorization: getBasicAuthorization
};
