# Summary
A composable iControl LX Starter Hello World Application

The REST container is the base for the Docker Container image built from this project.


## Steps to Build Project
```
docker build -t rest-helloworld .
```

## Run 'Hello World' Container
* Start Container:
```
docker run --rm --name helloworld -p8443:443 rest-helloworld
```
* Access EndPoint:
```
curl -sk https://localhost:8443/mgmt/helloworld
```
* Shell Into Container:
```
docker exec -i -t helloworld /bin/sh
```
* Look at node.js logs:
```
less /var/log/restnoded/restnoded.log
```

