# Basic Pool iAppLX

This iApp is an example of accessing iCRD, including an audit processor.  The iApp itself is very simple - it manages the members of a pool.

The audit processor wakes up every 30 seconds (configurable). If the pool has changed on the BigIP then the block is rebound, restoring the Big-IP to the previous configuration.

This iApp also demostrates usage of identified requests with custom HTTPS port when user specifies remote BIG-IP address and device-group name when configuring. In this configuration, Device trust with remote BIG-IP address should be established ahead of time before deploying iApp.

## Build (requires rpmbuild)

    $ ./scripts/build

Build output is an RPM package
## Using IAppLX from BIG-IP UI
If you are using BIG-IP, install f5-iappslx-basic-pool RPM package using iApps->Package Management LX->Import screen. To create an application, use iApps-> Templates LX -> Application Services -> Applications LX -> Create screen. Default IApp LX UI will be rendered based on the input properties specified in basic pool IAppLX.

Pool name is mandatory when creating or updating iAppLX configuration. Optionally you can add any number of pool members.

## Using IAppLX from Container to configure BIG-IP

Run the REST container https://gitswarm.f5net.com/f5-rest/base-container with f5-iappslx-basic-pool IAppLX package. Pass in the remote BIG-IP to be trusted when starting REST container as environment variable.

Create an Application LX block with hostname, deviceGroupName, poolName, poolType and poolMembers as shown below.
Save the JSON to block.json and use it in the curl call

```json
{
    "name": "poolApp",
    "inputProperties": [
        {
            "id": "hostname",
            "type": "STRING",
            "value": "10.144.72.203"
        },
        {
            "id": "deviceGroupName",
            "type": "STRING",
            "value": "dockerContainers"
        },
        {
            "id": "poolName",
            "type": "STRING",
            "value": "manjupool"
        },
        {
            "id": "poolType",
            "type": "STRING",
            "value": "round-robin",
            "metaData": {
                "uiHints": {
                    "list": {
                        "dataList": [
                            "round-robin",
                            "ratio-node",
                            "least-sessions"
                        ],
                        "uiType": "dropdown"
                    }
                }
            }
        },
        {
            "id": "poolMembers",
            "type": "JSON",
            "value": [
                {
                    "ip": "10.30.45.67",
                    "port": 80
                }
            ]
        }
    ],
    "configurationProcessorReference": {
        "link": "https://localhost/mgmt/shared/iapp/processors/basicPoolConfig"
    },
    "auditProcessorReference": {
        "link": "https://localhost/mgmt/shared/iapp/processors/basicPoolEnforceConfiguredAudit"
    },
    "audit": {
        "intervalSeconds": 30,
        "policy": "ENFORCE_CONFIGURED"
    },
    "baseReference": { "link" : "https://localhost/mgmt/shared/iapp/blocks/a9f2603e-ef64-3556-9074-744bf0d79738" },
    "configProcessorTimeoutSeconds": 30,
    "statsProcessorTimeoutSeconds": 15,
    "configProcessorAffinity": {
        "processorPolicy": "LOAD_BALANCED",
        "affinityProcessorReference": {
            "link": "https://localhost/mgmt/shared/iapp/processors/affinity/load-balanced"
        }
    },
    "state": "BINDING"
}
```

Post the block REST container using curl. Note you need to be running REST container for this step
and it needs to listening at port 8433
```bash
curl -sk -X POST -d @block.json https://localhost:8443/mgmt/shared/iapp/blocks
```
