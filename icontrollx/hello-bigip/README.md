# Hello BIGIP iControlLX

Example of a simple iControlLX plugin to create a range of nodes

```
    $ curl -k -u user:pass https://[bigip]/mgmt/Nodes
    # returns all the ltm nodes

    $ curl -k -u user:pass http://[bigip]/mgmt/Nodes -d '{ "start": "192.168.1.0", "end": "192.168.1.10" }' -H 'Content-Type: application/json'

    $ curl -k -u user:pass https://[bigip]/mgmt/Nodes
    # returns all nodes including new ones
```
