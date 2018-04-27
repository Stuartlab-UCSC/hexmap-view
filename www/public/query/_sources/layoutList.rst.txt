Get layout list
===============

https://hexcalc.ucsc.edu:8332/**layoutList/mapId/<map-ID>**

HTTP GET

data-type: json

This API retrieves all of the layout IDs for a map.

Example URL
-----------
::

 https://hexcalc.ucsc.edu:8332/layoutList/mapId/PancanAtlas/SampleMap

Response success
----------------

This is returned as HTTP 200 with the content in JSON. For example::

 [
    "mRNA",
    "CNV",
    ...
 ]

Response error
--------------

Response errors have some HTTP code other than 200, with JSON content that may
contain a stack trace, such as::

 {
    "error": "Some message."
    "stackTrace" "an optional stack trace"
 }
