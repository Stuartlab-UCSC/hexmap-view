#!/bin/bash

HEXMAP=/cluster/home/swat/dev
PORT=8223
HTTPS_PORT=8222
DB_PORT=28223
DB_NAME=$INSTALL
METEOR=/cluster/home/swat/.meteor
METEOR_BASE=$METEOR/packages/meteor-tool/1.4.1_2/mt-os.linux.x86_64/dev_bundle
PYTHONBIN=/cluster/home/swat/packages/miniconda2/bin
DRLPATH=/cluster/home/swat/packages/drl-graph-layout/bin
export ROOT_URL=https://hexdev.sdsc.edu:$HTTPS_PORT
export PATH=$PYTHONBIN:$DRLPATH:$PATH
