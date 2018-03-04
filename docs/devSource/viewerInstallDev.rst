View Server Install: development
================================


Install meteor
--------------

Install the specific meteor release::

 cd
 curl https://install.meteor.com/ > meteor.install
 vi meteor.install
   (set the definition of RELEASE as RELEASE=$METEOR_VERSION)
 sh meteor.install

This also installs meteor's version of node and mongo.


Get code from repository
------------------------

The view server code repository is at: https://github.com/ucscHexmap/hexagram

The most current code is in the dev branch.


Set Environment Variables
-------------------------

Set the environment variables as:

* HEXMAP the 'hexagram' directory from your clone of the repository.
* HEX_VIEWER_CONFIG to the full path of your server configuration, similar to
  hexagram/config/dev-hexmap.swat


Install server
--------------

Install the node modules needed for meteor::

 cd $HEXMAP/www
 meteor npm install

Create directories for your data where we'll refer to your data root as '$DATA' ::

 mkdir $DATA
 cd $DATA
 mkdir featureSpace layoutInput view

Start server
------------

Start these servers::

 cd $HEXMAP
 start http
 start https
 start db
 start www

Log files are in $HEXMAP/log.


Sphinx
------

Use Sphinx to build this document.
http://www.sphinx-doc.org/en/stable/install.html


References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.
