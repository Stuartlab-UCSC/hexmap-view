#!/bin/bash
# $1: /path/to/the/config/file

# Source the configuration file for this machine.
source $1

touch $HEXMAP/log/https
mv $HEXMAP/log/https $HEXMAP/log/https.prev
(nohup $NODE_BIN/node $HEXMAP/bin/start/https.js &> $HEXMAP/log/https \
        & echo $! > $HEXMAP/pid/https)
