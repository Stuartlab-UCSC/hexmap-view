#!/bin/bash
# $1: /path/to/the/config/file. If empty uses ./config/setup.cf

# Source the configuration file for this machine.
source $1

# Build settings.json.
${NODE_BIN}/node ${HEXMAP}/bin/js/buildSettings.js
if [ $? != 0 ]; then
    echo "Build of settings.json failed"
    exit
fi

# Start up the python environment.
if [ ! -z $PYENV ]; then
    source $PYENV/bin/activate
else
    echo "Must set \$PYENV, the python environment path."
    exit
fi

# Run the view server.
cd $HEXMAP/www
if [ $BACK_OR_FOREGROUND == "FORE" ]; then
    $METEOR_PATH run --port $PORT --settings $HEXMAP/config/settings.json
else
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
fi

