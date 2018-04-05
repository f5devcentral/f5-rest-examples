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

const helloPlanetUrlPath = "/Hello";
const planetUrlPath = "/Planet";

/**
 * A simple REST Worker that handles only HTTP GET
 * @constructor
 */
class HelloPlanetWorker {
    constructor() {
        this.WORKER_URI_PATH = helloPlanetUrlPath;
        this.isPublic = true;
    }

    /**
     * onStart handler
     * 
     * This function is called before the worker becomes available
     *
     * @param {Function} success 
     */
    onStart(success) {
        const planetUrl = this.restHelper.makeRestnodedUri(planetUrlPath);
        this.dependencies.push(planetUrl);

        success();
    }

    /**
     * handle onGet HTTP request
     * @param {Object} restOperation
     */
    onGet(restOperation) {
        //HTTP get to dependency planet worker
        this.sendGet(planetUrlPath, restOperation.getBasicAuthorization())
        .then((response) => {
            this.completeOperation(restOperation, this.sayHello(response.getBody().planet));
        }, (err) => {
            this.logger.error(err);
            this.completeOperation(restOperation, this.sayHello());
        });
    }

    /// Helper Functions ///

    /**
     * Helper function to set body, content type
     * and resolve operation
     * @param {Object} restOperation
     * @param {String} body
     */
    completeOperation(restOperation, body) {
        restOperation.setContentType("text/plain");
        restOperation.setBody(body);
        this.completeRestOperation(restOperation);
    }

    /**
     * Make a basic REST Op. The URI identifies the path/host/port. The method is a
     * camelcase HTTP verb (i.e. Post, Get, Put, ...). The basicAuth is used for authentication
     * details on the call.
     * @param {String} fullUrl - url path for rest query
     * @return {Promise} promise with output from REST operation
     */
    sendGet(fullUrl ,basicAuth) {
        var restOp = this.restOperationFactory.createRestOperationInstance()
            .setUri(this.restHelper.makeRestnodedUri(fullUrl))
            .setIsSetBasicAuthHeader(!!basicAuth)
            .setBasicAuthorization(basicAuth);
        return this.restRequestSender.sendGet(restOp);
    }

    /**
     * Return a Hello [planet] string
     *
     * @param {String} planet
     * @return {String}
     */
    sayHello(planet) {
        planet = planet || "World";
        return `Hello ${planet}`;
    }
}

module.exports = HelloPlanetWorker;
