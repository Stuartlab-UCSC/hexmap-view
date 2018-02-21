#!/bin/bash
# Start the database.

source $HEX_VIEWER_CONFIG

# Start a server
touch $HEXMAP/log/db
mv $HEXMAP/log/db $HEXMAP/log/db.prev
(nohup $MONGO_BIN/mongod \
      --bind_ip 127.0.0.1 \
      --port $DB_PORT \
      --dbpath $HEXMAP/db \
&> $HEXMAP/log/db & echo $! > $HEXMAP/pid/db)


