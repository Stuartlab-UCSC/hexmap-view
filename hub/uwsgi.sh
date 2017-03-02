#!/bin/bash

uwsgi \
    --http-socket 127.0.0.1:5000 \
    --wsgi-file hub.py \
    --callable app \
    --processes 4 \
    --threads 2
