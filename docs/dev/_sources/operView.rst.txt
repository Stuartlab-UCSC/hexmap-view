
View server commands
====================

The adminDB and view servers are two different processes and the adminDB
server must be running before starting the view server.

Start the adminDB and view servers
..................................

DO NOT upgrade/update meteor or packages as this may replace libraries with
versions that are not backward-compatible with our code.

Ignore warnings about caniuse-lite, color.js and bcrypt

::

 cd $HEXMAP
 bin/start db
 bin/start www
 
An error may be displayed if there is no map data yet. This adminDB server is
for administrative data, not map data. Map data is served by the data server
described in the section, Data Server Install.

Stop the view server
....................

::

 cd $HEXMAP
 bin/stop www

Stop the adminDB server
.......................

::

 cd $HEXMAP
 bin/stop db

Check view server process
.........................

::

 ps -eaf | grep main

Check adminDB server process
............................

::

 ps -eaf | grep mongod

Log files
.........
Log files are in $HEXMAP/log.

Update view server on production
................................

.. toctree::
   :maxdepth: 1

   updateViewer

