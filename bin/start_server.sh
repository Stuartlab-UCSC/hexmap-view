#!/bin/bash

# Start a server

CONFIG=$1
HEXMAP=$2
TYPE=$3

BIN=$HEXMAP/bin
MONGO_BIN=$HEXMAP/packages/mongodb/bin
NODE_BIN=$HEXMAP/packages/node/bin

# Get the configuration
source $BIN/../config/config.$CONFIG

if [ $TYPE == 'wwwViz' ]; then
    VIZ=" --production --extra-packages bundle-visualizer"
    TYPE=www
else
    VIZ=
fi

#cd $HEXMAP/www

# Run the server by type using one of the above configs

if [ $TYPE == 'www' ]; then
    DRLPATH=$HEXMAP/packages/drl/drl-graph-layout/bin
    export PATH=$DRLPATH:$PATH
    export MONGO_URL=mongodb://localhost:$DB_PORT/$DB_NAME
    cat $BIN/../config/settingsA.$CONFIG.json $BIN/../config/settingsB.json > $BIN/../config/settings.json
    if [ $CONFIG == 'prod' ] || [ $CONFIG == 'dev' ]; then # this one runs in the background
        export METEOR_SETTINGS=$(cat $BIN/../config/settings.json)
        #export HTTP_FORWARDED_COUNT=1
        export MAIL_URL="smtp://localhost"
        touch $HEXMAP/log/www
        mv $HEXMAP/log/www $HEXMAP/log/www.prev
        (nohup $NODE_BIN/node $HEXMAP/www/main.js &> $HEXMAP/log/www \
            & echo $! > $HEXMAP/pid/$TYPE)
    else  # this one runs in the foreground
        cd  $HEXMAP/www
        $METEOR/meteor $VIZ --port $PORT --settings $HEXMAP/config/settings.json
    fi

elif [ $TYPE == 'db' ]; then
    touch $HEXMAP/log/db
    mv $HEXMAP/log/db $HEXMAP/log/db.prev
    (nohup $MONGO_BIN/mongod \
            --bind_ip 127.0.0.1 \
            --port $DB_PORT \
            --dbpath $HEXMAP/db \
            &> $HEXMAP/log/db & echo $! > $HEXMAP/pid/$TYPE)

# TODO this needs updating
elif [ $TYPE == 'dbRepair' ]; then
    touch $HEXMAP/log/db
    mv $HEXMAP/log/db $HEXMAP/log/db.prev
    (nohup $MONGO_BIN/mongod \
            --bind_ip 127.0.0.1 \
            --port $DB_PORT \
            --dbpath $HEXMAP/db \
            --repair \
            &> $HEXMAP/log/db & echo $! > $HEXMAP/pid/$TYPE)

elif [ $TYPE == 'http' ]; then
    touch $HEXMAP/log/http
    mv $HEXMAP/log/http $HEXMAP/log/http.prev
    (nohup $NODE_BIN/node $HEXMAP/http/http.js &> $HEXMAP/log/http \
        & echo $! > pid/$TYPE)

elif [ $TYPE == 'https' ] ; then
    touch $HEXMAP/log/https
    mv $HEXMAP/log/https $HEXMAP/log/https.prev
    (nohup $NODE_BIN/node $HEXMAP/https/https.js &> $HEXMAP/log/https \
        & echo $! > $HEXMAP/pid/$TYPE)

else
    echo Invalid TYPE: $TYPE
    echo Exiting
    exit
fi
