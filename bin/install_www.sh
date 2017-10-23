#!/bin/bash

# Install a www server with compression and other production enhancements.

HEXMAP=$1
TAR_FILE=$2  # Only needed for production, full path name of tar file
NODE_BIN=$HEXMAP/packages/node/bin

cd $HEXMAP

date
echo untarring...
if [ $HEXMAP == '/data' ]; then # untar to production from dev area
    tar xf $TAR_FILE
else
    tar xf www.tar.gz
fi

echo npm installing...
cd $HEXMAP/bundle/programs/server
$NODE_BIN/npm install > $HEXMAP/log/npmInstall

date
echo stopping www
cd $HEXMAP
run stop www

echo removing old www files...
rm -rf www

echo moving new files to www
mv bundle www

echo starting www
run www
date
