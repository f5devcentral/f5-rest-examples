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

var blockUtil = require("./blockUtils");
var logger = require("f5-logger").getInstance();
var icr = require("./icrTools");


function BasicPoolEnforceConfiguredAuditProcessor() {
    // you can also use this.logger on a RestWorker
    // Using directly from require (below) is another way to call log events
    logger.info("loading basic pool Enforce Configured Audit Processor");
}

// For logging, show the number of the audit cycle. Increments on each new "turn" of the auditor
var entryCounter = 0;

var getLogHeader = function () {
    return "AUDIT #" + entryCounter + ": ";
};


BasicPoolEnforceConfiguredAuditProcessor.prototype.WORKER_URI_PATH = "shared/iapp/processors/basicPoolEnforceConfiguredAudit";

BasicPoolEnforceConfiguredAuditProcessor.prototype.onStart = function (success) {
    logger.fine("BasicPoolEnforceConfiguredAuditProcessor.prototype.onStart");
    this.apiStatus = this.API_STATUS.INTERNAL_ONLY;
    this.isPublic = true;
    
    icr.initialize( {
        restOperationFactory: this.restOperationFactory,
        restHelper: this.restHelper,
        wellKnownPorts: this.wellKnownPorts,
        referrer: this.referrer,
        restRequestSender: this.restRequestSender
    });

    success();
};


// The incoming restOperation contains the current Block.
// Populate auditTaskState.currentInputProperties with the values on the device.
// In ENFORCE_CONFIGURED, ignore the found configuration is on the BigIP.
BasicPoolEnforceConfiguredAuditProcessor.prototype.onPost = function (restOperation) {
    entryCounter++;
    logger.fine(getLogHeader() + "START");
    var oThis = this;
    var auditTaskState = restOperation.getBody();

    try {
        if (!auditTaskState ) {
            throw new Error("AUDIT: Audit task state must exist ");
        }

        logger.fine(getLogHeader() + "Incoming properties: " +
            this.restHelper.jsonPrinter(auditTaskState.currentInputProperties));

        var blockInputProperties = blockUtil.getMapFromPropertiesAndValidate(
            auditTaskState.currentInputProperties,
            ["poolName", "poolType", "poolMembers", "hostname", "deviceGroupName"]
        );

        // Set the default URI as a local request
        var uri = this.restHelper.buildUri({
            protocol: this.wellKnownPorts.DEFAULT_HTTP_SCHEME,
            port: this.wellKnownPorts.DEFAULT_JAVA_SERVER_PORT,
            hostname: "localhost"
        });

        icr.configureRemoteDeviceRequests(blockInputProperties, uri).then(function () {
            // If any field is different then force to Binding and
            // the iApp machinery will take over - passing it through the config processor
            // Use a call that includes the ICRD flag "expandSubcollections so that we get the ppool and its subcollections in one call
            return icr.getExistingPoolExpanded(restOperation, blockInputProperties.poolName.value, uri);
        })
        .then(function (poolResponse) {
            var deviceConfig = poolResponse.body;
            logger.fine(getLogHeader() + "Found device configuration: " + oThis.restHelper.jsonPrinter(deviceConfig));
            // No need to check the poolName because that is how we found it. So the value populated above will be correct.
            // If we did not find it then only set the pool name on auditTaskState.currentInputProperties so that we trigger a rebind
            if (poolResponse === null) {
                auditTaskState.currentInputProperties.poolType = null;
                auditTaskState.currentInputProperties.members = null;
            } else {
                // Put pool type into the returned inputProperties
                // id, type, metadata. value,
                logger.fine(getLogHeader() + "setting pool type ");
                var poolTypeObject = getObjectByID("poolType", auditTaskState.currentInputProperties);
                poolTypeObject.value = deviceConfig.loadBalancingMode;
                var poolMembers = poolResponse.body.membersReference.items;
                // Be careful,someone might have deleted all our pool members.
                // If they have all gone then recreate them.
                var poolMembersObject = getObjectByID("poolMembers", auditTaskState.currentInputProperties);
                if( poolMembers !== undefined ) {
                    logger.fine(getLogHeader() + "Got pool members: " + oThis.restHelper.jsonPrinter(poolMembers));
                    // Put all the pool members into the input properties.
                    // The port number is NOT a separate field, it must be extracted from the name
                    poolMembersObject.value = poolMembers.map(function (item) {
                        // Careful, the address might be IPv6, in which case it will have colons characters.
                        // So splitting on ':' to find the port is not safe
                        var portAsString = item.name.substring( item.address.length +1 );
                        logger.fine(getLogHeader() + "Port as string _" + portAsString + "_");
                        try {
                            var portAsNumber = parseInt(portAsString, 10);
                            // Port is stored as a number in the Block. it won't match if it is a string
                            return {ip: item.address, port: portAsNumber};
                        } catch ( parseEx ) {
                            // The port might have been a symbolic name, not an int. Use the string version instead
                            return {ip: item.address, port: portAsString};
                        }
                    });
                } else {
                    // No pool members on the device
                    poolMembersObject.value = [];
                }
                logger.fine(getLogHeader() + "Constructed Config: " + oThis.restHelper.jsonPrinter(auditTaskState.currentInputProperties));
                oThis.finishOperation(restOperation, auditTaskState);
            }
        }, function (error) {
            logger.info(getLogHeader() + "Audit process cannot accesspool: " + error );
            var poolNameObject = getObjectByID("poolName", auditTaskState.currentInputProperties);
            poolNameObject.value = null;
            logger.info(getLogHeader() + "Audit process cannot access pool: " + blockInputProperties.poolName.value);
            oThis.finishOperation(restOperation, auditTaskState);
        })
        .done(
            function(ok) { logger.info( getLogHeader() + "ok");},
            function(error) { logger.info( getLogHeader() + "error: " + error );},
            function(progress) { logger.info( getLogHeader() + "on progress");}
        );

    } catch (ex) {
        logger.fine("BasicPoolEnforceConfiguredAuditProcessor.prototype.onPost caught generic exception " + ex);
        restOperation.fail(ex);
    }
};

var getObjectByID = function ( key, array) {
    var foundItArray = array.filter( function( item ) {
        return item.id === key;
    });
    return foundItArray[0];
};

BasicPoolEnforceConfiguredAuditProcessor.prototype.finishOperation = function( restOperation, auditTaskState ) {
    restOperation.setBody(auditTaskState);
    this.completeRestOperation(restOperation);
    logger.fine(getLogHeader() + "DONE" );
};

module.exports = BasicPoolEnforceConfiguredAuditProcessor;
