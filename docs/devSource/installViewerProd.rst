Production View Server Install
==============================

TBD: this install procedure needs to be tested.

This assumes you already have an installation on a development
machine, which is required to build the deployment "bundle" to be installed on
the production machine.

If you want to update an existing production machine, see the section,
View Server Commands: Update View Server on Production.

Retrieve from the code repository
---------------------------------

::

 git clone https://github.com/stuartlab-UCSC/hexmap-view
 

Define an environment variable
------------------------------

Define a persistent envvar that points to this install::

 export HEXMAP=full-path-to-code-installation


Install node
------------

Use node v8.11.3. The distribution downloads are at::

 https://nodejs.org/en/download/

Install as follows, renaming the resulting directory to 'node', like::

 cd $HEXMAP/packages
 wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
 tar xf node-v8.11.3-linux-x64.tar.xz
 mv node-v8.11.3-linux-x64 node


Install mongodb
---------------

Use mongodb v3.4.16. The distribution downloads are at::

 https://www.mongodb.com/download-center#community

Click on your platform to find a list of versions.

If there is more than one option, find the option for your OS version.

If you need to find your redhat/centos version use::

 hostnamectl

Note the filename shown for the current version, something like::

 https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.4.16.tgz

Click on *All Version Binaries*.

Find the filename similar to the one you noted above.
For example on redhat/centos v7 mongodb v3.4, use these
commands to install::

 cd $HEXMAP/packages
 wget http://downloads.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.4.16.tgz?_ga=2.137449328.1707226230.1531432538-1246595538.1531432538
 tar xf mongodb-linux-x86_64-rhel70-3.4.16.tgz
 mv mongodb-linux-x86_64-rhel70-3.4.16 mongodb


Configure
---------

Build a configuration file similar to $HEXMAP/config/prod.


Set environment variables
-------------------------

Define persistent envvars and add executables to your path. (You may already have
HEXMAP defined.)::

 export HEXMAP=full-path-to-code-installation
 export HEX_VIEWER_CONFIG=/full-path-to-my-config
 PATH=$HEXMAP/packages/node/bin:$HEXMAP/packages/mongodb/bin:$PATH


Update view server with latest code
-----------------------------------

Now get the latest code onto the view server.
This is described in the section, View Server Commands: Update View Server on
Production.
