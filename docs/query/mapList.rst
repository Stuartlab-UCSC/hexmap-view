Future: Get the public maps available
=====================================

https://hexcalc.ucsc.edu:5000/mapList

HTTP GET

data-type: json

This API retrieves all of the public maps.

Example URL
-----------
::

 http://hexcalc.ucsc.edu/mapList

Response success
----------------

This is returned as HTTP 200 with the content being in JSON. For example::

 {
    "mapList" : [
        "PancanAtlas/SampleMap",
        "WCDT",
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
