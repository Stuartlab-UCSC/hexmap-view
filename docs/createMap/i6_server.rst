
Servers
=======

Log files
---------

The log files of the database and HTTP servers are below.
Replace *HEXMAP* with your the installation directory::

 HEXMAP/db.log
 HEXMAP/www.log

Checking processes
------------------

Check for running servers by searching for the port number in *ps* output.
For example if the HTTP server runs on port 8113::

 $ps -eaf | grep 8113
 hexmap      .../mongod --bind_ip 127.0.0.1 --port 28113 --dbpath .../hexmap/server/db
 hexmap      .../node  .../index.js --port 8113 --settings .../hexmap/server/settings.json
 $

The first process is the MongoDB server listening on port 28113, while
the second process is the HTTP server.

Starting the servers
--------------------

The database server must be up before starting the HTTP server.
Start the servers with the commands below::

 nohup runDB
 nohup runWww

Stopping the servers
--------------------

A kill command with no options is the best way to stop the processes.
