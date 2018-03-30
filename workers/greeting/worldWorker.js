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

/**
 * A simple worker that handles only HTTP GET
 * @constructor
 */
function WorldWorker() {}

WorldWorker.prototype.WORKER_URI_PATH = "shared/samples/world";
WorldWorker.prototype.isPublic = true;

/**
 * handle onGet HTTP request
 * @param {Object} restOperation
 * @return {Object} restOperation
 */
WorldWorker.prototype.onGet = function(restOperation) {
    restOperation.setBody("world");
    restOperation.setContentType("text/plain");
    this.completeRestOperation(restOperation);
};

module.exports = WorldWorker;
