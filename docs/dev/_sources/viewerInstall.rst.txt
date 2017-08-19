View Server Install
===================

Get an SSL certificate if you plan to use https.


Install python and libraries
----------------------------

python v2.7

 | colormath==2.1.1
 | numpy==1.10.4
 | pandas==0.17.1
 | scikit-learn==0.17.1
 | scipy==0.17.1
 | statsmodels==0.6.1


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


Install meteor
--------------

Install the specific meteor release::

 cd
 curl https://install.meteor.com/ > meteor.install
 vi meteor.install
   (set the definition of RELEASE as RELEASE=$METEOR_VERSION)
 sh meteor.install

This will also install a copy of node.


Install meteor packages
-----------------------

Check to see what packages are currently installed::

 meteor list

This may take a while because meteor will download any packages needed.

This should be the result of 'meteor list'::

 accounts-password       1.3.0* Password support for accounts
 accounts-ui             1.1.9  Simple templates to add login widgets to an app
 alanning:roles          1.2.15* Authorization package for Meteor
 blaze-html-templates    1.0.5* Compile HTML templates into reactive UI with Meteor Blaze
 browser-policy-content  1.0.11* Configure content security policies
 check                   1.2.3* Check whether a value matches a pattern
 dburles:google-maps     1.1.5  Google Maps Javascript API v3
 ecmascript              0.6.3* Compiler plugin that supports ES2015+ in all .js files
 ejson                   1.0.12* Extended and Extensible JSON library
 es5-shim                4.6.15  Shims and polyfills to improve ECMAScript 5 support
 force-ssl               1.0.12* Require this application to use HTTPS
 http                    1.2.9_1* Make HTTP calls to remote servers
 jquery                  1.11.9* Manipulate the DOM using CSS selectors
 meteor-base             1.0.4* Packages that every Meteor app needs
 mobile-experience       1.0.4  Packages for a great mobile user experience
 modules                 0.7.9* CommonJS module system
 mongo                   1.1.12_1* Adaptor for using MongoDB and Minimongo over DDP
 nourharidy:ssl          0.2.2  Sexy SSL support for Meteor
 random                  1.0.10  Random number generator and utilities
 reactive-dict           1.1.8* Reactive dictionary
 reactive-var            1.0.10* Reactive variable
 session                 1.1.6* Session variable
 shell-server            0.2.1* Server-side component of the `meteor shell` command.
 standard-minifier-css   1.2.1* Standard css minifier used with Meteor apps by default.
 standard-minifier-js    1.2.0_1* Standard javascript minifiers used with Meteor apps by default.
 tracker                 1.1.0* Dependency tracker to allow reactive callbacks
 vsivsi:job-collection   1.4.0* A persistent and reactive job queue for Meteor, supporting distributed workers that can run anywhere

Install any missing packages with 'meteor add <pkg>'.


Set Environment Variable
------------------------

Set the environment variable HEXMAP to the 'hexagram' directory from your clone
of the repository.


Set Path
--------

Include this in your path so you can find meteor's version of node and npm if
you want to run those commands outside of meteor:

~/.meteor/packages/meteor-tool/<version>/<platform>/dev_bundle/bin

Include the bin directory under drl-graph-layout in your path.


Install server
--------------

If you want to use HTTPS, install a node module needed for the http proxies::

 cd $HEXMAP
 npm install http-proxy

Install the node modules needed for meteor::

 cd $HEXMAP/www
 meteor npm install

Edit these start-up scripts to match your environment:

$HEXMAP/run-production
$HEXMAP/config/config.prod
$HEXMAP/config/settingsA.prod.json

Create directories for your data where we'll call your data root 'DATA'::

 mkdir DATA
 cd DATA
 mkdir featureSpace layoutInput view

Start server
------------

Start these servers::

 cd $HEXMAP
 run http
 run https
 run db
 run www

Each server has a log file with an extension of: '.log'.


Sphinx
------

Sphinx is used to build this document. To modify any documents, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html


References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.
