Requirements & Installation
===========================

Get an SSL certificate.

Install python and libraries
----------------------------

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

Set up the environment
----------------------

Add these to the bash login profile, editing CONDA, DRLPATH and HEXMAP to match
your install. HEXMAP is the root path of where you will place the server::

 METEOR_VERSION=1.4.1.2
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

Install meteor
--------------

Install the specific meteor release::

 cd
 curl https://install.meteor.com/ > meteor.install
 vi meteor.install
   (set the definition of RELEASE as RELEASE=$METEOR_VERSION)
 sh meteor.install

Set up server directories
-------------------------

Make some directories and copy files from your github clone::

 REP=<wherever your githup clone is located>
 mkdir $HEXMAP
 cd $HEXMAP
 mkdir db www http https
 cp -r $REP/bin bin
 cp -r $REP/calc calc
 cp -r $REP/www www
 cp bin/http.js http
 cp bin/https.js https

Install meteor packages
-----------------------

Check to see what packages are currently installed::

 meteor list

This may take a while because meteor will download any packages needed.

This should be the result of 'meteor list'::

 accounts-password      1.3.3  Password support for accounts
 accounts-ui            1.1.9  Simple templates to add login widgets to an app
 alanning:roles         1.2.15  Authorization package for Meteor
 blaze-html-templates   1.0.5* Compile HTML templates into reactive UI with Meteor Blaze
 check                  1.2.4  Check whether a value matches a pattern
 dburles:google-maps    1.1.5  Google Maps Javascript API v3
 ecmascript             0.6.1  Compiler plugin that supports ES2015+ in all .js files
 ejson                  1.0.13  Extended and Extensible JSON library
 es5-shim               4.6.15  Shims and polyfills to improve ECMAScript 5 support
 force-ssl              1.0.13  Require this application to use HTTPS
 http                   1.1.8* Make HTTP calls to remote servers
 jquery                 1.11.10  Manipulate the DOM using CSS selectors
 meteor-base            1.0.4  Packages that every Meteor app needs
 mobile-experience      1.0.4  Packages for a great mobile user experience
 mongo                  1.1.14  Adaptor for using MongoDB and Minimongo over DDP
 nourharidy:ssl         0.2.2  Sexy SSL support for Meteor
 random                 1.0.10  Random number generator and utilities
 reactive-dict          1.1.8  Reactive dictionary
 reactive-var           1.0.11  Reactive variable
 session                1.1.7  Session variable
 shell-server           0.2.1  Server-side component of the `meteor shell` command.
 standard-minifier-css  1.3.2* Standard css minifier used with Meteor apps by default.
 standard-minifier-js   1.2.1* Standard javascript minifiers used with Meteor apps by default.
 tracker                1.1.1  Dependency tracker to allow reactive callbacks
 vsivsi:job-collection  1.4.0  A persistent and reactive job queue for Meteor, supporting distributed workers that can run anyw...

Install any missing packages with 'meteor add <pkg>'.

Install server
--------------

Install a node module needed for the http proxies that allow https::

 cd $HEXMAP
 npm install http-proxy

Set up node and install a node module needed for the meteor package: 'random'::

 cd $HEXMAP/www
 meteor npm install
 meteor npm install --save bcrypt
 meteor npm install --save babel-runtime
 
Note that this warning may safely be ignored::

 npm WARN www@1.0.0 No repository field

Make an entry in $HEXMAP/bin/run_server under the config section for your server,
giving it a unique INSTALL string which we will reference as <myInstall>.

Create your run script in $HEXMAP with this content, editing the definition of
INSTALL::

 #!/bin/bash
 INSTALL=<myInstall>
 $HEXMAP/bin/run_server $1 $INSTALL $HEXMAP

Create directories for your data::

 mkdir <top-of-data-dir-tree>
 cd <top-of-data-dir-tree>
 mkdir featureSpace layoutInput view

Make a copy of the settings file specific to your install::

 cd $HEXMAP
 cp bin/settingsA.prod.json bin/settingsA.<myInstall>.json

Modify these files for your environment::

 bin/run_server to make an entry for INSTALL of <myServer>
 http/http.js for ports
 https/https.js for ports & certificate directory
 settingsA.<myInstall>.json

Start server
------------

Start the servers::

 cd $HEXMAP
 run http
 run https
 run db
 run www

Each server has a log file with an extension of: '.log'.

Sphinx
------

Sphinx is used to build this document. To modify this document, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html

References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.
