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
 * Example of returning a Promise from the
 * http handler functions (onGet, onPost)
 *
 * @class BooksAsyncWorker
 */
class BooksAsyncWorker {
    constructor() {
        this.WORKER_URI_PATH = "shared/booksAsync";
        this.isPersisted = true;
        this.isPublic = true;
    }

    /**
     * Handles Post to colleciton
     *
     * @param {Object} book posted model of a book
     * @returns {Promise|Object} return object or promise
     * @memberof BooksAsyncWorker
     */
    onPost(book) {
        const numRegExp = /\d/;

        return new Promise((resolve, reject) => {
            if ((numRegExp.test(book.title))) {
                reject(new Error("title can't have numbers"));
                return;
            }
            resolve(book);
            return;
        });
    }

    /**
     * Handles Get for each item in collection
     *
     * @param {Object} book model of a book returned from query
     * @returns {Promise|Object} return object or promise
     * @memberof BooksAsyncWorker
     */
    onGet(book) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                book.title = book.title.toUpperCase();
                resolve(book);
            }, 100);
        });
    }

    /**
     * Schema for model
     * @return {Object} odata entity type
     */
    getSchema() {
        return {
            name: 'Book',
            key: {
                propertyRefs: [{ name: 'ISBN' }]
            },
            properties: [
                { name: 'ISBN', type: 'Edm.String', nullable: false },
                { name: 'title', type: 'Edm.String', nullable: false }
            ]
        };
    }
}

module.exports = BooksAsyncWorker;
