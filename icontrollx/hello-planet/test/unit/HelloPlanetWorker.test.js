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

describe('hello-planet worker', function () {
  mocha.before(function (done) {
    file = path.resolve('./src/nodejs', 'HelloPlanetWorker.js');
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

  it('should be able to call custom functions', function () {
    assert.equal(worker.sayHello(), 'Hello World');
  });

});
