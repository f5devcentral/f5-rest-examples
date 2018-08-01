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

const assert = require('assert');

const mocha = require('mocha');
const path = require('path');

let file;
let workerObj;
let worker;

describe('hello-bigip worker', function () {
  mocha.before(function (done) {
    file = path.resolve('./src/nodejs', 'HelloBigipWorker.js');
    workerObj = require(file);
    worker = new workerObj();
    done();
  });

  mocha.after(function (done) {
    done();
  });

  it('should be able to create a rest worker', function () {
    assert.equal(typeof workerObj, 'function');
  	assert.equal(typeof worker, 'object');
  	assert.equal(typeof worker.WORKER_URI_PATH, 'string');
  });

  it('should validate an IP address', function () {
    assert.equal(worker.isValidIPv4(), false);
    assert.equal(worker.isValidIPv4(''), false);
    assert.equal(worker.isValidIPv4(null), false);
    assert.equal(worker.isValidIPv4(123), false);
    assert.equal(worker.isValidIPv4('abc'), false);
    assert.equal(worker.isValidIPv4('1.3.4'), false);
    assert.equal(worker.isValidIPv4('259.3.4.1'), false);
    assert.equal(worker.isValidIPv4('1.2.3.4'), true);
    assert.equal(worker.isValidIPv4('13.23.33.43'), true);
  });

  it('should validate POST body', function () {
    assert.throws(() => { worker.validateBody(); }, Error);
    assert.throws(() => { worker.validateBody(''); }, Error);

    assert.equal(worker.validateBody({start: "192.168.12.1", end: "192.168.12.10"}), true);
  });

  it('should create a range of IP addresses', function () {
    const range = {start: "192.168.12.1", end: "192.168.12.10"};

    const ips = worker.getIPs(range.start, range.end);

    assert.equal(ips.length, 10);
    assert.equal(ips[0].address, '192.168.12.1');
    assert.equal(ips[9].address, '192.168.12.10');
  });

});
