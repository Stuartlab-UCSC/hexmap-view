#!/bin/bash
# $1: /path/to/the/config/file. If empty uses ./config/setup.cf
# Assumes you have the www.tar.gz bundled by deploy.sh at the $HEXMAP directory.
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

cd $HEXMAP
# Untar the new code, the dir inside the tar should be "www"
tar -xf www.tar.gz

# Install all the needed node packages
cd $HEXMAP/bundle/programs/server && $NODE_BIN/npm install

# Replace the old code with new code.
rm -rf www
mv bundle www

