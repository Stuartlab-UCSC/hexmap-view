This Document
=============

Important places:

* These pages: file://...hexagram/docs/dev/index.html
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

Tips on making Links
--------------------

Link to a section on this page: `Tips on making Links`_ ::

 `Tips on making Links`_

Link to a page in this doc: :doc:`repository` ::

 :doc:`repository`

Link to anywhere in this doc, given that you place a tag such as ".. _youMayUse:" just above the desired location:
:ref:`Link title <youMayUse>` ::

 :ref:`Link title <youMayUse>`

Link to a section on any page in this doc, given that you place a tag such as ".. _aGitQuickStart:" just above the section header:
:ref:`aGitQuickStart`::

 :ref:`aGitQuickStart`

Link to an external page: https://tumormap.ucsc.edu ::

 https://tumormap.ucsc.edu

Link to an external page displaying the given text: `tumormap <https://tumormap.ucsc.edu>`_ ::

 `tumormap <https://tumormap.ucsc.edu>`_

Other Documentation
-------------------

Other documentation built under Sphinx in the same manner:

* Web APIs: query
* User Guide: help

Using these locations:

* source files: hexagram/docs/help & hexagram/docs/query
* html files generated: hexagram/public/help & hexagram/public/query
* URLs: https://SERVER/help/index.html & https://SERVER/query/index.html
