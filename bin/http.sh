#!/bin/bash
# Start the http server

source $HEX_VIEWER_CONFIG

touch $HEXMAP/log/http
mv $HEXMAP/log/http $HEXMAP/log/http.prev
(nohup $NODE_BIN/node $HEXMAP/bin/js/http.js &> $HEXMAP/log/http \
   & echo $! > $HEXMAP/pid/http)

