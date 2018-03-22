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

var blockUtil = {
    /**
     * Converts a property array into a hashtable with the id as key
     * @param {Array} inputProperties
     * @return {'id1': {id: 'id1', type: 'STRING', value: 'p1'},
                'id2': {id: 'id2', type: 'NUMBER', value: 2},
                'id3': {id: 'id3', type, 'PROPERTIES', 'subProp1': {id: 'subProp1', type: 'STRING', value: 'sp1'}}
                }
     */
    getMapFromProperties : function(inputProperties) {
        var ht = {};

        if (!inputProperties) {
            throw new Error("block inputProperties must exist");
        }

        inputProperties.forEach(function(prop, key){
            if (prop === undefined) {
                throw new Error(key + " is undefined.");
            }

            if (prop.type === 'PROPERTIES') {
                ht[prop.id] = blockUtil.getMapFromProperties(prop.value);

                for (key in prop) {
                    if (key !== 'value') {
                        ht[prop.id][key] = blockUtil.deepCopy(prop[key]);
                    }
                }
            }
            else {
                ht[prop.id] = blockUtil.deepCopy(prop);
            }
        });

        return ht;
    },

    validatePropertyMap: function(propertyMap, requiredProperties) {
        var i;
        for(i = 0; i < requiredProperties.length; ++i) {
            if (typeof propertyMap[requiredProperties[i]] === "undefined"){
                throw new Error("block inputProperty " + requiredProperties[i] + " must have a value");
            }
        }
    },

    /**
     *
     * @param {Array} inputProperties     list of properties
     * @param {Array} requiredProperties  list of properties which must be in inputProperties
     */
    validateRequiredInputProperties : function(inputProperties, requiredProperties) {
        var propertyMap;

        if (requiredProperties && requiredProperties.length > 0) {
            propertyMap = this.getMapFromProperties(inputProperties);
            this.validatePropertyMap(propertyMap, requiredProperties);
        }
    },

    /**
     *
     * @param {Array}   inputProperties     list of properties
     * @param {Array}   requiredProperties  list of properties which must be in inputProperties
     * @return {Object} Map of inputProperties returned from getMapFromProperties
     */
    getMapFromPropertiesAndValidate : function(inputProperties, requiredProperties) {
        var propertyMap;

        propertyMap = this.getMapFromProperties(inputProperties);
        this.validatePropertyMap(propertyMap, requiredProperties);

        return propertyMap;
    },

    /**
     * Returns the property with the specified id
     *
     * @param {Object} propertyMap - hash map of properties (as created by getMapFromProperties)
     * @param {String} id - id in format field1.field2
     * @return {Object} found property or undefined if not found
     */
    getProperty : function(propertyMap, id) {
        var keys = id.split('.'),
            property = propertyMap,
            i = 0;

        while (property && i < keys.length) {
            property = property[keys[i]];
            ++i;
        }

        return property;
    },

    /**
     * Return the property with the specified id as found in given property array
     * This function returns a reference to the actual property and not a clone
     *
     * @param {Array} propertyArray - array of properties (e.g. inputProperties)
     * @param {String} id - property id
     * @param {Boolean} isRequired - will throw exception if property not found
     * @returns {Object} found property or undefined
     */
    getPropertyFromArray: function(propertyArray, id, isRequired) {
        var propertyHash = blockUtil.arrayToHashtable(propertyArray, "id"),
            prop = propertyHash[id];
        if (isRequired && !prop) {
            throw new Error("Required property " + id + " was not found");
        }
        return prop;
    },

    /**
     * Returns the value for a property
     *
     * @param {Object} propertyMap - hash map of properties (as created by getMapFromProperties)
     * @param {String} id - id in format field1.field2
     * @return {Object} value of the property or undefined if not found
     */
    getValue: function(propertyMap, id) {

        var property = this.getProperty(propertyMap, id);

        if (!property) {
            return;
        }

        switch(property.type) {
            case "STRING":
                return property.value;
            case "NUMBER":
                return parseFloat(property.value);
            case "BOOLEAN":
                return !!JSON.parse(property.value);  //convert any trusy/falsy value to true/false
            case "JSON":
                return property.value;
            case "PROPERTIES":
                return property;  // It's just an object (was transformed from value)
            case "REFERENCE":
                return property.value;
            default:
                throw new Error(id + " of " + property.type + " is not recognized.");
        }
    },

    getMetaData: function(propertyMap, id, key) {
        var property = this.getProperty(propertyMap, id);

        if (!property) {
            return;
        }

        if (!key) {
            return property.metaData;
        }
        else if (property.metaData && property.metaData[key]) {
            return property.metaData[key];
        }
    },

    getSelfLinksProperty: function(blockState) {
        var i,
            selfLinks;

        if (blockState.dataProperties) {
            for (i = 0; i < blockState.dataProperties.length; ++i) {
                if (blockState.dataProperties[i].id === 'icrLinks') {
                    selfLinks = blockState.dataProperties[i];
                }
            }
        }

        if (!selfLinks) {
            // no dataProperties or self links found
            blockState.dataProperties = blockState.dataProperties || [];
            selfLinks = {id: 'icrLinks', type: 'PROPERTIES', value: []};
            blockState.dataProperties.push(selfLinks);
        }

        return selfLinks;
    },

    getSelfLinksReference: function(blockState) {
        var selfLinksProperty = this.getSelfLinksProperty(blockState);
        return selfLinksProperty.value;
    },

    setSelfLinksReference: function(blockState, value) {
        var selfLinksProperty = this.getSelfLinksProperty(blockState);
        selfLinksProperty.value = value;
    },

    /**
     * Collect selfLinks from data Properties
     * @param blockState
     * @returns {Array}
     */
    getSelfLinksFromDataProperties : function(blockState) {
        var selfLinks = [],
            originalSelfLinks = this.getSelfLinksReference(blockState);
        if (originalSelfLinks) {
            originalSelfLinks.forEach(function(selfLink) {
                selfLinks.push(selfLink.value.link);
            });
        }

        return selfLinks;
    },

    getSelfLinkFromBlockState : function(blockState, id, isNotRequired) {
        var i,
            selfLinks = this.getSelfLinksReference(blockState);

        for(i = 0; i < selfLinks.length; ++i) {
            if (selfLinks[i].id === id) {
                return selfLinks[i].value.link;
            }
        }

        if (isNotRequired) {
            return null;
        }

        throw new Error("Expecting to find selfLink in block dataProperties, but did not. " + id);
    },

    getSelfLinkFromICRDResp : function(respBody, kind, isNotRequired) {
        var desiredConfiguration = respBody.desiredConfiguration, i;

        if (!desiredConfiguration || desiredConfiguration.length === 0){
            throw new Error("Invalid response data from icrConfigWorker");
        }

        for (i=0; i<desiredConfiguration.length; ++i ){
            if (!!desiredConfiguration[i].body) {
                if (kind === desiredConfiguration[i].body.kind) {
                    return desiredConfiguration[i].body.selfLink;
                }
            }
        }

        if (isNotRequired) {
            return null;
        }

        throw new Error("Invalid reponse data from icrConfigWorker");
    },

   getSelfLinksFromICRDResp : function(respBody, kind) {
        var desiredConfiguration = respBody.desiredConfiguration,
            resultLinks = [],
            i;

        if (!desiredConfiguration || desiredConfiguration.length === 0){
            throw new Error("Invalid response data from icrConfigWorker");
        }

        for (i=0; i<desiredConfiguration.length; ++i ){
            if (!!desiredConfiguration[i].body) {
                if (kind === desiredConfiguration[i].body.kind) {
                    resultLinks.push(desiredConfiguration[i].body.selfLink);
                }
            }
        }

        return resultLinks;
    },

    /**
     * delete self links from data properties
     * @param blockState
     */
    clearSelfLinks : function (blockState) {
        var selfLinks = this.getSelfLinksReference(blockState);
        if (selfLinks) {
            selfLinks.length = 0;
        }
    },

    /**
     * store Icrd self refs into block.dataProperty to keep track of updates and deletes; will empty out existing data
     * help in dataProperties
     *
     * @param icrdData
     * {
     *      { desiredConfiguration:
               [ { body:
                    { kind: 'tm:ltm:profile:one-connect:one-connectstate',
                      name: 'oneconnect_09787a24-dada-4241-878c-d8dae006d720',
                      partition: 'Common',
                      fullPath: '/Common/oneconnect_09787a24-dada-4241-878c-d8dae006d720',
                      generation: 660697,
                      selfLink: 'https://localhost/mgmt/tm/ltm/profile/one-connect/~Common~oneconnect_09787a24-dada-4241-878c-d8dae006d720?ver=11.6.0',
                      defaultsFrom: '/Common/oneconnect',
                      idleTimeoutOverride: 'disabled',
                      maxAge: 86400,
                      maxReuse: 1000,
                      maxSize: 10000,
                      sharePools: 'disabled',
                      sourceMask: 'any' } }
                  ]
              }
     * }
     * @param blockState
     */
    extractICRDSelfLinks: function(icrdData, blockState) {
        var selfLinks = this.getSelfLinksReference(blockState);

        //empty out selfLinks
        selfLinks.length = 0;

        icrdData.desiredConfiguration.forEach(function(icrdPropertyItem) {
            selfLinks.push({
                id : icrdPropertyItem.body.selfLink,
                type: "REFERENCE",
                value: { "link": icrdPropertyItem.body.selfLink }
            });
        });
    },

        /**
     * Does a deep copy via serialization to deep copy and object
     *
     * @param obj instance object to clone
     * @returns deep copy of object
     */
    deepCopy : function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * convert an array to hashtable: ["a", "b"] => {"a":"a", "b":"b"}
     * @returns {{}}
     * @param arry
     * @param [keyProperty] the key to use for the hashtable in case of array<obj>
     */
    arrayToHashtable : function(arry, keyProperty){
        var ht = {};

        if (!arry) {
            throw new Error("input array cannot be null or undefiend");
        }

        arry.forEach(function(ele){
            if (keyProperty){
                ht[ele[keyProperty]] = ele;
            }
            else{
                ht[ele] = ele;
            }
        });

        return ht;
    }

};

module.exports = blockUtil;
