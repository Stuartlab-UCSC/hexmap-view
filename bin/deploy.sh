#!/bin/bash
# $1: /path/to/the/config/file, can be ommited if there is a
# config/setup.ch in the current directory, or if $HEXMAP is defined on your machine.
CONFIG_FILE=$1

# Attempt to use default configuration if the argument has not been supplied
if [ -z "$CONFIG_FILE" ] && [ -f "$(pwd)/config/setup.cf" ]; then
    CONFIG_FILE=$(pwd)/config/setup.cf
else
    echo "Path to configuration file as first arg necessary."
    exit 1
fi

echo "Using config file: $CONFIG_FILE"
source $CONFIG_FILE

# Might need to make settings.json with your node file here....
# Build a www server with compression and other production enhancements.
cd $HEXMAP/www
$METEOR_PATH npm install --production
$METEOR_PATH build $HEXMAP/deploy --architecture os.linux.x86_64

