Requirements & Installation
===========================

Get an SSL certificate.

Required python libraries
-------------------------

**Python**

python v2.7

**Python modules**

 | colormath=2.1.1
 | numpy=1.10.4
 | pandas=0.17.1
 | scikit-learn=0.17.1
 | scipy=0.17.1
 | statsmodels=0.6.1

Miniconda was used to install these versions. If you want to use this to install
the python libraries, it is at:

http://conda.pydata.org/docs/install/quick.html

Use this form of the conda command to install the specific versions of packages
listed above::

 conda install numpy=1.10.4

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

Install meteor
--------------

::

 curl https://install.meteor.com/ | sh

Set up the environment
----------------------

Add these to the bash login profile, editing CONDA, DRLPATH AND HEXMAP to match
your install::

 CONDA="$HOME/packages/miniconda2/bin"
 METEORPATH=$HOME/.meteor
 METEORBASE=$METEORPATH/packages/meteor-tool/1.4.1_2/mt-os.linux.x86_64/dev_bundle
 NODEPATH=$METEORBASE/bin
 MONGOPATH=$METEORBASE/mongodb/bin
 DRLPATH=$HOME/packages/drl-graph-layout/bin
 export HEXMAP=$HOME/dev
 export PYTHONPATH=$HEXMAP/www/server:$HEXMAP/calc
 export PATH=".:$CONDA:$METEORPATH:$NODEPATH:$MONGOPATH:$DRLPATH:$PATH"

Exit and login to pick up the above changes.

Prepare your installation
-------------------------

Make some directories and copy files from your github clone::

 REP=<wherever your githup clone is located>
 mkdir $HEXMAP
 cd $HEXMAP
 mkdir db www http https
 cp -r $REP/bin bin
 cp -r $REP/calc calc
 cp -r $REP/www www

Set your application the correct meteor release::

 cd www
 meteor --release 1.4.1.2

After the server is up, kill it with CTRL-C.

Install some meteor packages so this is the end-result of 'meteor list'::

 accounts-password      1.3.0* Password support for accounts
 accounts-ui            1.1.9  Simple templates to add login widgets to an app
 alanning:roles         1.2.15  Authorization package for Meteor
 blaze-html-templates   1.0.5* Compile HTML templates into reactive UI with Me...
 check                  1.2.3* Check whether a value matches a pattern
 dburles:google-maps    1.1.5  Google Maps Javascript API v3
 ecmascript             0.5.8_1* Compiler plugin that supports ES2015+ in all ...
 ejson                  1.0.12* Extended and Extensible JSON library
 es5-shim               4.6.14_1* Shims and polyfills to improve ECMAScript 5 ...
 force-ssl              1.0.12* Require this application to use HTTPS
 http                   1.2.9_1* Make HTTP calls to remote servers
 jquery                 1.11.9* Manipulate the DOM using CSS selectors
 meteor-base            1.0.4  Packages that every Meteor app needs
 mobile-experience      1.0.4  Packages for a great mobile user experience
 mongo                  1.1.12_1* Adaptor for using MongoDB and Minimongo over...
 nourharidy:ssl         0.2.2  Sexy SSL support for Meteor
 random                 1.0.10  Random number generator and utilities
 reactive-dict          1.1.8  Reactive dictionary
 reactive-var           1.0.10* Reactive variable
 session                1.1.6* Session variable
 shell-server           0.2.1  Server-side component of the `meteor shell` com...
 standard-minifier-css  1.2.1* Standard css minifier used with Meteor apps by ...
 standard-minifier-js   1.2.0_1* Standard javascript minifiers used with Meteo...
 tracker                1.1.0* Dependency tracker to allow reactive callbacks
 vsivsi:job-collection  1.4.0  A persistent and reactive job queue for Meteor,...

Install some node modules::

 cd $HEXMAP
 npm install http-proxy
 cd www
 meteor npm install --save bcrypt

Make an entry in bin/run_server under the config section for your server and
its configuration.

Create your run script with this content, editing the definitions HEXMAP and
INSTALL::

 #!/bin/bash
 INSTALL=<myServer?
 HEXMAP=/data
 $HEXMAP/bin/run_server $1 $INSTALL $HEXMAP

Modify these files for your environment::

 bin/run_server to make an entry for INSTALL of <myServer>
 http/http.js for ports
 https/https.js for ports & certificate directory
 settingsA.*.json

Create directories for your data::

 mkdir <top-of-data-dir-tree>
 cd <top-of-data-dir-tree>
 mkdir featureSpace layoutInput view

Starting the application
------------------------

Start the servers::

 cd $HEXMAP
 run http
 run https
 run db
 run www

Sphinx
------

Sphinx is used to build this document. To modify this document, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html


References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.
