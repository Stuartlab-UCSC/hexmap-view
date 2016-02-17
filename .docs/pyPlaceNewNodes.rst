
Python API: placeNewNodes
-------------------------

Place new nodes on a frozen map.

Example request::

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

Request Format::

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

Response success example::

 {
    "id": "mySample1"
    "x": "42",
    "y": "23",
 }

Response success format::

 {
    "node": <node>
    "x": <x-coordinate>,
    "y": <y-coordinate>
 }

Response errors

 | TBD




