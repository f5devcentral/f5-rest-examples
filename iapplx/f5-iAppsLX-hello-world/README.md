# hello-world

Hello-world is simple iapp with a template JSON file and a config processor. It is used as
sample iApp in Quick start guide. If you make any changes to this, please make sure to
update the copy of this iApp RPM

## Pre-requisites
You need linux box with node, npm and rpmbuild installed

## Build
  1. Install the Dev dependencies using npm
      `npm i`
  2. Run RPM build to run lint and generated RPM
      `rpmbuild -bb --define '_topdir <You Git workspace directory absolute path>' hello-world.spec`
      
  3. IApp RPM will generated at RPMS/noarch/hello-world-0.1.0-0001.noarch.rpm. Copy this

## Tests
To make sure hello-world iApp works always, we have a functional test in iApp UI which will
install this iApp package and create an application block out of it. The test will also
make sure application block binds correctly (Eventing to configuration processor).
