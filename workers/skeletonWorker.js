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

/**
 * @class SkeletonWorker
 * @mixes RestWorker
 *
 * @description A simple worker that outlines functions that
 * can be defined and when and how they are called
 *
 * Called when the worker is loaded from disk and first
 * instantiated by the @LoaderWorker
 * @constructor
 */
function SkeletonWorker() {
    this.state = {};
}

/**
 * required
 * @description The uri key registered to handle incoming requests
 * The url can be accessed on localhost at http://localhost:8105/WORKER_URI_PATH
 * or at http://host/mgmt/WORKER_URI_PATH if the worker is public
 * @required
 * @type {string}
 */
SkeletonWorker.prototype.WORKER_URI_PATH = "shared/skeleton";

/**
 * optional
 * @description specified if the worker is available off box.
 * adds a dependency to /forwarder worker
 * @default false
 * @type {boolean}
 */
SkeletonWorker.prototype.isPublic = true;

/**
 * optional
 * @description  specified if the worker uses storage.
 * adds a dependency to /shared/storage worker
 * @default false
 * @type {boolean}
 */
SkeletonWorker.prototype.isPersisted = true;

/**
 * optional
 * @description  specified if the worker uses storage.
 * adds a dependency to /shared/storage worker
 * @default false
 * @type {boolean}
 */
SkeletonWorker.prototype.isStateRequiredOnStart = false;

/******************
 * startup events *
 ******************/

/**
 * optional
 *
 * @description onStart is called after the worker has been loaded and mixed
 * in with RestWorker. You would typically implement this function if you needed
 * to verify 3rd party dependencies exist before continuing to load your worker.
 *
 * @param {Function} success callback in case of success
 * @param {Function} error callback in case of error
 */
SkeletonWorker.prototype.onStart = function(success, error) {

    //if the logic in your onStart implementation encounters and error
    //then call the error callback function, otherwise call the success callback
    var err = false;
    if (err) {
        this.logger.severe("SkeletonWorker onStart error: something went wrong");
        error();
    } else {
        this.logger.fine("SkeletonWorker onStart success");
        success();
    }
};

/**
 * optional
 *
 * @description onStartCompleted is called after the dependencies are available
 * and state has been loaded from storage if worker is persisted with
 * isStateRequiredOnStart set to true. Framework will mark this worker available
 * to handle requests after success callback is called.
 *
 * @param {Function} success callback in case of success
 * @param {Function} error callback in case of error
 * @param {Object} state object loaded from storage
 * @param {Object|null} errMsg error from loading state from storage
 */
SkeletonWorker.prototype.onStartCompleted = function (success, error, state, errMsg) {
    if (errMsg) {
        this.logger.severe("SkeletonWorker onStartCompleted error: something went wrong " + errMsg);
        error();
    }

    this.logger.fine("SkeletonWorker state loaded: " + JSON.stringify(state));
    success();
};

/*****************
 * http handlers *
 *****************/

/**
 * optional
 * handle onGet HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onGet = function(restOperation) {
    var oThis = this;

    if (!this.state.content) {
        restOperation.setBody(this.state);
        this.completeRestOperation(restOperation);
        return;
    }

    // Instead of returning what is in memory manually load the state
    // from storage using helper provided by restWorker and send that
    // in response
    this.loadState(null,

        function (err, state) {
            if (err) {
                oThis.logger.warning("[SkeletonWorker] error loading state: %s", err.message);
                restOperation.fail(err);
                return;
            }
            restOperation.setBody(state);
            oThis.completeRestOperation(restOperation);
        }

    );
};

/**
 * optional
 * handle onPost HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPost = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};

/**
 * optional
 * handle onPut HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPut = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};


/**
 * optional
 * handle onPatch HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPatch = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};


/**
 * optional
 * handle onDelete HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onDelete = function(restOperation) {
    this.state = {};
    this.completeRestOperation(restOperation.setBody(this.state));
};


module.exports = SkeletonWorker;
