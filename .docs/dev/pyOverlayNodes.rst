
Python API: overlayNodes
========================

Overlay new nodes on a frozen map.

See :doc:`pythonApi` for general information about python APIs as well as an
example call and response.

The data within the temporary files are explained here.

Request
-------

Example::

 {
    "map": "pancan33+",
    "layouts": {
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
    },
 }

Definitions

 | *layout* : type of values by which the new node will be placed on the map. e.g., "mRNA"
 | *map* : frozen map ID. e.g., "pancan33+"
 | *node* : ID of the node to be placed on the map. e.g., TCGA sample ID
 | *node property* : identifier for a node's property, e.g., "TP53"

Generalized format::

 {
    "map": <map ID>,
    "layouts": {
        <layout>: {
            <node>: {
                <node-property>: <node-property value>,
                (1 to N properties)
                ...
            },
            (1 to N nodes)
            ...
        },
        ...
        (1 to N layouts)
    },
 }

Response
--------

**Success**

Example::

 {
    "map": <map ID>,
    "layouts": {
        "mRNA": {
            "mySample1": {
                "x": "42",
                "y": "23",
            },
        },
    },
 }

Format::

 {
    "map": <map ID>,
    "layouts": {
        <layout>: {
            <node>: {
                    "x": <x-value>,
                    "y": <y-value>,
                },
            (1 to N nodes)
            ...
        },
        (1 to N layouts)
        ...
    }
 }

**Errors**

Response errors are at :doc:`pythonApi`
