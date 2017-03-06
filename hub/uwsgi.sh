#!/bin/bash

echo '!!! HUB_SOCKET:' $HUB_SOCKET '!!!'

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
    KEY=$SEC_PATH/hexdev.key
    CERT=$SEC_PATH/hexdev.crt
    CA=$SEC_PATH/chain.crt
    SECURE=$HUB_SOCKET,$CERT,$KEY,HIGH,$CA
    echo !!! SECURE: $SECURE
fi

uwsgi \
    --master \
    --https $SECURE \
    --wsgi-file $HUB_PATH/hub.py \
    --callable app \
    --processes 2 \
    --threads 2



#SECURE=$HUB_SOCKET,$CERT,$KEY,HIGH,!$CA
#    --http-socket $HUB_SOCKET \

# no ca cert:
#uwsgi --master --https 0.0.0.0:8443,foobar.crt,foobar.key

# with ca cert on 443:
#master = true
#shared-socket = 0.0.0.0:443
#uid = www-data
#gid = www-data
#https = =0,foobar.crt,foobar.key,HIGH,!ca.crt
#http-to = /tmp/uwsgi.sock

