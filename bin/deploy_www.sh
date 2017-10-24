#!/bin/bash

# Build a www server with compression and other production enhancements.

HEXMAP=$1

BIN=$HEXMAP/bin

cd $HEXMAP/www
meteor npm install --production
meteor build $HEXMAP/deploy --architecture os.linux.x86_64
cd $HEXMAP/deploy
echo Built the deploy bundle in $HEXMAP/deploy.
cd deploy
scp *gz kolossus:dev
