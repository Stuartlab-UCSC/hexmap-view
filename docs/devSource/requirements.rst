Requirements & Installation
===========================

Required libraries
------------------

**Python**

python v2.7

**Python modules**

colormath (2.1.1)

numpy (1.11.0)

pandas (0.17.1)

scikit-learn (0.17.1)

scipy (0.17.1)

statsmodels (0.6.1)

Miniconda was used to install these versions. If you want to use this to install
the python libraries, it is at:

http://conda.pydata.org/docs/install/quick.html

Use this form of the conda command to install the specific versions of packages
listed above::

 conda install numpy=1.11.0

**DrL graph layout [1]**

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

Set your path to include the DrL binaries::

 export PATH=./:DRL:$PATH


Web application deployment
--------------------------

After all of the above tools have been installed, these steps will bring up the server.

Substitute your directories for these tokens:

*HEXSRC* : directory of sources from the code repository

*HEX* : directory from which server code will be run

*DATA* : directory for your data

*DB* : directory for your database

*METEOR_SUBDIR* : the base binary directory specific to the meteor version

*CONDA* : miniconda install directory

*DRL* : DrL layout install directory

** : your


**Create directories**

Create some directories::

 mkdir -P HEX/www
 mkdir DB
 mkdir -p DATA/featureSpace DATA/layoutInput DATA/view


**Copy source code to the server directory**::

 cd HEXSRC
 cp -R .meteor client lib public server HEX/www
 cp -R .calc *HEX*/calc


**Environment variables**::

 # Map creators need these:
 export HEXMAP=HEX
 export PYTHONPATH=$HEXMAP/calc:$HEXMAP/www/server
 export PATH=./:DRL:$PATH

 # Developers need these.
 METEOR=$HOME/.meteor
 BASE=$HOME/.meteor/packages/meteor-tool/METEOR_VERSION/dev_bundle
 NPM_NODE=$BASE/bin
 MONGO=$BASE/mongodb/bin
 CONDA=$HOME/packages/miniconda2/bin
 export PATH=./:$PYTHONPATH:$CONDA:$MONGO:$METEOR:$NPM_NODE:$PATH


**Customize the Run Scripts**

Copy some scripts and modify them to match your environment::

 cd HEXSRC/.bin
 cp runDb runHex settings.json *HEX*


**Start the servers**::

 nohup runDB
 nohup runWww


Meteor
------

Meteor is a full-stack web application environment. This only needs to be
installed if you will be modifying the UI.

https://www.meteor.com/install


Sphinx
------

Sphinx is used to build this document. To modify this document, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html


References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.
