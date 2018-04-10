Future: Get layout list
=======================

https://hexcalc.ucsc.edu/layoutList/mapId/<map-ID>

HTTP GET

data-type: json

This API retrieves all of the layout IDs for a map.

Example URL
-----------
::

 http://hexcalc.ucsc.edu/layoutList/mapId/PancanAtlas/SampleMap

Response success
----------------

This is returned as HTTP 200 with the content in JSON. For example::

 {
    "mapId" : <map-ID>,
    "layoutList" : [
        "mRNA",
        "CNV",
        ...
    ]
 }

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string in the form::

 {
    "error": "Some message."
 }
