#!/bin/bash

uwsgi \
    --http-socket $HUB_SOCKET \
    --wsgi-file $HUB_PATH/hub.py \
    --callable app \
    --processes 1 \
    --threads 1
