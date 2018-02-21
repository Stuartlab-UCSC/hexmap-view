#!/bin/bash
if [ -z "$HEXMAP" ]; then
    echo "HEXMAP env var must be defined."
    exit 1
fi
if [ -z "$HEX_VIEWER_CONFIG" ]; then
    echo "HEX_VIEWER_CONFIG env var must be defined."
    exit 1
fi
echo "Using config file: $HEX_VIEWER_CONFIG"
exit 0
