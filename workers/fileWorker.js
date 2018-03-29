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

var fs = require("fs");

/**
 * FileWorker
 */
class FileWorker {
    constructor() {
        this.WORKER_URI_PATH = "shared/samples/file";
        this.isPublic = true;
    }

    /**
     * handle http GET
     *
     * Reads file from file system. File must be readable by restnoded or apache group
     * GET expects file name in query.
     * @example /mgmt/shared/samples/filereader?file=/tmp/foo.txt
     * @param {RestOperation} restOperation
     */
    onGet(restOperation) {
        let file = restOperation.uri.query.file;
        if (!file) {
            restOperation.fail(new Error("GET must specify a file path in the query parameter"));
            return;
        }

        fs.readFile(file, "utf-8", (err, data) => {
            if (err) { restOperation.fail(err); return; }

            let fileData = { data: data };
            restOperation.setBody(JSON.stringify(fileData));
            this.completeRestOperation(restOperation);
        });
    }

    /**
     * handle http POST
     *
     * Checks if file exists
     * @param restOperation
     */
    onPost(restOperation) {
        let file = restOperation.getBody().filePath;

        if (!file) {
            restOperation.fail(new Error("must specify a file path to check"));
            return;
        }

        fs.stat(file, (err, data) => {
            let exists = false;
            if (err && err.code !== 'ENOENT') {
                this.logger.info("Requested file (%s) stat failed with error :%s", file, err.message);
                restOperation.fail(err);
                return;
            }

            restOperation.setBody({fileExists: (typeof data !== "undefined")});
            this.completeRestOperation(restOperation);
        });
    }

    getExampleState() {
        return {
            filePath: "pathOfFileToCheck"
        };
    }
}

module.exports = FileWorker;