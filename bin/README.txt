
Scripts in this directory:

Server operations:
    cd $HEXMAP
    bin/start [ https / db / www ]
    bin/stop [ https / db / www ]

Or server operations for protected ports:
    start db
    stop db
    sudo --preserve-env $HEXMAP/bin/start [ https / www ]
    sudo --preserve-env $HEXMAP/bin/stop [ https / www ]

Installation:
    deployWww: make a tar file to install or update another installation
    installWww: extract from the deployed tar file into the target installation
