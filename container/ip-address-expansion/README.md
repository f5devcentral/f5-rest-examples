# ip-address-expansion iControlLX extension

The ip-address-expansion is iControlLX extension that is designed to take a configuration, and update a list of BIGIP endpoints with that configuration. New BIGIP devices that are added to the list will get the new configuration as well.


## Steps to build as a container

    $ docker build -t ip-address-expansion .

## Run IP-Address-Expansion container and setup trust to BIGIP

    $ docker run --rm --name ip-expansion -p 8443:443 -e BIGIP_LIST='[user]:[pass]:[mgmt-ip] [user]:[pass]:[mgmt-ip]' ip-address-expansion

## Verify url is avaliable in container

    $ curl https://localhost:8443/mgmt/shared/iapp/ipAddressExpansion/available

## Verify UI is available

    open in your browser: https://localhost:8443/mgmt/shared/iapp/ipAddressExpansion/presentation

    Update the "Pool Name" and/or "Pool Members Range" and corresponding pool and pool members are created on each trusted BIGIP.

## API

There are 3 iControlLX endpoints contained in this app

### devices

`/mgmt/shared/iapp/ipAddressExpansion/devices`

The devices endpoint is a collection that contains a list of bigip devices

```
[
    {
        "name": "BigIP 1",
        "mgmtPort": 443,
        "mgmtIp": "172.17.1.10",
        "virtualIp": "10.12.3.4",
        "virtualPort": "3000"
    }
]
```

### config

`/mgmt/shared/iapp/ipAddressExpansion/config`

The config endpoint is a singleton which contains the configuration that is pushed to devices in the devices collection


```
{
    "poolName": "TestPool",
    "poolStart": "10.1.1.15",
    "poolEnd": "10.1.1.16",
}
```

### worker
`/mgmt/shared/iapp/ipAddressExpansion`

The ipAddressExpansion endpoint is a stateless worker responsible for pushing data in config to every device in the devices list. When either the config or devices are modified it will trigger a call to update all the bigip configs. An HTTP GET to the worker returns the following value combined from config and devices.

```
{
    "config":{
        "poolName": "TestPool",
        "poolStart": "192.1.1.11",
        "poolEnd": "192.1.1.21",
        "poolPort": 8888,
        "@odata.id": "https://localhost/mgmt/shared/iapp/ipAddressExpansion/config",
        "@odata.etag": 1,
        "@odata.context": "https://localhost/mgmt/shared/iapp/ipAddressExpansion/config/$metadata"
    },
    "devices": [
        {
            "name": "bigip1",
            "trustGroup": "dockerContainers",
            "mgmtIp": "10.144.72.186",
            "mgmtPort": 443,
            "@odata.id": "https://localhost/mgmt/shared/iapp/ipAddressExpansion/devices('bigip1')",
            "@odata.etag": 1
        },
        {
            "name": "bigip2",
            "mgmtIp": "10.144.72.193",
            "mgmtPort": 443,
            "username": "*****",
            "password": "*****",
            "@odata.id": "https://localhost/mgmt/shared/iapp/ipAddressExpansion/devices('bigip2')",
            "@odata.etag": 1
        }
    ]
}
```
