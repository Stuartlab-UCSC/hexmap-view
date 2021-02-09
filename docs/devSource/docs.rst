Documents
=========

Developer Docs
--------------

This document is the developer documentation.T o edit this documentation we use
Sphinx, which may come with your system install. Sphinx is at::

 http://www.sphinx-doc.org/en/1.5.1/rest.html

The important directories are:

* source files: $HEXMAP/docs/devSource
* html files generated: $HEXMAP/docs/dev
* URL: file://$HEXMAP/docs/dev/index.html

After editing, while in the same directory as the .rst files,
build the html pages while in that directory with::

 makehtml

This will deposit the html pages into $HEXMAP/docs/dev and you can get to them
via the above URL.

Web APIs: query
---------------

API documentation is built under Sphinx in the same manner using these
locations:

* source files: $HEXMAP/docs/query
* html files generated: $HEXMAP/public/query
* URLs: https://SERVER/query/index.html

User Guide: help
----------------

The user guide and help text is built under Sphinx in the same manner using
these locations:

* source files: $HEXMAP/docs/help
* html files generated: $HEXMAP/public/hel
* URLs: https://SERVER/help/index.html
