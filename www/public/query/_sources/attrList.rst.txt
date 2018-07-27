Get attribute list
==================

https://hexcalc.ucsc.edu/**attrList/mapId/<map-ID>**

HTTP GET

data-type: json

This API retrieves all of the attribute IDs for a map.

Example URL
-----------
::

 https://hexcalc.ucsc.edu/attrList/mapId/PancanAtlas/SampleMap

Response success
----------------

This is returned as HTTP 200 with the content in JSON. For example::

 [
    "gender",
    "subType",
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
