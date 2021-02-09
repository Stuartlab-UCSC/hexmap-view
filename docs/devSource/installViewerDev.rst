Development View Server Install
===============================

This installs a development environment for the view server. To install the data
server, see the section, Data Server Install.

Installation of a view server on production requires a
development environment to build a production "bundle" for deployment to the
production machine. This assumes the code has already been retrieved from the
code repository.

Install meteor
--------------

::

 curl "https://install.meteor.com/?release=1.8.0.1" | sh

This installs the specific meteor version needed along with meteor's version of
node and mongo.

Install the node packages required
----------------------------------
::

 cd hexmap-view/www
 meteor npm install

Configure
---------

Build a configuration file similar to hexmap-view/config/local.swat.

Set persistent environment variables
------------------------------------

Define some persistent envvars to the install directory and your configuration
file::

 export HEXMAP=/full-path-to-your-install-of-hexmap-view
 export HEX_VIEWER_CONFIG=/full-path-to-your-config-file

Start the servers
-----------------

To start the servers see the section in this document, Operational Commands.
