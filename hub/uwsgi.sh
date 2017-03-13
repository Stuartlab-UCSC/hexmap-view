#!/bin/bash

#uwsgi options:
#   ssl-session-timeout
#   http-timeout  set internal http socket timeout
#   http-connect-timeout  set internal http socket timeout for backend connections
#   socket-timeout  set internal sockets timeout

if [ $HUB_SOCKET == 127.0.0.1:5000 ]; then
    echo 'Starting the local calc server'
    
    uwsgi \
        --master \
        --http-socket $HUB_SOCKET \
        --wsgi-file $HUB_PATH/hub.py \
        --callable app \
        --processes 1 \
        --threads 1
    exit

elif [ $HUB_SOCKET == tumormap.ucsc.edu:8332 ]; then
    echo 'Starting the production calc server'
    SEC_PATH=/data/certs
    KEY=$SEC_PATH/tumormap.key # change to use env vars SSL_CERT & SSL_KEY
    CERT=$SEC_PATH/tumormap.crt
    CA=$SEC_PATH/chain.crt
    PID_PATH=/hive/groups/hexmap/prod/hub/hub.pid
    SECURE=$HUB_SOCKET,$CERT,$KEY,HIGH,$CA

elif [ $HUB_SOCKET == hexdev.sdsc.edu:8332 ]; then
    echo 'Starting the dev calc server'
    SEC_PATH=/data/certs
    KEY=$SEC_PATH/hexdev.key # change to use env vars SSL_CERT & SSL_KEY
    CERT=$SEC_PATH/hexdev.crt
    CA=$SEC_PATH/chain.crt
    PID_PATH=/hive/groups/hexmap/dev/hub/hub.pid
    SECURE=$HUB_SOCKET,$CERT,$KEY,HIGH,$CA
fi

uwsgi \
    --master \
    --https-socket $SECURE \
    --wsgi-file $HUB_PATH/hub.py \
    --callable app \
    --pidfile $PID_PATH \
    --processes 1 \
    --threads 1
