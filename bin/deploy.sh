#!/bin/bash
# $1: /path/to/the/config/file, can be ommited if there is a
# config/setup.ch in the current directory, or if $HEXMAP is defined on your machine.

# Source the configuration file for this machine.
if [ -z $1 ]; then
    source $1
elif [ -f $(pwd)/confing/setup.cf ]; then
    echo "using the default config file, $(pwd)/config/setup.cf" ];
elif [ -z $HEXMAP ]; then
    echo "Using preset \$HEXMAP var: $HEXMAP"
else
    echo "Path to configuration file as first arg or defined \$HEXMAP necessary."
    exit
fi

# Might need to make settings.json with your node file here....
# Build a www server with compression and other production enhancements.
cd $HEXMAP/www
$METEOR_PATH npm install --production
$METEOR_PATH build $HEXMAP/deploy --architecture os.linux.x86_64

