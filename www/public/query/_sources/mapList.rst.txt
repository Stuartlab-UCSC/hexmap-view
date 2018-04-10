Get map list
============

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
single- or two-tier name. For example the three maps, Gliomas,
PancanAtlas/SampleMap, and PancanAtlas/Genemap would be represented as::

 {
    "Gliomas": [],
    "PancanAtlas": [
        "SampleMap",
        "GeneMap",
        ...
    ],
    ...
 }

Response error
--------------

Response errors have some HTTP code other than 200, with JSON content that may
contain a stack trace, such as::

 {
    "error": "Some message."
    "stackTrace" "an optional stack trace"
 }
