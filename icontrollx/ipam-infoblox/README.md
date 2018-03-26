#iControl LX extension - IPAM integration with Infoblox

This iControl LX extension gives you an interface to leverage to communicate
with an infoblox system.

The following use cases have been created:
  * Get an IP address from Infoblox. Infoblox will allocate an IP to your service
    and reserve it
  * Retrieve an IP associated to a FQDN on infoblox
  * Release an IP address reserved on infoblox

#Installation

To use this iControl LX extension, you need to install it on your BIG-IP or iWF
platform.

Here is how to do it:
  * Download the latest RPM in the rpm folder
  * Push the rpm on the relevant platform (BIG-IP or iWF) in /var/config/rest/downloads/
  * do a POST requests with the following information:
    * the uri should be https://<ip_platform>/mgmt/shared/iapp/package-management-tasks
    * you need to authenticate yourself to do this call. make sure you are allowed
      to use the API with your account
    * here is the payload to inject:
      ```
      {
        "operation": "INSTALL",
        "packageFilePath": "/var/config/rest/downloads/<your_rpm_name>.rpm"
      }
      ```
Once the RPM is installed you should have a new folder on your platform called
```
ipam-infoblox
```
it is located here:

```
/var/config/rest/iapps
```

this create a new rest API interface available at /shared/workers/ipam-infoblox

the postman folder contains examples on how to manipulate this API

#Requirements

iControl LX extension is available on:
  * iWorkflow 2.3.0
  * BIG-IP 13.1
