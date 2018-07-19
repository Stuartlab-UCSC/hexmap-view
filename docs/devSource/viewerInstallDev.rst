View Server Install: development
================================

Note these version numbers:

*meteor* : METEOR@1.6.1

*node* : v8.11

*mongodb* : v3.4


Get code from repository
------------------------

Get the code where *my-app* is your root directory for the application
::

 mkdir my-app
 cd my-app
 git clone https://github.com/ucscHexmap/hexagram


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

Where *my-app* is your root directory for the application
::

 cd my-app/hexagram
 mkdir db log node_modules packages pid www


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


Install node modules outside of Meteor
--------------------------------------

::

 mkdir my-app/packages
 TBD

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


