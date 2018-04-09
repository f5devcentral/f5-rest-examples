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

const url = require('url');
const logger = require('f5-logger').getInstance();

/**
 * A simple REST Worker that demonstrates updating config on a bigip
 * @constructor
 */
class HelloBigipWorker {
    constructor() {
        this.WORKER_URI_PATH = "Nodes";
        this.isPublic = true;
    }

    /**
     * handle onGet HTTP request
     * @param {Object} restOperation
     */
    onGet(restOperation) {
        logger.info('/Nodes GET request');

        this.getNodes(restOperation)
        .then((nodes)=> {
            const body = nodes.getBody();
            const items = body.items || [];
            restOperation.setBody(items);
            this.completeRestOperation(restOperation);
        })
        .catch((err) => {
            logger.error(err);
        });
    }

    /**
     * handle onPost HTTP request
     * @param {Object} restOperation
     */
    onPost(restOperation) {
        logger.info('/Nodes POST request');

        const body = restOperation.getBody();
        try {
            this.validateBody(body);

            const nodes = this.getIPs(body.start, body.end);

            const promises = nodes.map((node) => {
                return this.createNode(node, restOperation);
            });

            Promise.all(promises)
            .then(() => {
                restOperation.setBody(nodes);
                this.completeRestOperation(restOperation);
            });

        } catch (err) {
            restOperation.fail(err);
        }
    }

    /**
     * Create a handler for requests to/example
     * @return {Object} example of the object model for this worker
     */
    getExampleState() {
        const example = new Object({
            "start": "192.168.1.1",
            "end": "192.168.1.33"
        });
        example.kind = this.restHelper.makeKind(this.WORKER_URI_PATH, this);
        example.selfLink = this.restHelper.makePublicUri(this.getUri()).href;

        return example;
    }


    /// Public Function Example ///


    /**
     * Validate incoming POST body
     * @param {Object} body
     * @throws {Error} throws error if body is invalid
     */
    validateBody(body) {
        if (!body) {
            throw new Error("no POST body");
        }

        if (!body.start || !body.end) {
            throw new Error("body needs 'start' and 'end' values");
        }

        if (!(this.isValidIPv4(body.start) && this.isValidIPv4(body.end))) {
            throw new Error("start and end are invalid IPv4 addresses");
        }

        const start = parseInt(body.start.split('.').pop(), 10);
        const end = parseInt(body.end.split('.').pop(), 10);
        if (start > end) {
            throw new Error("start address must be lower than end address");
        }

        return true;
    }

    /**
     * Regex to validate IPv4
     * @param {String} ip
     * @returns {Boolean}
     */
    isValidIPv4(ip) {
        const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;
        return ipRegex.test(ip);
    }

    /**
     * Returns an array of pool members based off the
     * last octal of the ip range
     * @param {Object} config
     */
    getIPs(nodeStart, nodeEnd) {
        const result = [];
        const baseIp = nodeStart.split('.').slice(0, 3).join('.');
        const start = parseInt(nodeStart.split('.').pop(), 10);
        const end = parseInt(nodeEnd.split('.').pop(), 10);

        for (let i = start; i <= end; i++) {
            result.push({
                name: `${baseIp}.${i}`,
                address: `${baseIp}.${i}`
            });
        }

        return result;
    }


    /// Util ///

    /**
     * Create a node on this device
     *
     * @param {Object} node
     * @param {RestOperation} originalRestOp
     * @returns {Promise}
     */
    createNode(node, originalRestOp) {
        const nodeUrl = this.restHelper.makeRestjavadUri('tm/ltm/node');

        const restOp = this.restOperationFactory.createRestOperationInstance()
            .setUri(url.parse(nodeUrl))
            .setBody(node)
            .setIsSetBasicAuthHeader(true)
            .setBasicAuthorization(originalRestOp.getBasicAuthorization());

        return this.restRequestSender.sendPost(restOp);
    }


    getNodes(originalRestOp) {
        const nodeUrl = this.restHelper.makeRestjavadUri('tm/ltm/node');

        const restOp = this.restOperationFactory.createRestOperationInstance()
            .setUri(url.parse(nodeUrl))
            .setIsSetBasicAuthHeader(true)
            .setBasicAuthorization(originalRestOp.getBasicAuthorization());

        return this.restRequestSender.sendGet(restOp);
    }
}


module.exports = HelloBigipWorker;
