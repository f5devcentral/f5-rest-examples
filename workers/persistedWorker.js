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

/**
 * PersistedWorker
 *
 * @constructor
 */
function PersistedWorker() {}

/**
 * http uri path
 * http://localhost:8105/WORKER_URI_PATH
 * http://bigip/mgmt/WORKER_URI_PATH (if public worker)
 * @type {string}
 */
PersistedWorker.prototype.WORKER_URI_PATH = "shared/samples/persisted";

/**
 * uses restjavad storage to store state of worker
 * @type {boolean}
 */
PersistedWorker.prototype.isPersisted = true;

/**
 * makes this worker publicly available on https://bigip/mgmt/WORKER_URI_PATH
 * @type {boolean}
 */
PersistedWorker.prototype.isPublic = true;


/***************
 * HTTP Events *
 ***************/

/**
 * handle Get event
 * This example retrieves the value from storage on every GET request.
 * @param restOperation
 */
PersistedWorker.prototype.onGet = function(restOperation) {
    var me = this;
    this.loadState(null,

        function (err, state) {
            if (err) {
                restOperation.fail(err);
                return;
            }
            restOperation.setBody(state);
            me.completeRestOperation(restOperation);
        }

    );
};

/**
 * handle Post event
 * replace current state with new state from request
 * @param {RestOperation} restOperation
 */
PersistedWorker.prototype.onPost = function(restOperation) {
    var state = restOperation.getBody();
    if (!state) {
        restOperation.fail(new Error("specify state to save"));
        return;
    }
    if (!state.content) {
        restOperation.fail(new Error("specify state.content to save"));
        return;
    }
    restOperation.setBody({
        content: state.content
    });
    this.completeRestOperation(restOperation);
};

/**
 * handle Put event
 * replace current state with new state from request
 * @param {RestOperation} restOperation
 */
PersistedWorker.prototype.onPut = function(restOperation) {
    this.onPost(restOperation);
};

/**
 * handle Patch event
 * merge current state with state from request
 * @param {RestOperation} restOperation
 */
PersistedWorker.prototype.onPatch = function(restOperation) {
    this.onPost(restOperation);
};

/**
 * handle Delete event
 * delete state from storage
 * @param {RestOperation} restOperation
 */
PersistedWorker.prototype.onDelete = function(restOperation) {
    restOperation.setBody({
        message: "Delete successfully handled"
    });
    this.completeRestOperation(restOperation);
};


/********************
 * Helper Functions *
 ********************/

/**
 * Get example model for this REST resource
 * @returns {Object} object model example
 */
PersistedWorker.prototype.getExampleState = function() {
    return {
        content: "sample data"
    };
};

/*********************
 * Private Functions *
 *********************/

module.exports = PersistedWorker;