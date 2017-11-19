#!/bin/bash
# $1: /path/to/the/config/file
# Assumes you have the www.tar.gz bundled by deploy.sh at the $HEXMAP directory.

# Use the configuration file for the machine.
if [ -z $1 ]; then
    source $1
elif [ -f $(pwd)/confing/setup.cf ]; then
    echo "using the default config file, $(pwd)/config/setup.cf" ];
    source $(pwd)/confing/setup.cf
else
    echo "Path to configuration file as first arg necessary."
    exit 1
fi

cd $HEXMAP
# Untar the new code, the dir inside the tar should be "www"
tar -xf www.tar.gz

# Install all the needed node packages
cd $HEXMAP/bundle/programs/server && $NODE_BIN/npm install

# Replace the old code with new code.
rm -rf www
mv bundle www

