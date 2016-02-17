Source Code
===========

The code repository is at:

 | `github.com/ucscHexmap/hexagram <https://github.com/ucscHexmap/djangoOligo>`_

Directory structure
-------------------
The source code uses a directory structure suggested by Meteor.

Below are descriptions of these directories, where the "." hides it from Meteor's deployment build:

**.docs** : sources for this document

**.python** : python that is not initiated by the client

**client** : client-only javascript

 | **htmlCss** : html and css files

 | **lib** : 3rd party libraries

**public** : static files to be served, such as images

 | **docs** : html pages for this document

 | **images** : images that jquery-ui wants in an image directory

**server** : server-only node/javascript and python initiated by the client

.. toctree::
   :maxdepth: 1

   clientSource
   serverSource
