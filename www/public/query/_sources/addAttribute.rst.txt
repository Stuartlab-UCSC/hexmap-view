Add new coloring attributes
===========================

https://hexcalc.ucsc.edu:5000/query/**addAttribute**

HTTP POST with content-type: application/json

data-type: json

This API takes data for one or more of your attributes and adds them as values
to color an existing map.

Content Example
---------------
::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "attributes": [
        {
            "name": "mySignature",
            "nodeIds": [
                "node1",
                "node2",
                ...
            ],
            "values": [
                0.897,
                0.904,
                ...
            ]
        },
        {
            "name": "mySubtype",
            "nodeIds": [
                "node1",
                "node2",
                ...
            ],
            "values": [
                "basal-a",
                "basal-b",
                ...
            ]
        },
        ...
    ]
 }
    
Where:

* **map** : a unique identifier. If the map belongs to a map group, that is
  included before the specific map separated by a slash as in the example.
* **layout** : name of a particular layout of nodes within a map.
* **attributes** : an array of color attribute objects which contain the
  attribute name, node IDs and values for each attribute.

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string in the form::

 {
    "url": "https://tumormap.ucsc.edu/?bookmark=64qwg",
 }

Where:

* **url**: the map with the new coloring attributes

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string in the form::

 {
    "error": "Some message."
 }

