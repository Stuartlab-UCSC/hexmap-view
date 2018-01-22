#!/bin/bash
# $1: "db", "www", "http", or "https" : The server to stop.
# $2: The path to the configuration file. If empty uses ./config/setup.cf
SERVER_TYPE=$1
CONFIG_FILE=$2

if [ ! -z SERVER_TYPE ]; then
    PID_FILE=pid/$1
else
    echo "db, www, http, or https should be the first arg."
    exit 1
fi

# Attempt to use default configuration if the argument has not been supplied
if [ -z "$CONFIG_FILE" ] && [ -f "$(pwd)/config/setup.cf" ]; then
    CONFIG_FILE=$(pwd)/config/setup.cf
else
    echo "Path to configuration file as first arg necessary."
    exit 1
fi

source $CONFIG_FILE

cd $HEXMAP
if [ -e "$PID_FILE" ]; then
    pkill -F $PID_FILE
    rm $PID_FILE
else
    echo "No process to kill, there is no PID file at " $HEXMAP/$PID_FILE
fi
