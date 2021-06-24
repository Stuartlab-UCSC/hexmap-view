Data Server Install
===================

This installs the data server that is accessed by the view server as well as by
public APIs. This assumes you have already installed the view server from::

 https://github.com/stuartlab-UCSC/hexmap-view


Retrieve from the code repository
---------------------------------

::

 git clone https://github.com/stuartlab-UCSC/hexmap-data.git


Set environment variable
------------------------

Define a persistent envvar to the install directory::

 export HEXCALC=/full-path-to-your-install-of-data-server


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

Build a configuration file at $HEXCALC/ops/config.sh similar to this for
development::

 $HEXCALC/ops/configExamples/local.swat.

Or this for production::

 $HEXCALC/ops/configExamples/prod.sh.
 
Then create a symbolic link to your config file::

 cd $HEXCALC/config
 ln -s full-path-to-your-config config.sh


Install a python2.7 environment
-------------------------------

See $HEXCALC/build/README.txt to install python and a python environment.


Make data directories
---------------------

Make data directories used during operations::

 mkdir -p my-data/featureSpace my-data/view


Starting the server
-------------------

To start the data server see the section in this document, Data Server Commands.
