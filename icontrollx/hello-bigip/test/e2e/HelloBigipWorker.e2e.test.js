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

const path = require('path');
const rp = require('request-promise');
const chai = require('chai');

const testUtil = require('../util/testUtil');

const host = process.env.HOST;

const file = path.resolve('./src/nodejs', 'HelloBigipWorker.js');
const workerObj = require(file);
const worker = new workerObj();

const baseUri = `https://${host}/mgmt`;
const workerUri = `${baseUri}/${worker.WORKER_URI_PATH}`;

// self-signed so ignore cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Basic e2e test suite
 */
describe('End-To-End (e2e) test suite', () => {

    before(function (done) {
        Promise.all([
            testUtil.checkRestEndpoint(`${workerUri}/available`),
        ]).then(() => {
            done();
        }).catch((e) => {
            done(e);
        });
    });

    after(function (done) {
        done();
    });

    it(`should return data from ${workerUri} worker`, (done) => {
        rp(testUtil.getRequestOptions(workerUri))
        .then((data) => {
            chai.expect(data).to.be.an('array');
            done();
        })
        .catch((e) => {
            done(e);
        });
    });

});
