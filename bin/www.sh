#!/bin/bash

source $HEX_VIEWER_CONFIG

# Build settings.json.
${NODE_BIN}/node ${HEXMAP}/bin/js/buildSettings.js
if [ $? != 0 ]; then
    echo "Build of settings.json failed"
    exit
fi

# Run the view server.
echo starting the www server
cd $HEXMAP/www
export MAIL_URL="smtp://localhost"
if [ "$BACK_OR_FOREGROUND" == "FORE" ]; then
    if [ "$BUNDLE_VIZ" == true ]; then
        $METEOR_PATH run --port $PORT --settings $HEXMAP/config/settings.json \
            --extra-packages bundle-visualizer \
            --production
    else
        $METEOR_PATH run --port $PORT --settings $HEXMAP/config/settings.json
    fi
elif [ "$BUNDLED" == true ]; then
    # Packaged Meteor apps use METEOR_SETTINGS environment variable.
    export METEOR_SETTINGS=$(cat $HEXMAP/config/settings.json)

    # Set up previous and current logging file.
    touch $HEXMAP/log/www
    mv $HEXMAP/log/www $HEXMAP/log/www.prev

    # Run packaged Meteor
    # code. This assumes you have run deploy.sh/install.sh
    # or equivalent.
    (nohup $NODE_BIN/node $HEXMAP/www/main.js &> $HEXMAP/log/www \
      & echo $! > $HEXMAP/pid/www)
else
    (nohup $METEOR_PATH run --port $PORT --settings $HEXMAP/config/settings.json \
       &> $HEXMAP/log/www & echo $! > $HEXMAP/pid/www)
fi

