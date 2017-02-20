Internal Web API on Hub
=======================

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


Get map view data
-----------------

https://<hub>/query/data/view/<mapID>/<data-file>

GET or POST with content-type: application/json

data-type: json

This is a general data file retrieval API usable for any data file within a
map's view data directory.

Example: retrieve the attribute names for the treehouse v3 map::

 https://treehouseHexHub.ucsc.edu/query/data/view/CKCC/v3/layers.tab

 TBD


Reflect from one map to another
-------------------------------

https://<hub>/query/**reflect**

POST with content-type: application/json

data-type: json

TBD
