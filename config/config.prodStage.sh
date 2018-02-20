#!/bin/bash

DB_NAME=admin   # Name of the mongo database
DB_PORT=27017   # Port on which the database listens

# Needed by the www server.
export HTTP_PORT=80    # Http proxy port if using http, otherwise unused
export HTTPS_PORT=443  # Https proxy port if using https, otherwise the same as PORT
export PORT=8443       # Port on which the meteor server listens
export ROOT_URL=https://hexmap-new.sdsc.edu:$HTTPS_PORT # User's view of the URL