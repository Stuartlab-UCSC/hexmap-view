Compute Server Install
======================

Install python
--------------

See compute/build/README to install python and a python environment.

Note that if you do not have libssl-dev installed, uwsgi will not have the https
options available.


Install DrL
-----------

DrL graph layout [1]

To install in most unices. Other platforms may be installed as indicated in the
drl-graph-layout/readme.txt::

 wget https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip
 #alternatively:
     curl https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip > c41341de8058.zip
 unzip c41341de8058.zip
 cd adam*/src
 cp Configuration.gnu Configuration.mk
 make
 ls ../bin


Start server
------------

Start these servers::

 cd ... /compute
 run

The server has a log file with an extension of: '.log'.

