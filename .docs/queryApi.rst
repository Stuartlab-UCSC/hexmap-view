Query API
=========

Revision: February 10, 2016

All Queries
-----------
 | API query URLs begin with "https://tumormap.ucsc.edu/?query=" followed by the specific query ID.
 | API query parameters are sent in the HTTP POST messsge body in JSON format.
 | API responses are returned in JSON format.


Query API: placeNewNodes
------------------------

Place new nodes on a frozen map.

JSON message body example::

 {
    "map": "pancan33+target",
    "mRNA": {
        "mySample1": {
            "ALK": "0.897645",
            "TP53": "0.904140",
            "POGZ: "0.792754",
            ...
        },
        ...
    },
    ...
 }

Definitions

 | layout: type of values by which the new node will be placed on the map. e.g., "mRNA"
 | map: frozen map ID. e.g., "pancan33+target"
 | node: identifier for the node to be placed on the map. e.g., TCGA sample ID
 | node property: identifier for the node's property, e.g., "TP53"
 | query ID: text following the base URL

JSON message body format::

 {
    "map": <map ID>,
    <layout>: {
        <node>: {
                <node-property>: <node-property value>,
                (1 to N properties)
                ...
            },
            (1 to N nodes)
            ...
    },
    (1 to N layouts)
     ...
 }

Response success example: HTTP 200::

 {
    "bookmark": "https://tumormap.ucsc.edu/?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE",
    "unknown node properties": [
        "ALKz",
        "TP03",
        ...
    ]
 }

Response success format: HTTP 200::

 {
    "bookmark": <bookmark>
    "unknown node properties": [
        <node-property>,
        ...
    ]
 }

Response errors

 | HTTP 400 'map "pancan44" not found.'
 | HTTP 400 'layout "sRNA" of map "pancan12" not found.'
 | HTTP 400 'map missing or malformed.'
 | HTTP 400 'layout missing or malformed.'
 | HTTP 400 'layoutData missing or malformed.'
 | HTTP 400 'nodes missing or malformed.'
 | HTTP 400 'node properties missing or malformed.'
 | HTTP 400 'query malformed.'

Notes:
 # For callers other than Treehouse, a gene list needs to be maintained on the tumormap server in order to respond about unknown genes.




