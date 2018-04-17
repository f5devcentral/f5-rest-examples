# Hello Planet iControlLX

Example of a simple iControlLX plugin to demonstrate interacting with a stateful worker

```
    $ curl -k -u user:pass https://[bigip]/mgmt/Hello
    # returns "Hello Earth"

    $ curl -k -u user:pass http://[bigip]/mgmt/Planet
    # returns { "planet": "Earth" }

    $ curl -k -u user:pass http://[bigip]/mgmt/Planet -d '{ "planet": "Mars" }' -X PATCH

    $ curl -k -u user:pass https://[bigip]/mgmt/Hello
    # returns "Hello Mars"
```
