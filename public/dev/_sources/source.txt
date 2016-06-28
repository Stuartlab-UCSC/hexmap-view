Source Code
===========

The code repository is at:

 | `github.com/ucscHexmap/hexagram <https://github.com/ucscHexmap/djangoOligo>`_

Directory structure
-------------------
The source code uses a directory structure suggested by Meteor.

Below are descriptions of these directories, where the "." hides it from Meteor's deployment build:

**.docs** : sources for this document and query API

**.server** : python and other scripts that are not initiated by the client

 | **start** : scripts to start servers

**client** : client-only javascript

 | **htmlCss** : html and css files

 | **lib** : 3rd party libraries and client files we want loaded first

**lib** : server and client files we want loaded first

**public** : static files to be served, such as images

 | **images** : images that jquery-ui wants in an image directory

 | **query** : html pages for the Query API document

 | **zurhfads** : html pages for this document

**server** : server-only node/javascript and python initiated by the client

 | **lib** : server files we want loaded first

**tests** : unit and integration tests


.. toctree::
   :maxdepth: 1

   clientSource
   serverSource
