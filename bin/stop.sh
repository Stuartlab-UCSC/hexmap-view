#!/bin/bash
# $1: "db", "www", "http", or "https" : The server to stop.
# $2: The path to the configuration file, unneeded if in root of git repo, or HEXMAP var is set.
if [ -z $1 ]; then
    FILE=pid/$1
else
    echo "db, www, http, or https should be the first arg."
    exit 1
fi

# Source the configuration file for this machine.
if [ -z $2 ]; then
    source $2
elif [ -f $(pwd)/config/setup.cf ]; then
    echo "using the default config file, $(pwd)/config/setup.cf"
    source $(pwd)/config/setup.cf
elif [ -z $HEXMAP ]; then
    echo "Using preset \$HEXMAP var: $HEXMAP"
else
    HEXMAP=$(pwd)
fi

cd $HEXMAP
if [ -e "$FILE" ]; then
    pkill -F $FILE
    rm $FILE
else
    echo "No process to kill, there should be a pid dir in \$HEXMAP: " $HEXMAP
fi
