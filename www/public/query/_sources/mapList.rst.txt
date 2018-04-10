Future: Get map list
====================

https://hexcalc.ucsc.edu/**mapList**

HTTP GET

data-type: json

This API retrieves all of the public map names.

Example URL
-----------
::

 http://hexcalc.ucsc.edu/mapList

Response success
----------------

This is returned as HTTP 200 with the content in JSON. A map may have a
single- or two-tier name. For example the maps, Gliomas, PancanAtlas/SampleMap,
and PancanAtlas/Genemap would be represented as::

 {
    "mapList" : {
        "Gliomas": [],
        "PancanAtlas": [
            "SampleMap",
            "GeneMap",
            ...
        ],
        ...
    }
 }

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string in the form::

 {
    "error": "Some message."
 }
