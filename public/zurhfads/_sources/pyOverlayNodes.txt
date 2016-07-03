
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
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "IamInterested@any.com",
        "meToo@any.com",
        ...
    ],
    "nodes": {
        "mySample1": {
            "ALK": "0.897645",
            "TP53": "0.904140",
            "POGZ": "0.792754",
            ...
        },
        ...
    },
 }

This curl example using the development server should work::

 curl -s -k -d '{"map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1":
 "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0",
 "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2":  "2.5424", "PSMA2P3": "0", "CTD-2367A17.1":
 "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0",
 "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4":
 "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112",  "PSMA2P3": "0",
 "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}' -H \
 Content-Type:application/json -X POST -v https://tumormap.ucsc.edu:8112/query/overlayNodes

It should return a bookmark of the form::

 {"bookmarks":["https://tumormap.ucsc.edu:8112/?&p=CKCC.v1&node=Sample-1&x=277.5&y=171.5",
  "https://tumormap.ucsc.edu:8112/?&p=CKCC.v1&node=Sample-2&x=264&y=151"]}

Definitions

 | *neighborNode* : a neighbor node of the given node
 | *email* : email addresses where the bookmark will be sent
 | *layout* : type of values by which the new node will be placed on the map. e.g., "mRNA"
 | *mapID* : frozen map ID. e.g., "CKCC/v1"
 | *nodes* : the nodes to be placed on the map
 | *node* : ID of the node to be placed on the map. e.g., TCGA sample ID
 | *node-property* : identifier for a node's property, e.g., "TP53"

Generalized Format::

 {
    "map": <mapID>,
    "layout": <layout>,
    "email": [
        <email>,
        (1 to N email addresses ...)
    ],
    "nodes: {
        <node>: {
            <node-property>: <node-property value>,
            (1 to N properties ...)
        },
        (1 to N nodes ...)
    },
 }

Response
--------

**Success**

Example::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "IamInterested@any.com",
        "meToo@any.com",
        ...
    ],
    "nodes": {
        "mySample1": {
            "hash": "267831025yhs3fzxwi",
            "neighbors": [
                "TCGA-HT-7686-01",
                "TCGA-P5-A780-01", 
                "TCGA-28-5216-01", 
                "TCGA-DU-A7TD-01", 
                "TCGA-06-0187-01", 
                "TCGA-QR-A70E-01"
            ],
            "x": "42",
            "y": "23",
        },
    },
 }

Generalized Format::

 {
    "map": <map ID>,
    "layout": <layout>,
    "email": [
        <email>,
        (1 to N email addresses ...)
    ],
    "nodes": {
        <node>: {
            "hash": <hash-generated-over-data>,
            "neighbors": [
                <neighborNode>,
                <neighborNode>,
                <neighborNode>,
                <neighborNode>,
                <neighborNode>,
                (1 to N neighborNodes ...)
            ],
            "x": <x-value>,
            "y": <y-value>,
        },
        (1 to N nodes ...)
    },
 }

**Errors**

Response errors are at :doc:`pythonApi`
