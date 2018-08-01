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

import constants from '../constants';

let _TOKEN = "";
let clientId = "";


const GetInitialConfig = () => {
    return httpRequest(constants.api.configuration, "GET", {})
};
exports.GetInitialConfig = GetInitialConfig;

function SaveToServerHelper(configuration) {
    return httpRequest(constants.api.configuration, "POST", JSON.stringify(configuration))
}
exports.SaveToServerHelper = SaveToServerHelper;

function httpRequest(url, method, body, retryCount = 1){
    return new Promise((resolve, reject) => {
        $.ajax({
            type: method,
            url: url,
            contentType: "application/json",
            dataType: 'json',
            async: true,
            xhrFields: {
                withCredentials: true
            },
            headers: {"X-F5-Auth-Token": _TOKEN},
            data: body,
            success: function (data) {
                resolve(data);
            },
            error: function (response, status, error) {
                if (retryCount > 0 && response.status === 401) {
                    const newRetryCount = retryCount - 1;
                    getNewToken()
                        .then(()=>{
                            return httpRequest(url, method, body, newRetryCount)
                        })
                        .then(data => {
                            resolve(data);
                        })
                        .catch(err => {
                            reject(err);
                        });
                } else {
                    if (response.hasOwnProperty("responseText")) {
                        reject(JSON.parse(response.responseText).message);
                    } else {
                        reject(status);
                    }
                }
            }
        });
    });
}

function getNewToken(){
    return new Promise((resolve, reject) => {
        httpRequestToken(constants.api.tokenUrl, "POST", JSON.stringify({"loginProviderName":"tmos","needsToken":true}))
            .then(response => {
                _TOKEN = response.token.token;
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}
exports.getNewToken = getNewToken;

function httpRequestToken(url, method, body){
    return new Promise((resolve, reject) => {
        $.ajax({
            type: method,
            url: url,
            contentType: "application/json",
            dataType: 'json',
            async: true,
            xhrFields: {
                withCredentials: false
            },
            data: body,
            success: function (data) {
                resolve(data);
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

function getToken(){
    return new Promise((resolve, reject) => {
        let sessionData;
        if (sessionStorage.getItem("_TOKEN")) {
            sessionData = sessionStorage.getItem("_TOKEN");
            _TOKEN = JSON.parse(sessionData).token;
            console.log("Extracted token from Session Storage", _TOKEN);
            resolve();
        } else {
            getNewToken()
                .then(() => {
                    resolve();
                })
                .catch(error => {
                    //reject(error);
                    resolve();
                })
        }
    });
}
exports.getToken = getToken;

function deleteDevice(name){
    return new Promise((resolve, reject) => {
        let url = constants.api.updateDevice + "('" + name + "')";
        httpRequest(url, "DELETE", JSON.stringify({}))
            .then(function (response) {
                resolve(response);
            })
            .catch(function(err){
                console.log("[deleteDevice] Error", err);
                reject(err);
            });
    });
}
exports.deleteDevice = deleteDevice;

function updatePool(value, type){
    return new Promise((resolve, reject) => {
        let url = constants.api.updatePool;
        let body = {};
        body[type] = value;
        httpRequest(url, "PATCH", JSON.stringify(body))
            .then(function (response) {
                resolve(response);
            })
            .catch(function(err){
                console.log("[updatePool] Error", err);
                reject(err);
            });
    });
}
exports.updatePool = updatePool;

function addDevice(name, mgmtIP, mgmtPort, username, password){
    return new Promise((resolve, reject) => {
        let url = constants.api.updateDevice;
        httpRequest(url, "POST", JSON.stringify({name: name, mgmtIp: mgmtIP, mgmtPort: parseInt(mgmtPort), username: username, password: password}))
            .then(function (response) {
                resolve(response);
            })
            .catch(function(err){
                console.log("[addBigIp] Error", err);
                reject(err);
            });
    });
}
exports.addDevice = addDevice;

function updateDevice(name, virtualIP, virtualPort){
    return new Promise((resolve, reject) => {
        let url = constants.api.updateDevice + "('" + name + "')";
        httpRequest(url, "PATCH", JSON.stringify({virtualIp: virtualIP, virtualPort: parseInt(virtualPort)}))
            .then(function (response) {
                resolve(response);
            })
            .catch(function(err){
                console.log("[updateDevice] Error", err);
                reject(err);
            });
    });
}
exports.updateDevice = updateDevice;

