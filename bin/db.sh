#!/bin/bash
# $1: /path/to/the/config/file

# Source the configuration file for this machine.
source $1

# Start a server
touch $HEXMAP/log/db
mv $HEXMAP/log/db $HEXMAP/log/db.prev
(nohup $MONGO_BIN/mongod \
      --bind_ip 127.0.0.1 \
      --port $DB_PORT \
      --dbpath $HEXMAP/db \
&> $HEXMAP/log/db & echo $! > $HEXMAP/pid/db)


