# parrot icontrolLX

Simple example of icontrolLX plugin with custom UI

## Build

> note: requires rpmbuild

    $ npm run build

## Use

    $ curl http://bigip/mgmt/shared/iapp/processors/parrot

```
    {
        "reply": "squawk!"
    }
```

Open http://bigip/mgmt/shared/iapp/processors/parrot/presentation in a web browser to see UI
