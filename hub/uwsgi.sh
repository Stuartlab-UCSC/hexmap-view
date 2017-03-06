#!/bin/bash

127.0.0.1:5000
if [ $HUB_SOCKET == 127.0.0.1:5000 ]; then
    echo 'Starting the local calc server'
    uwsgi \
        --master \
        --http $HUB_SOCKET \
        --wsgi-file $HUB_PATH/hub.py \
        --callable app \
        --processes 1 \
        --threads 1
    exit

elif [ $HUB_SOCKET == hexdev.sdsc.edu:8332 ]; then
    echo 'Starting the dev calc server'
    SEC_PATH=/data/certs
    KEY=$SEC_PATH/hexdev.key # change to use env vars SSL_CERT & SSL_KEY
    CERT=$SEC_PATH/hexdev.crt
    CA=$SEC_PATH/chain.crt
    SECURE=$HUB_SOCKET,$CERT,$KEY,HIGH,$CA
fi

uwsgi \
    --master \
    --https $SECURE \
    --wsgi-file $HUB_PATH/hub.py \
    --callable app \
    --processes 2 \
    --threads 2
