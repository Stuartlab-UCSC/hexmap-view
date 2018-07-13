View Server Install: development
================================

Note these version numbers:

*meteor* : METEOR@1.6.1
*node* : v8.11
*mongodb* : v3.4


Install meteor
--------------

Install the specific meteor release::

 cd
 curl https://install.meteor.com/ > meteor.install
 vi meteor.install
   (set the definition of RELEASE as RELEASE=<meteor-version>)
 sh meteor.install

This also installs meteor's version of node and mongo.


Make directories
----------------

Make the application and data directories. The data directory does not need to
be in any particular place in relation to the app directory.

*my-app* is your root directory for development of the application

*my-data* is the root directory of the user data
::

 mkdir -p my-app/packages
 mkdir -p my-data/featureSpace my-data/view


Get code from repository
------------------------

Get the code::

 cd my-app
 git clone https://github.com/ucscHexmap/hexagram


Install node modules
--------------------


Configure
---------

Build a configuration file similar to my-app/hexagram/config/local.swat.
This file may be put anywhere except in directories under my-app/hexagram
because those are overwritten during install.


Set environment variables
-------------------------

Define the full path of your application server::

 export HEXMAP=/full-path-to-my-app/hexagram

Define the full path of your server configuration file::

 export HEX_VIEWER_CONFIG=/full-path-to-my-config

 export /Users/swat/.meteor

Include this in your PATH::

 $HOME/.meteor:$HEXMAP/packages/node/bin:$HEXMAP/packages/mongodb/bin:$PATH




Install server
--------------

Install the node modules needed for meteor::

 cd $HEXMAP/www
 meteor npm install


Start server
------------

Start these servers where http and https scripts are optional in the development
environment.

 cd $HEXMAP
 start http
 start https
 start db
 start www

Log files are in the log directory.

Other scripts are described in bin/README.


Sphinx
------

Use Sphinx to build this document.
http://www.sphinx-doc.org/en/stable/install.html


