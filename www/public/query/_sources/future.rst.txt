
Future APIs
===========

Get available maps
------------------

https://<hub>/query/**availableMaps**

GET or POST with content-type: application/json

data-type: json


Get map view data
-----------------

https://<hub>/query/data/view/<mapID>/<data-file>

GET or POST with content-type: application/json

data-type: json

This is a general data file retrieval API usable for any data file within a
map's view data directory.

Example: retrieve the attribute names for the treehouse v3 map::

 https://treehouseHexHub.ucsc.edu/query/data/view/CKCC/v3/layers.tab


Dynamic statististics
---------------------

https://<hub>/query/**dynamicStats**

POST with content-type: application/json

data-type: json


Reflect from one map to another
-------------------------------

https://<hub>/query/**reflect**

POST with content-type: application/json

data-type: json
