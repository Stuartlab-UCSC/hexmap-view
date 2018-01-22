#!/bin/bash

# Build a www server with compression and other production enhancements.

HEXMAP=$1
BIN=$HEXMAP/bin

cd $HEXMAP/www
meteor npm install --production
meteor build $HEXMAP/deploy --architecture os.linux.x86_64
echo Built the deploy bundle in $HEXMAP/deploy.
echo
echo ENTER YOUR PASSWORD BEFORE TIME OUT
echo
cd $HEXMAP/deploy
scp www.tar.gz kolossus:dev
