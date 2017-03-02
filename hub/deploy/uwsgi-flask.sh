#!/bin/bash

# flask deployment example for ours:
uwsgi \
    -s /tmp/hub.sock \
    --manage-script-name
    --mount /hub:app

# flask deployment example:
#uwsgi \
#    -s /tmp/yourapplication.sock \
#    --manage-script-name
#    --mount /yourapplication=myapp:app

# from rob's uwsgi.ini for docker
#wsgi = dtmp.dtmp
#callable = app
#check-static = dtmp/static
#static-index = index.html
#processes = 4
#threads = 4
#http-socket = 0.0.0.0:5000
