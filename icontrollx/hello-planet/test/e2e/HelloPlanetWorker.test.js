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
const chai = require('chai');

const testUtil = require('../util/testUtil');

const host = process.env.HOST;

const baseUri = `https://${host}/mgmt`;
const helloUri = `${baseUri}/Hello`;

// self-signed so ignore cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Basic e2e test suite
 */
describe('End-To-End (e2e) test suite', () => {

    before(function (done) {
        Promise.all([
            testUtil.checkRestEndpoint(`${helloUri}/available`),
        ]).then(() => {
            done();
        }).catch((e) => {
            done(e);
        });
    });

    after(function (done) {
        done();
    });

    it('should return data from /Hello worker', (done) => {
        rp(testUtil.getRequestOptions(helloUri))
        .then((data) => {
            chai.expect(data).to.have.string('Hello');
            done();
        })
        .catch((e) => {
            done(e);
        });
    });

});
