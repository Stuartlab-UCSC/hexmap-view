Future: Highlight attributes & nodes
====================================

https://hexcalc.ucsc.edu:8332/**highlightAttrNode**

HTTP POST with content-type: application/json

data-type: json

This API shows a map with the given list of attributes and nodes highlighted.

Content Example
---------------
::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "attributes": [
        "gender",
        "subType",
        ...
    ],
    "nodes": [
        "TCGA-01",
        "TCGA-02",
        ...
    ],
 }
    
Where:

* **map** : a unique identifier for a map
* **layout** : name of a particular layout of nodes within a map.
* **attributes** : an array of color attribute IDs.
* **nodes** : an array of node IDs.

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string in the form::

 {
    "url": "https://tumormap.ucsc.edu/?bookmark=64qwg",
 }

Where:

* **url**: the map with the attributes and nodes highlighted.

Response error
--------------

Response errors have some HTTP code other than 200, with JSON content that may
contain a stack trace, such as::

 {
    "error": "Some message."
    "stackTrace" "an optional stack trace"
 }
