#!/usr/bin/python
from flup.server.fcgi import WSGIServer
from hub import app

if __name__ == '__main__':

    # TODO use the proper socket "exact same path you define in the server config"
    WSGIServer(app, bindAddress='/path/to/fcgi.sock').run()
