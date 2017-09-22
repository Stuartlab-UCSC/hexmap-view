#!/bin/bash

# Install a www server with compression and other production enhancements.

HEXMAP=$1
NODE_BIN=$HEXMAP/packages/node/bin

cd $HEXMAP

echo date
echo untarring...
if [ $HEXMAP == '/data' ]; then
    tar xf /cluster/home/swat/dev/www.tar.gz
else
    tar xf www.tar.gz
fi

echo npm installing...
cd $HEXMAP/bundle/programs/server
$NODE_BIN/npm install > $HEXMAP/log/npmInstall

echo date
echo stopping www
cd $HEXMAP
run stop www

echo removing old www files...
rm -rf www

echo moving new files to www
mv bundle www

echo starting www
run www
echo date
