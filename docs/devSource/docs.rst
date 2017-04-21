This Document
=============

Important places:

* These pages: file://ROOT/hexagram/docs/dev/index.html where ROOT is the full path to your hexagram directory
* Source files: hexagram/docs/devSource

To edit this documentation:

The source files are at hexagram/docs/devSource. We use Sphinx, which may come
with your system install. The .rst files have a fairly easy syntax you can
mostly pick up from existing examples. A definitive reference is at:
http://www.sphinx-doc.org/en/1.5.1/rest.html

After editing, while in the same directory as the .rst files,
build the html pages while in that directory with::

 makehtml

This will deposit the html pages into hexagram/docs/dev and you can get to them
via this URL: file://ROOT/hexagram/docs/dev/index.html

Other Documentation
-------------------

Other documentation built under Sphinx in the same manner:

* Web APIs: query
* User Guide: help

Using these locations:

* source files: hexagram/docs/KEY
* html files: hexagram/public/KEY
* URL: https://SERVER/KEY/index.html

Where KEY is replaced with one of the keys above. For example: hexagram/docs/help
