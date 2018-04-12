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


/**
 * @constructor
 */
function ProxyWorker() {
}

// Demo and test only worker.
ProxyWorker.prototype.WORKER_URI_PATH = "shared/test/proxy-js";
ProxyWorker.prototype.isPublic = true;

/**
 * Forwards request to remote address. Request is specified in the POST body.
 * @param {restOperation} POST body is {
 *     groupName: "tm-shared-all-big-ips" (device trust group name to get the token, optional),
 *     method: "Get"/"Post"/etc. (as required by Javascript framework, optional, "Get" by default),
 *     uri: "http://172.27.91.158/mgmt/shared/echo" (full remote device URI),
 *     httpsRejectUnauthorized:[true | false] (define if certificate of remote host should be verified - optional. Default : false)
 *     body: "{ ... }" (remote request body if not "Get", optional)
 * }
 */
ProxyWorker.prototype.onPost = function(restOperation) {
    var body = restOperation.getBody(),
        oThis = this;

    var identifiedDeviceRequest = oThis.restOperationFactory.createRestOperationInstance()
         // sets flag to use identified device API for authentication
        .setIdentifiedDeviceRequest(true)
        // sets trusted device group for identified device API (optional, but recommended)
        .setIdentifiedDeviceGroupName(body.groupName)
        .setMethod(body.method || "Get")
        .setUri(this.url.parse(body.uri))
        .setBody(body.body)
        .setContentType(body.contentType || "application/json")
        .setReferer(this.getUri().href);

    if(body.httpsRejectUnauthorized !== undefined){
        identifiedDeviceRequest.setHttpsRejectUnauthorized(body.httpsRejectUnauthorized);
    }

    this.eventChannel.emit(this.eventChannel.e.sendRestOperation, identifiedDeviceRequest,

        function(resp) {
            var respBody = resp.getBody();
            if (respBody && typeof respBody == "object") {
                respBody.responseJson = true;
            }
            restOperation.setBody({
                "responseBody": respBody,
                "responseContentType": resp.getContentType()
            });
            oThis.completeRestOperation(restOperation);
        },

        function(err) {
            oThis.logger.severe("Request to %s failed: \n%s", body.uri , err ? err.message : "");
            restOperation.fail(err);
        }

    );
};

module.exports = ProxyWorker;
