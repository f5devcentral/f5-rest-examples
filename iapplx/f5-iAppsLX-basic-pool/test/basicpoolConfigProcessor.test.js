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

var assert = require('assert');

var mocha = require('mocha');
var path = require('path');

//commented out until the middleware becomes a local node_modules dependency
describe('f5-iapplx-basic-pool iapplx config processor', function () {
  mocha.before(function (done) {
    done();
  });

  mocha.after(function (done) {
    done();
  });

  it('should be able to create a config processor', function () {
    var file = path.resolve('./src/nodejs', 'basicPoolConfigProcessor.js');
  	var configProcObj = require(file);
    var configProc = new configProcObj();

    assert.equal(typeof configProcObj, 'function');
  	assert.equal(typeof configProc, 'object');
  	assert.equal(typeof configProc.WORKER_URI_PATH, 'string');
  });

});