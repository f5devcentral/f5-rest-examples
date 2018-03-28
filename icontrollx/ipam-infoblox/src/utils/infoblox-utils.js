/*
* This file contains the different function that will be used to
* communicate with the infoblox solution
* here we have the following functions:
*     - get and reserve the next available free IP in a subnet/zones
*     - free an IP that is not needed anymore
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var logger = require('f5-logger').getInstance();
var request = require("../node_modules/request");
var DEBUG = true;

function InfobloxUtils (name, subnet) {

  /*
  * Here we provide the information to communicate with infoblox:
  *   - Infoblox IP
  *   - Infoblox Login / Password
  *   - Infloblox subnet
  */

  var infobloxIP = "10.100.60.71";
  var infobloxLogin = "admin";
  var infobloxPassword = "mypassword";
  var auth = 'Basic ' + new Buffer(infobloxLogin + ':' + infobloxPassword).toString('base64');
  var name = name;
  var subnet = subnet;

  /*
  * This function is to be used to retrieve the IP allocated to a host
  */
  this.GetIPFromHostname = function (myHostname) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function GetIPFromHostname, hostname is: " + myHostname);
        }
        var options = {
          method: 'GET',
      		url: 'https://' + infobloxIP + '/wapi/v2.6/record:host?name=' + myHostname + "&_return_as_object=1",
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			}
        };
        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromHostname, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromHostname, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetIPFromHostname, http request to infoblox succeeded - body!!!!!: " + JSON.stringify(body));
              }
              var jsonBody = JSON.parse(body);
              if (jsonBody.result.length == 0) {
                logger.info("Infoblox Utils: function GetIPFromHostname, http request to infoblox failed - hostname does not exist: ");
                reject("Hostname is not defined in Infoblox");
              } else {
                logger.info("Infoblox Utils: function GetIPFromHostname, http request to infoblox succeeded - IP: " + jsonBody.result[0].ipv4addrs[0].ipv4addr);
                resolve(jsonBody.result[0].ipv4addrs[0].ipv4addr);
              }
            } else {
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed - body: " + JSON.stringify(body));
              }
              reject (body);
            }
          }
       });
      }
    )
  }

  /*
  * When we Allocate an IP from infoblox, infoblox just return a token
  * This function will use the token to retrieve the IP allocated to it
  */
  this.GetIPFromToken = function (myToken) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function GetIPFromToken, token is: " + myToken);
        }
        var options = {
          method: 'GET',
      		url: 'https://' + infobloxIP + '/wapi/v2.6/' + myToken,
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			}
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              var jsonBody = JSON.parse(body);
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox succeeded - body!!!!!: " + JSON.stringify(body));
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox succeeded - IP: " + jsonBody.ipv4addrs[0].ipv4addr);
              }
              resolve(jsonBody.ipv4addrs[0].ipv4addr);
            } else {
                if (DEBUG) {
                  logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed - body: " + JSON.stringify(body));
                }
                reject (body);
            }
          }
       });
     }
   )
  }

  /*
  * This function will allocate an IP to our host. The way it works is the following:
  * - you send a request to /wapi/v2.6/record:host specifying your service FQDN
  *   and the subnet that should allocate an IP
  * - infoblox will reply with something like this:
  *    record:host/ZG5zLmhvc3QkLl9kZWZhdWx0Lm9yZy5teS1sYWIud2Vi:web.my-lab.org/default
  * - we will need another request to translate this into an IP
  */

  this.AllocateIP = function () {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function AllocateIP, name is: " + name + " and subnet is: " + subnet);
        }
        var postData = {
          "name": name,
          "ipv4addrs": [{"ipv4addr":"func:nextavailableip:"+ subnet}]
        };
        if (DEBUG) {
          logger.info("Infoblox Utils: function AllocateIP, infoxblox post payload will be :" + JSON.stringify(postData));
        }
        var options = {
          method: 'POST',
      		url: 'https://' + infobloxIP + '/wapi/v2.6/record:host',
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			},
      		body: postData,
      		json: true
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function AllocateIP, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function AllocateIP, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function AllocateIP, http request to infoblox succeeded - body: " + body);
              }
              resolve(body);
            } else {
              //  var jsonBody = JSON.parse(body);
                if (DEBUG) {
                  logger.info("Infoblox Utils: function AllocateIP, http request to infoblox failed - body: " + body.text);
                }
                reject (body.text);
            }
          }
        });
      }
    )
  }

  /*
  * This function will return the ref based on the hostname
  * this is needed to be able to delete a host.
  */
  this.GetRefFromHostname = function (myHostname) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function GetRefFromHostname, hostname is: " + myHostname);
        }
        var options = {
          method: 'GET',
          url: 'https://' + infobloxIP + '/wapi/v2.6/record:host?name=' + myHostname + "&_return_as_object=1",
          headers:
            {
              "authorization": auth,
              'content-type': 'application/json'
            }
        };
        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetRefFromHostname, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetRefFromHostname, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetRefFromHostname, http request to infoblox succeeded - body!!!!!: " + JSON.stringify(body));
                var jsonBody = JSON.parse(body);
                logger.info("Infoblox Utils: function GetRefFromHostname, http request to infoblox succeeded - ref is: " + jsonBody.result[0]._ref);
              }
              resolve(jsonBody.result[0]._ref);
            } else {
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed - body: " + JSON.stringify(body));
              }
              reject (body);
            }
          }
       });
      }
    )
  }

  /*
  * This function is to release an IP that is not needed anymore based on the
  * hostname's ref
  */
  this.ReleaseIPFromRef = function (myRef) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function ReleaseIPFromRef, ref is: " + myRef);
        }

        var options = {
          method: 'DELETE',
          url: 'https://' + infobloxIP + '/wapi/v2.6/' + myRef,
          headers:
            {
              "authorization": auth,
              'content-type': 'application/json'
            }
        };
        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function ReleaseIPFromHostname, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function ReleaseIPFromHostname, http request to infoblox - delete Host - responsecode: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function ReleaseIPFromHostname, http request to delete Host !!!!!: ");
              }
              resolve();
            } else {
                if (DEBUG) {
                  logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed - body: " + JSON.stringify(body));
                }
                reject (body);
            }
          }
        }
       );
      })
    }

};

module.exports = InfobloxUtils;
