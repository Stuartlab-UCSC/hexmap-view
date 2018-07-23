Data Server Install
===================

Install server source code
--------------------------

The data server code repository is at: https://github.com/ucscHexmap/compute.
Install the source, where *my-app* is the root directory of the app::

 cd my-app
 git clone https://github.com/ucscHexmap/compute.git


Set environment variable and path
---------------------------------

Define the HEXCALC environment variable to point to the installation directory.
Add the binary path to your path.
You should put these in your login profile::

 export HEXCALC=my-app/compute
 PATH=$HEXCALC/bin:$PATH


Make data directories
---------------------

Make data directories used during operations. The *my-data* directory does not
need to be in any particular place in relation to the *my-app* directory::

 mkdir -p my-data/featureSpace my-data/view


HTTPS
-----

If you want to use https, put the certificates someplace where the server will
find it.


Install DrL
-----------

DrL graph layout [1]

To install in most unices. Other platforms may be installed as indicated in the
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

Build a configuration file at ops/config.sh similar to
ops/configExamples/prod.sh.


Install python
--------------

See compute/build/README to install python and a python environment.

Note that if you do not have libssl-dev installed, uwsgi will not have the https
options available.


Script to run on protected ports
--------------------------------

If you will be running on one of the protected ports such as
80 or 443, get sudo access to the script, $HEXCALC/runAsRoot and build that
script like so::

 cd $HEXCALC
 vi startAsRoot
 export HEXCALC=my-app/compute
 $HEXCALC/bin/start

 chmod +x startWww


Start server
------------

As root
^^^^^^^

Be sur
After the server is started on the protected port the user and group ID of the
processes will be changed to the ownership as specified in the configuration
file as HEX_UID and HEX_GID::

 sudo $HEXCALC/../startWww

As non-root
^^^^^^^^^^^

If you will be running the server on an unprotected port, simply do::

 $HEXCALC/bin/start

The log file is at compute/ops/log with older logs in compute/ops/logsPrev.

Other scripts are described in bin/README.




