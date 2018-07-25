View Server Install: production
===============================

This assumes you already have a development installation somewhere else to
make the deployment bundle to be installed.

Note these version numbers:

*node* : v8.11

*mongodb* : v3.4


Install server source code
--------------------------

The data server code repository is at: https://github.com/ucscHexmap/hexagram.
Install the source, where *my-app* is the root directory of the app::

 cd my-app
 git clone https://github.com/ucscHexmap/hexagram.git


Install node
------------

Find the version of node to use with the meteor version being used and install
that. The distribution downloads are at:

https://nodejs.org/en/download/

Install as follows, renaming the resulting directory to 'node'. Something like::

 cd my-app/hexagram/packages
 wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
 tar xf node-v8.11.3-linux-x64.tar.xz
 mv node-v8.11.3-linux-x64 node


Install mongodb
---------------

Find the version of mongodb to use with the meteor version being used and
install that. The distribution downloads are at:

https://www.mongodb.com/download-center#community

Click on your platform to find a list of versions.

If there is more than one option, find the option for your OS version.

If you need to find your redhat/centos version use::

 hostnamectl

If the current mongo version is not the same as the one being used by meteor,
you need to find the appropriate image to download. Otherwise download using
the instructions on the mongodb page then continue below with
*Rename the directory*.

Download an earlier version
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Note the filename shown for the current version, something like::

 https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-4.0.0.tgz

Click on *All Version Binaries*.

Find the filename similar to the one you noted above, looking for the most
recent point release.

For example on redhat/centos v7 mongodb v3.4::

 wget http://downloads.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.4.16.tgz?_ga=2.137449328.1707226230.1531432538-1246595538.1531432538
 tar xf *mongodb*

Rename the directory
^^^^^^^^^^^^^^^^^^^^

Rename the directory resulting from untarring with something like::

 mv mongodb-linux-x86_64-rhel70-3.4.16 mongodb


Configure
---------

Build a configuration file similar to my-app/hexagram/config/prod.
This file may be put anywhere except in directories under *my-app*/hexagram
because those are overwritten during install.


Set environment variables
-------------------------

Define the HEXMAP environment variable where *my_app is the full path to your
respository installation directory which should end with *hexagram*.

Add some executables to your path.

You should put these in your login profile
::

 export HEXMAP=my-app/hexagram
 export HEX_VIEWER_CONFIG=/full-path-to-my-config
 PATH=$HEXMAP/packages/node/bin:$HEXMAP/packages/mongodb/bin:$PATH


Install HTTP Proxy
------------------

Install a node module needed for the http proxies::

 cd my-app/hexagram
 npm install http-proxy


Install server bundle
---------------------

Here we use *dev* to refer to a development installation on the development
machine that builds the compressed bundle to install on a *target*.

On *dev* build the bundle and copy it to the *target*::

 cd $HEXMAP
 deployWww

On the *target* install the bundle::

 cd $HEXMAP
 installWww


Start server
------------

If you will be running the servers on unprotected ports, use this form::

 cd $HEXMAP
 bin/start db
 bin/start https
 bin/start www

 cd $HEXMAP
 bin/stop db
 bin/stop https
 bin/stop www

The log files are at $HEXMAP/log.

Other scripts are described in bin/README.

On protected ports
^^^^^^^^^^^^^^^^^^

If you will be running any the servers on protected ports, including 80 or 443,
you need to run those servers as root. Prefix the above with
*sudo --preserve-env* for those servers on the protected ports::

 cd $HEXMAP
 bin/start db
 sudo --preserve-env $HEXMAP/bin/start https
 sudo --preserve-env $HEXMAP/bin/start www

 cd $HEXMAP
 bin/stop db
 sudo --preserve-env $HEXMAP/bin/stop https
 sudo --preserve-env $HEXMAP/bin/stop www
