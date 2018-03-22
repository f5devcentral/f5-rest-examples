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

var q = require("q");
var logger = require("f5-logger").getInstance();
var constants = require('./constants');

var LOG_PREFIX = "BASIC: ";


// Exported content
var icrTools = {
    
    initialize: function (options) {
        logger.fine( LOG_PREFIX + "icrTools initialize" );
        this.restOperationFactory = options.restOperationFactory;
        this.restHelper = options.restHelper;
        this.wellKnownPorts = options.wellKnownPorts;
        this.referrer = options.referrer;
        this.restRequestSender = options.restRequestSender;
        // Generic URI components, minus the 'path'
        this.uri = this.restHelper.buildUri({
            protocol: this.wellKnownPorts.DEFAULT_HTTP_SCHEME,
            port: this.wellKnownPorts.DEFAULT_JAVA_SERVER_PORT,
            hostname: "localhost"
        });
        logger.fine(LOG_PREFIX + "icrTools initialized:" + this.restHelper.jsonPrinter(this.uri));
    },

    configureRemoteDeviceRequests: function(inputProperties, uri) {
        // If remote device information is provided,
        // add it to the uri since the default is for local requests
        if (inputProperties.hostname !== "undefined" &&
            inputProperties.hostname.value !== "localhost" &&
            inputProperties.hostname.value !== "") {
            uri.hostname = inputProperties.hostname.value;
            //Set the device group name so the token for the remote device can be found
            if (typeof inputProperties.deviceGroupName !== "undefined" &&
                inputProperties.deviceGroupName.value !== "") {
                this.setDeviceGroupName(inputProperties.deviceGroupName.value);
            } else {
                //Set the device group name so the token for the remote device can be found
                throw new Error("Can't send identified request without device group name.");
            }
            return this.getRemoteDevicePort(uri);
        }
        return this.setUri(uri);
    },

    setDeviceGroupName: function(groupName) {
        logger.fine(LOG_PREFIX + "setting device group name to: ",
            JSON.stringify(groupName));
        this.deviceGroupName = groupName;
    },

    /**
     * Get the remote device HTTPS port and set the uri before
     * making identified request. Remote device might be using non
     * standard HTTPS port and we need to get the configured HTTPS
     * port from device group devices
     *
     * @param URI uri object with port setting that needs updation
     * @return Q promise
     */    
    getRemoteDevicePort: function (uri) {
        var devicesPath = "/shared/resolver/device-groups/" + this.deviceGroupName + "/devices";
        var devicesUri = this.restHelper.makeRestjavadUri(devicesPath);

        logger.fine(LOG_PREFIX + "Getting device-group devices " +
            this.restHelper.jsonPrinter(devicesUri));

        var restOp = this.restOperationFactory.createRestOperationInstance()
                        .setUri(devicesUri);

        return this.restRequestSender.sendGet(restOp).then(response => {
            var devices = response.getBody();
            devices.items.forEach(device => {
                if (uri.hostname === device.address) {
                    uri.port = device.httpsPort;
                }
            });

            if (uri.port === this.wellKnownPorts.DEFAULT_JAVA_SERVER_PORT) {
                // We did not find the given hostname in device-group. So identified-requests
                // might not work mostly. Log a warning message and proceed
                logger.warning(LOG_PREFIX + "Could not find " + this.uri.hostname +
                     " in device-group " + this.deviceGroupName);
                uri.port = this.wellKnownPorts.DEFAULT_HTTPS_PORT_NUMBER;
            }
            return this.setUri(uri);
        });
    },

    setUri : function(uri) {
        this.uri = uri;
        return q(uri);
    },

    /**
     * Build an external URI with Hostname, HTTPS port and path
     * Uses restHelper to build URI object 
     *
     * @param address - Hostname or IP Address of remote device
     * @param port - HTTPS port
     * @param path - REST API endpoint path
     * @return URI object 
     */
    makeExternalUri: function(address, port, path) {
        if (path.substr(0,5) !== '/mgmt') {
            path = '/mgmt' + path;                         
        }

        var options = {
            protocol: this.wellKnownPorts.DEFAULT_HTTPS_SCHEME,
            hostname: address,
            port: port,
            path: path
        };
        return this.restHelper.buildUri(options);
    },
    
    /**
     * Make a basic REST call. The URI identifies the path/host/port. The method is a
     * camelcase HTTP verb (i.e. Post, Get, Put, ...). The basicAuth is used for authentication
     * details on the call.
     *
     * @param basicAuth - Basic auth details from the incoming restOperation
     * @param method - Get/Post/Patch/Post/Put/Delete
     * @param restUri - Basic URI of the query
     * @param options - optional referrer and body content. Body is Object to be converted to JSON.
     * @return 'Q' promise with output from REST operation
     */
    makeRestCall: function (basicAuth, method, restUri, options) {
        var restOp = this.restOperationFactory.createRestOperationInstance();
        if (restUri.hostname != 'localhost') {
        // It is an off-box request, make this operation an identified request
            restUri = this.makeExternalUri(restUri.hostname, restUri.port, restUri.path);
            restOp.setIdentifiedDeviceRequest(true);
            restOp.setIdentifiedDeviceGroupName(this.deviceGroupName);
        }
        restOp.setMethod(method)
            .setUri(restUri)
            .setIsSetBasicAuthHeader(true)
            .setBasicAuthorization(basicAuth);
        if (options && options.referrer) {
            restOp.setReferer(options.referrer);
        }
        if (options && options.body) {
            restOp.setBody(options.body);
        }
        return this.restRequestSender.send(restOp);
    },

    /**
     * Get the details of a pool, or an error it is doesn't exist. This is a promise-based return.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @return 'Q' promise with optional details of the target pool (if present)
     */
    getExistingPool: function (restOperation, poolName) {
        this.uri.path = constants.POOL_PATH_COMMON + poolName;
        logger.fine( LOG_PREFIX + "Getting Pool: " + this.restHelper.jsonPrinter(this.uri));

        return this.makeRestCall(restOperation.getBasicAuthorization(), "Get", this.uri,
            {
                referrer: this.referrer
            });
    },

    /**
     * Get the details of a pool INCLUDING all its pool members, or an error it is doesn't exist.
     * This is a promise-based return.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @return 'Q' promise with optional details of the target pool (if present)
     */
    getExistingPoolExpanded: function (restOperation, poolName) {
        this.uri.path = constants.POOL_PATH_COMMON + poolName + "/?expandSubcollections=true";
        logger.fine( LOG_PREFIX + "Getting Pool Expanded: " + this.restHelper.jsonPrinter(this.uri));

        return this.makeRestCall(restOperation.getBasicAuthorization(), "Get", this.uri,
            {
                referrer: this.referrer
            });
    },


    /**
     * Get the members of a pool, from a pool reference. This is a promise based return.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param membersUri - URI ofthe pool members
     * @return 'Q' promise with optional details of the target pool (if present)
     */
    getExistingPoolMembers: function (restOperation, membersUri) {
        logger.fine( LOG_PREFIX + "Getting getExistingPoolMembers from uri " + membersUri);

        return this.makeRestCall(restOperation.getBasicAuthorization(), "Get", membersUri,
            {
                referrer: this.referrer,
                body: null
            });
    },

    /**
     * Create a new pool. This will fail if the pool already exists.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @param poolType - the LTM type of the pool (i.e. "ratio", "round-robin", ...)
     * @return 'Q' promise - JSON object of the next pool.
     */
    createNewPool: function (restOperation, poolName, poolType) {
        this.uri.path = constants.POOL_PATH;
        logger.fine( LOG_PREFIX + "Creating new Pool: " + this.restHelper.jsonPrinter(this.uri));
        return this.makeRestCall(restOperation.getBasicAuthorization(), "Post", this.uri,
            {
                referrer: this.referrer,
                body: {"name": poolName, "loadBalancingMode": poolType}
            });
    },

    /**
     * Delete an existing pool. This will fail if the pool does not exist.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @return 'Q' promise - empty body, but records HTTP response code.
     */
    deleteExistingPool: function (restOperation, poolName) {
        this.uri.path = constants.POOL_PATH_COMMON + poolName;
        logger.fine( LOG_PREFIX + "Deleting new Pool: " + this.restHelper.jsonPrinter(this.uri));
        return this.makeRestCall(restOperation.getBasicAuthorization(), "Delete", this.uri,
            {
                referrer: this.referrer,
                body: null
            });
    },

    /**
     * Set the 'type' of an existing pool.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @param poolType - the LTM type of the pool (i.e. "ratio", "round-robin", ...)
     * @return 'Q' promise - with JSON object of the new type response
     */
    setPoolType: function (restOperation, poolName, poolType) {
        this.uri.path = constants.POOL_PATH_COMMON + poolName;
        logger.fine( LOG_PREFIX + "Setting type on Pool: " + this.restHelper.jsonPrinter(this.uri) + " to " + poolType);
        return this.makeRestCall(restOperation.getBasicAuthorization(), "Patch", this.uri,
            {
                referrer: this.referrer,
                body: {"loadBalancingMode": poolType}
            });
    },

    /**
     * Get the list of members for an existing pool.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @return 'Q' promise - JSON object of pool members
     */
    getPoolMembers: function (restOperation, poolName) {
        this.uri.path = constants.POOL_PATH_COMMON + poolName + constants.MEMBERS;
        logger.fine( LOG_PREFIX + "Getting Pool members: " + this.restHelper.jsonPrinter(this.uri));
        return this.makeRestCall(restOperation.getBasicAuthorization(), "Get", this.uri,
            {
                referrer: this.referrer,
                body: null
            });
    },

    /**
     * Delete the members, and nodes, of an existing pool.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @param bodyItems  (get pool members, body 'items' array)
     * @return 'Q' promise - HTTP status of 200/400
     */
    deletePoolMembers: function (restOperation, poolName, bodyItems) {
        var oThis = this;
        var collectionPromises = [];
        logger.fine( LOG_PREFIX + "Deleting Existing Pool members: " + this.restHelper.jsonPrinter(bodyItems));

        // First delete the pool connection to the nodes
        bodyItems.forEach(function (item) {
            oThis.uri.path = constants.POOL_PATH_COMMON + poolName + constants.MEMBERS_COMMON + item.name;
            logger.fine( LOG_PREFIX + "Delete member(" + oThis.restHelper.jsonPrinter(item.name) + "): " + oThis.restHelper.jsonPrinter(oThis.uri));
            collectionPromises.push(oThis.makeRestCall(restOperation.getBasicAuthorization(), "Delete", oThis.uri,
                {
                    referrer: oThis.referrer,
                    body: null
                }));
        });
        // Use this to wait for all pool connections to be deleted, before deleting the nodes.
        return q.all(collectionPromises).then(function (response) {
            var nodePromises = [];
            bodyItems.forEach(function (item) {
                oThis.uri.path = constants.LTM_NODE + item.name.split(":")[0];
                logger.fine( LOG_PREFIX + "Delete node(" + oThis.restHelper.jsonPrinter(item.name) + "): " + oThis.restHelper.jsonPrinter(oThis.uri));
                nodePromises.push(oThis.makeRestCall(restOperation.getBasicAuthorization(), "Delete", oThis.uri,
                    {
                        referrer: oThis.referrer,
                        body: null
                    }));
            });
            // Return of the promises for deleting 'nodes'
            return q.all(nodePromises);
        });
    },

    /**
     * Add the nodes and pool member pointers for the provided list of members.
     *
     * @param restOperation - originating rest operation that triggered this processor
     * @param poolName - Name of the BigIP pool, excluding the partition name (forced to 'Common')
     * @param inputMembers (list of members from input properties ... includes name/ip/port)
     * @returns Q Promise - JSON object containing new members structure
     */
    addPoolMembers: function (restOperation, poolName, inputMembers) {
        var oThis = this;
        logger.fine( LOG_PREFIX + "Adding Pool members: " + oThis.restHelper.jsonPrinter(inputMembers));
        // Build a full list
        var body = {members: []};
        inputMembers.forEach(function (member) {
            logger.fine( LOG_PREFIX + "Adding Node/Pool member: " + oThis.restHelper.jsonPrinter(member));
            body.members.push({"name": member.ip + ":" + member.port});
        });
        this.uri.path = constants.POOL_PATH_COMMON + poolName;
        return this.makeRestCall(restOperation.getBasicAuthorization(), "Patch", this.uri,
            {
                referrer: this.referrer,
                body: body
            });
    }

};

module.exports = icrTools;
