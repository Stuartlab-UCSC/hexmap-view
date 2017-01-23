Source Code
===========

The code repository is at:

 | `github.com/ucscHexmap/hexagram <https://github.com/ucscHexmap/hexagram>`_

The most current code is in the dev branch.

Directory structure
-------------------
The source code uses a directory structure suggested by Meteor.

Below are descriptions of these directories, where the "." hides it from Meteor's deployment build:

**bin** : scripts to start servers

**calc** : python and other scripts that are not initiated by the client

**docker** : abandoned code

**docs** : sources for this document, and other documents

**tests** : unit and integration tests

**www**

 | **client** : client-only javascript

    | **htmlCss** : html and css files

    | **lib** : third-party libraries

 | **lib** : server and client files we want loaded first

 | **server** : server-only node/javascript and python initiated by the client

 | **public** : static files to be served, such as images


.. toctree::
   :maxdepth: 1

   clientSource
   serverSource
