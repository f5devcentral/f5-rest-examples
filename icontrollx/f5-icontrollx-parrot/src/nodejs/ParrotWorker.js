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

/* jslint node: true */
"use strict";

/**
 * A test processor that echos back a value that is stored in its block.
 */
class ParrotWorker {
    constructor() {
        this.WORKER_URI_PATH = "shared/iapp/processors/parrot";
        this.isPublic = true;
    }

    onStart(success) {
        // Overriding the default presentation
        this.setPresentationHtmlFilepath("iapps/f5-icontrollx-parrot/index.html");
        this.setPresentationScriptFilepath("iapps/f5-icontrollx-parrot/js/parrot.js");

        success();
    }

    /**
     * Handles Get event
     * @param {RestOperation} restOperation
     */
    onGet(restOperation) {
        restOperation.setBody({
            reply: "squawk!"
        });

        this.completeRestOperation(restOperation);
    }

    /**
     * Handles Post event
     * @param {RestOperation} restOperation
     */
    onPost(restOperation) {
        var post = restOperation.getBody();
        var say = post.say;

        if (!say) {
            restOperation.setBody({
                reply: "squawk!"
            });
            restOperation.complete();
            return;
        }

        say = "squawk! " + say;
        restOperation.setBody({
            reply: say
        });

        this.completeRestOperation(restOperation);
    }

    /**
     * Handles Put event
     * @param {RestOperation} restOperation
     */
    onPut(restOperation) {
        return this.onPost(restOperation);
    }

    /**
     * Handles Patch event
     * @param {RestOperation} restOperation
     */
    onPatch(restOperation) {
        return this.onPost(restOperation);
    }
}

module.exports = ParrotWorker;
