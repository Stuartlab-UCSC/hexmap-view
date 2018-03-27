View Server Install: production
===============================

This assumes you already have a development installation.

We start with the *target* machine.

Environment Variables
---------------------

Set the environment variables on the production machine as:

HEXMAP: the 'hexagram' directory from your clone of the repository

HEX_VIEWER_CONFIG: the full path of your server configuration, similar to
examples in $HEXMAP/config


Install node
------------

Find the version of node to use with the meteor version being used and install
than in $HEXMAP/packages/node

https://nodejs.org/en/download/


Install mongodb
---------------

Find the version of mongodb to use with the meteor version being used and install
than in $HEXMAP/packages/mongodb

https://docs.mongodb.com/manual/administration/install-community/


PATH environment variable
-------------------------

Include this in your PATH::

 $HEXMAP/packages/node/bin:$HEXMAP/packages/mongodb/bin:$PATH


Install an HTTP Proxy
---------------------

Install a node module needed for the http proxies::

 cd $HEXMAP
 npm install http-proxy


Install the servers
-------------------

Here we use *dev* to refer to a development installation that builds the
*bundle* to install on a *target*.

On dev copy the run scripts to the target::

 cd $HEXMAP
 scp -r bin <target-host>:<target-$hexmap/bin>

On dev build the bundle and copy it to the target where:

* $METEOR_PATH is the path to your meteor binaries on dev
* <architecture> is the target's archtecture such as "os.linux.x86_64"

::

 cd $HEXMAP/www
 $METEOR_PATH npm install --production
 $METEOR_PATH build $HEXMAP/deploy --architecture <architecture>
 cd $HEXMAP
 scp deploy/www.tar.gz targetHost:targetPath

On the target install the bundle::

 cd $HEXMAP
 tar xf www.tar.gz
 cd $HEXMAP/bundle/programs/server
 $NODE_BIN/npm install > $HEXMAP/log/npmInstall
 cd $HEXMAP
 mv bundle www


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

