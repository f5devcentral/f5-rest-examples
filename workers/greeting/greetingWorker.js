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


var q = require('q');
var url = require('url');

/**
 * A simple worker that handles multiple worker dependencies
 * @constructor
 */
function GreetingWorker() {}

GreetingWorker.prototype.WORKER_URI_PATH = "shared/samples/greeting";
GreetingWorker.prototype.isPublic = true;

const helloUrlPath = "/shared/samples/hello";
const worldUrlPath = "/shared/samples/world";

/**
 * Make a basic REST Op. The URI identifies the path/host/port. The method is a
 * camelcase HTTP verb (i.e. Post, Get, Put, ...). The basicAuth is used for authentication
 * details on the call.
 * @param {String} fullUrl - url path for rest query
 * @return {Promise} promise with output from REST operation
 */
var sendGet = function (fullUrl ,basicAuth) {
    var restOp = this.restOperationFactory.createRestOperationInstance()
        .setUri(this.restHelper.makeRestnodedUri(fullUrl))
        .setContentType("text/plain")
        .setIsSetBasicAuthHeader(!!basicAuth)
        .setBasicAuthorization(basicAuth);
    return this.restRequestSender.sendGet(restOp);
};

/**
 * Format greeting response
 * @param hello
 * @param world
 * @returns {string}
 */
var formatGreeting = function (hello, world) {
    return [hello.toUpperCase(), " ",  world.toUpperCase(), "!"].join("");
};

/**
 * Handle Startup
 *
 * add dependencies required for this worker. This worker will be marked
 * available after all of the dependencies are available.
 *
 * @param {Function} success
 */
GreetingWorker.prototype.onStart = function(success) {
    var helloUrl = this.restHelper.makeRestnodedUri(helloUrlPath);
    var worldUrl = this.restHelper.makeRestnodedUri(worldUrlPath);
    this.dependencies.push(helloUrl);
    this.dependencies.push(worldUrl);
    success();
};

/**
 * handle onGet HTTP request
 *
 * Make request to two dependent workers (helloWorker and worldWorker) and
 * compose the results.
 *
 * @param {Object} restOperation
 * @return {Object} restOperation
 */
GreetingWorker.prototype.onGet = function(restOperation) {
    var handleError = function (err) { restOperation.fail(err); };

    try {
        var helloCall = sendGet.call(this, helloUrlPath, restOperation.getBasicAuthorization());
        var worldCall = sendGet.call(this, worldUrlPath, restOperation.getBasicAuthorization());

        var handleResolvedCalls = function (hello, world) {
            restOperation.setContentType("text/plain");
            restOperation.setBody(formatGreeting(hello.getBody(), world.getBody()));
            this.completeRestOperation(restOperation);
        };

        q.spread([helloCall, worldCall], handleResolvedCalls.bind(this)).catch(handleError);
    } catch (err) {
        handleError(err);
    }
};

module.exports = GreetingWorker;
