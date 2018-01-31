#!/bin/bash

# Build a www server with compression and other production enhancements.

HEXMAP=$1
BIN=$HEXMAP/bin

cd $HEXMAP/www
meteor npm install --production
meteor build $HEXMAP/deploy --architecture os.linux.x86_64
echo Built the deploy bundle in $HEXMAP/deploy.
cd $HEXMAP/deploy
scp www.tar.gz kolossus:dev
echo
echo If the scp session timed out, do this:
echo "scp deploy/www.tar.gz kolossus:dev"
