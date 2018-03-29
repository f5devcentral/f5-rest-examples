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

class AuthorWorker {
    constructor() {
        this.WORKER_URI_PATH = "shared/authors";
        this.isPersisted = true;
        this.isPublic = true;
    }

    onPost(item) {

        /*
        // this is an example of how to filter property value

        const numRegExp = /\d/;

        if ((numRegExp.test(item.name))) {
            throw new Error("author name can't have numbers");
        }
        */

        return {
            id: item.id || new Date().toString(),
            name: item.name,
            books: item.books,
            lastPublishedDate: new Date(),
            netWorth: item.netWorth
        };
    }

    onGet(item) {
        return {
            id: item.id,
            name: item.name,
            books: item.books,
            netWorth: this.netWorthDefaultUpdate(item)
        };
    }

    /**
     * If this function is defined on the worker then it is a "collection"
     * @return {Object} Entity model
     */
    getSchema() {
        return {
            name: 'Author',
            key: {
                propertyRefs: [{ name: 'name' }]
            },
            properties: [
                { name: 'id', type: 'Edm.String', nullable: false },
                { name: 'name', type: 'Edm.String', nullable: false },
                { name: 'books', type: 'Collection(Edm.String)' },
                { name: 'lastPublishedDate', type: 'Edm.DateTimeOffset' },
                { name: 'netWorth', type: 'Edm.Double' }
            ]
        };
    }

    /**
     *
     * @param item: represents author object
     * @return item netWorth value
    */
    netWorthDefaultUpdate(item) {
        if (item.netWorth) {
            return item.netWorth + 0.1;
        }
        return item.netWorth;
    }
}

module.exports = AuthorWorker;
