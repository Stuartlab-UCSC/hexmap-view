#!/bin/bash
# $1: /path/to/the/config/file

# Source the configuration file for this machine.
source $1

# Start the http server
touch $HEXMAP/log/http
mv $HEXMAP/log/http $HEXMAP/log/http.prev
(nohup $NODE_BIN/node $HEXMAP/bin/start/http.js &> $HEXMAP/log/http \
   & echo $! > pid/http)

