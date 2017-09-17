#!/bin/bash

# Stop a server

HEXMAP=$1
SERVER_TYPE=$2

FILE=pid/$SERVER_TYPE

cd $HEXMAP
if [ -e "$FILE" ]; then
    pkill -F $FILE
    rm $FILE
else
    echo No process to kill
fi
