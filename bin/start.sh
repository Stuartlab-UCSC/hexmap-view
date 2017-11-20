#!/bin/bash
# $1: "db", "www", "http", or "https" : The server to start.
# $2: The path to the configuration file. If empty uses ./config/setup.cf
SERVER_TYPE=$1
CONFIG_FILE=$2

# Attempt to use default configuration if the argument has not been supplied
if [ -z "$CONFIG_FILE" ] && [ -f "$(pwd)/config/setup.cf" ]; then
    CONFIG_FILE=$(pwd)/config/setup.cf
else
    echo "Path to configuration file as first arg necessary."
    exit 1
fi

echo "Using config file: $CONFIG_FILE"

if [ "$SERVER_TYPE" == "www" ]; then
    ./bin/www.sh $CONFIG_FILE
elif [ "$SERVER_TYPE" == "http" ]; then
    ./bin/http.sh $CONFIG_FILE
elif [ "$SERVER_TYPE" == "https" ]; then
    ./bin/https.sh $CONFIG_FILE
elif [ "$SERVER_TYPE" == "db" ]; then
    ./bin/db.sh $CONFIG_FILE
fi