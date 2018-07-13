View Server Install: production
===============================

This assumes you already have a development installation somewhere else to
make the deployment bundle to be installed.

These steps are done on the *target* machine unless otherwise stated.

Note these version numbers:

*node* : v8.11
*mongodb* : v3.4

Make directories
----------------

Make the application and data directories. The data directory does not need to
be in any particular place in relation to the app directory.

*my-app* is your root directory for development of the application

*my-data* is the root directory of the user data
::

 mkdir my-app/hexagram
 cd my-app/hexagram
 mkdir db log node_modules packages pid www

 mkdir -p my-data/featureSpace my-data/view


Install node
------------

Find the version of node to use with the meteor version being used and install
that. The distribution downloads are at:

https://nodejs.org/en/download/

Install as follows, renaming the resulting directory. Something like::

 cd my-app/hexagram/packages
 wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
 tar xf node-v8.11.3-linux-x64.tar.xz
 mv node-v8.11.3-linux-x64 node


Install mongodb
---------------

Find the version of mongodb to use with the meteor version being used and
install that. The distribution downloads are at:

https://www.mongodb.com/download-center#community

Click on your platform to find a list of versions and select the one for your

If there is more than one option, find the option for your OS version.

If you need to find your redhat/centos version use::

 hostnamectl

If the current mongo version is not the same as the one being used by meteor,
you need to find the appropriate image to download. Otherwise download using
the instructions on the page continue with *Rename the directory*.

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


Install HTTP Proxy
------------------

Install a node module needed for the http proxies::

 cd my-app/hexagram
 npm install http-proxy


Install server scripts
----------------------

Here we use *dev* to refer to a development installation on the development
machine that builds the *bundle* to install on a *target*.

On dev copy the scripts to the target::

 cd my-app/hexagram
 tar cf config.tar bin config
 scp config.tar my-target-host:my-target-app/hexagram

On the target install the scripts::

 cd my-app/hexagram
 rm -rf bin config
 tar xf config.tar


Configure
---------

Build a configuration file similar to my-app/hexagram/config/prod.
This file may be put anywhere except in directories under my-app/hexagram
because those are overwritten during install.


Set environment variables
-------------------------

Define the full path of your application server::

 export HEXMAP=/full-path-to-my-app/hexagram

Define the full path of your server configuration file::

 export HEX_VIEWER_CONFIG=/full-path-to-my-config

Include this in your PATH::

 $HEXMAP/packages/node/bin:$HEXMAP/packages/mongodb/bin:$PATH


Install server code
-------------------

Here we use *dev* to refer to a development installation on the development
machine that builds the *bundle* to install on a *target*.

On dev build the bundle and copy it to the target::

 cd $HEXMAP
 deployWww

On the target install the bundle::

 cd $HEXMAP
 installWww


Start server
------------

Start these servers if using https::

 cd $HEXMAP
 start http
 start https

Start the database and www servers::

 cd $HEXMAP
 start db
 start www

Each server has a log file with an extension of: '.log'.

If you are running on port 80 or 443, you will need to run the start and stop
http(s) scripts as root after defining HEXMAP and HEX_VIEWER_CONFIG.

