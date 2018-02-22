#!/bin/bash
# Start the http server.

source $HEX_VIEWER_CONFIG

touch $HEXMAP/log/https
mv $HEXMAP/log/https $HEXMAP/log/https.prev
(nohup $NODE_BIN/node $HEXMAP/bin/js/https.js &> $HEXMAP/log/https \
        & echo $! > $HEXMAP/pid/https)
