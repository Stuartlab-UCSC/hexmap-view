Internal Web API
================

.. toctree::
   :maxdepth: 1

These are APIs that we may not necessarily want to advertise to the public.

Public web APIs are described at https://tumormap.ucsc.edu/query/index.html


Get Data
--------

https://<compute-server>/data/<data-ID>

GET with content-type returned: application/json

This is a general data retrieval API usable for any data within a
map's view data. Used by the viewer to retrieve view data.

Example: retrieve the attribute metadata for the Pancan12 SampleMap::

 https://tumormap.ucsc.edu/data/view/Pancan12/SampleMap/layers.tab

Returns json or tsv, depending on the file and in the same format as
persistent store.

More to be documented.


Create Bookmark
---------------

https://<view-server>/bookmark/<state>

POST with content-type returned: application/json

This API creates a bookmark on a view server with the given client state data.

More to be documented.


Get available maps (future)
---------------------------

https://<compute-server>/TBD

GET with content-type returned: application/json

Retrieve the map names available on this view server for which the user is
authorized.

TBD


Dynamic Statistics (future)
---------------------------

https://<compute-server>/query/TBD

POST with content-type returned: application/json

Compute the statististics for a dynamically added attribute.

TBD
