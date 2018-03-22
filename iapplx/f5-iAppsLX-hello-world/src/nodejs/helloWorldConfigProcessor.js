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

'use strict';

var configTaskUtil = require("./configTaskUtil");


/**
 * A demo processor which does not perform any real ICRD actions. It's extended from configProcessor
 * @constructor
 */
function HelloWorldConfigProcessor() {
}

HelloWorldConfigProcessor.prototype.WORKER_URI_PATH = "shared/iapp/processors/hello-world-js";

HelloWorldConfigProcessor.prototype.onStart = function (success) {
    this.apiStatus = this.API_STATUS.INTERNAL_ONLY;
    this.isPublic = true;


    configTaskUtil.initialize({
        restOperationFactory: this.restOperationFactory,
        eventChannel: this.eventChannel,
        restHelper : this.restHelper
    });

    success();
};

/**
 * Handles POST. It validates the input and accepts the rest request. Since this is no-op
 * processor, it sends a PATCH request to the block configuration
 * task updating state to BOUND
 *
 * @param configTaskState
 */
HelloWorldConfigProcessor.prototype.onPost = function(restOperation) {
    var configTaskState;
    try {
        configTaskState = configTaskUtil.getAndValidateConfigTaskState(restOperation);
        this.logger.info("configTaskState: ", configTaskState);
    } catch (ex) {
        restOperation.fail(ex);
        return;
    }
    this.completeRequest(restOperation, this.wellKnownPorts.STATUS_ACCEPTED);

    var referer = this.getUri().href;
    var auth = restOperation.getBasicAuthorization();
    var restOp = this.restOperationFactory.createRestOperationInstance()
        .setMethod("Post")
        .setUri(this.restHelper.makeRestjavadUri("/shared/echo"))
        .setReferer(referer)
        .setBody({"content": "helloWorldConfigProcessor.js"});
    this.restRequestSender.send(restOp).then(function(response) {
        configTaskUtil.sendPatchToBoundState(configTaskState, referer, auth);
    }).catch (function(err) {
        configTaskUtil.sendPatchToErrorState(configTaskState, err, referer, auth);
    }).done();
};

/**
 * Handles DELETE. It validates the input and accepts the rest request. Since this is no-op
 * processor, it  sends a PATCH request to the block configuration task updating state
 * to UNBOUND
 *
 * @param restOperation
 */
HelloWorldConfigProcessor.prototype.onDelete = function(restOperation) {
    var configTaskState;

    try {
        configTaskState = configTaskUtil.getAndValidateConfigTaskState(restOperation);
    } catch (ex) {
        restOperation.fail(ex);
        return;
    }

    this.completeRequest(restOperation, this.wellKnownPorts.STATUS_ACCEPTED);
    configTaskUtil.sendPatchToUnBoundState(configTaskState,
        this.getUri().href, restOperation.getBasicAuthorization());
};

module.exports = HelloWorldConfigProcessor;
