Internal Web API Overview
=========================

.. toctree::
   :maxdepth: 1

   createBookmark
   statsDynamic

These are web APIs that we don't necessarily want to advertise to the public,
even though they will be available.


Get available maps
------------------

https://<hub>/query/**availableMaps**

GET or POST with content-type: application/json

data-type: json

Retrieve the map names available on this view server, both major and minor.

TBD


Get map file by file name
-------------------------

https://<hub>/file/<filename>/<map>

GET or POST with content-type: application/json

data-type: json

This is a general data file retrieval API usable for any data file within a
map's view data directory. Used by the viewer to retrieve view files.

Example: retrieve the attribute names for the treehouse v3 map::

 https://treehouseHexHub.ucsc.edu/file/layers.tab/CKCC/v3

TBD

Get map file by type
--------------------

https://<hub>/file/<type>/<name>/<mapID>

GET or POST with content-type: application/json

data-type: json

This retrieves certain data files by type within a map's view data directory.

* <type> : one of: 'attr', 'node', 'layout', 'xyPreSquiggle'
* <name> : the name of the attribute, node or layout for types layout and xyPreSquiggle

Example: retrieve the attribute names for the treehouse v3 map::

 https://treehouseHexHub.ucsc.edu/data/attr/Tissue/CKCC/v3

TBD


Reflect from one map to another
-------------------------------

https://<hub>/query/**reflect**

POST with content-type: application/json

data-type: json

TBD
