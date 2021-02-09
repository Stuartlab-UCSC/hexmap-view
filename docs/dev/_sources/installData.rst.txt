Data Server Install
===================

This installs the data server that is accessed by the view server as well as by
public APIs. To install the view server, see the section in this document,
Install: Development View Server or Install: Production View Server.

Retrieve from the code repository
---------------------------------

::

 git clone https://github.com/stuartlab-UCSC/hexmap-data

Set environment variable and path
---------------------------------

Define a persistent envvar to the install directory and add it to your path::

 export HEXCALC=/full-path-to-your-install-of-data-server
 PATH=$HEXCALC/bin:$PATH

Make data directories
---------------------

Make data directories used during operations::

 mkdir -p my-data/featureSpace my-data/view

Install DrL graph layout
------------------------

To install on most unices. Other platforms may be installed as indicated in the
drl-graph-layout/readme.txt::

 cd $HEXCALC/../
 mkdir packages
 cd packages
 wget https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip
 #alternatively:
     curl https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip > c41341de8058.zip
 unzip c41341de8058.zip
 cd adam*/src
 cp Configuration.gnu Configuration.mk
 make
 ls ../bin
 cd ../../
 mv adam_novak-drl-graph-layout-c41341de8058 drl-graph-layout

In bin you should see 'truncate' among other binaries.

Configure
---------

Build a configuration file at $HEXCALC/ops/config.sh similar to
$HEXCALC/ops/configExamples/prod.sh.

Install python
--------------

See $HEXCALC/build/README to install python and a python environment.

Starting the server
-------------------

To start the data server see the section in this document, Operational Commands.
