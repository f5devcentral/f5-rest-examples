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


var url = require("url");

var block = {
    "state": {
        "UNBOUND": "UNBOUND",
        "BINDING": "BINDING",
        "BOUND": "BOUND",
        "UNBINDING": "UNBINDING",
        "ERROR": "ERROR",
        "TEMPLATE": "TEMPLATE"
    },
    "path": "/mgmt/shared/iapp/blocks"
};

var configTaskUtil = {
    initialize: function(options){
        this.restOperationFactory = options.restOperationFactory;
        this.eventChannel = options.eventChannel;
        this.restHelper = options.restHelper;
    },

    /**
     * Get the config task state from rest operation and validates it
     * @param restOperation
     * @return an object that contains the Block object
     */
    getAndValidateConfigTaskState: function (restOperation) {
        var configTaskState = restOperation.getBody();

        if (!configTaskState || !configTaskState.block) {
            throw new Error("Configuration task state must exist and contain a 'block'");
        }

        if (!configTaskState.selfLink) {
            throw new Error("Configuration task state must contain a 'selfLink'");
        }

        if (!configTaskState.block.id) {
            throw new Error("Configuration task state must exist and contain a 'id'");
        }

        return configTaskState;
    },

    /**
     * Update block configuration task on successful creation of configuration
     * @param configTaskState block configuration task state
     * @param referrer referrer uri string
     */
    sendPatchToBoundState : function(configTaskState, referrer, auth) {

        var op = this.createPatchOperation(configTaskState.selfLink, referrer, auth).setBody({
            "subStatus": "UPDATE_BLOCK_WITH_RESPONSE",
            "block": {
                "state": block.state.BOUND,
                "dataProperties": configTaskState.block.dataProperties
            }
        });
        this.eventChannel.emit(this.eventChannel.e.sendRestOperation, op);
    },

    /**
     * Update block configuration task on successful deletion of configuration
     * @param configTaskState block configuration task state
     * @param referrer referrer uri string
     */
    sendPatchToUnBoundState : function(configTaskState, referrer, auth) {
        var op = this.createPatchOperation(configTaskState.selfLink, referrer, auth).setBody({
            "subStatus": "UPDATE_BLOCK_WITH_RESPONSE",
            "block": {
                "state": block.state.UNBOUND,
                "dataProperties": configTaskState.block.dataProperties
            }
        });
        this.eventChannel.emit(this.eventChannel.e.sendRestOperation, op);
    },

    /**
     * Update block configuration task on error
     * @param configTaskState block configuration task state
     * @param err error information
     * @param referrer referrer uri string
     */
    sendPatchToErrorState : function(configTaskState, err, referrer, auth) {
        var op = this.createPatchOperation(configTaskState.selfLink, referrer, auth).setBody({
            "subStatus": "UPDATE_BLOCK_WITH_RESPONSE",
            "block": {
                "state": block.state.ERROR,
                "error": err.stack ? err.message + "\n    Error stack:\n" + err.stack : err.message,
                "dataProperties": configTaskState.block.dataProperties
            }
        });
        this.eventChannel.emit(this.eventChannel.e.sendRestOperation, op);
    },

    /**
     * Create an instance of RestOperation and sets the referrer to self and method to PATCH
     * @param selfLink selfLink of icrd object
     * @param referrer referrer uri string
     * @return {*}
     */
    createPatchOperation : function(selfLink, referrer, auth) {
        // the icrd object selfLink will be of the form: https://localhost/....; we will send the PATCH via http
        var blockConfigTaskUriPathname = url.parse(selfLink).pathname;
        var localBlockConfigTaskUri = this.restHelper.makeRestjavadUri(blockConfigTaskUriPathname, null);

        return this.restOperationFactory.createRestOperationInstance()
            .setReferer(referrer)
            .setMethod("Patch")
            .setUri(localBlockConfigTaskUri)
            .setIsSetBasicAuthHeader(!!auth)
            .setBasicAuthorization(auth);
    }
};

module.exports = configTaskUtil;
