Place new nodes on a map
------------------------

**Request**

Example::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "mok66@gmail.com",
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

 | *email* : optional parameter, one or more email addresses to receive the bookmark
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

**Response success**

These are returned as HTTP 200.

Example::

 {
    "bookmark": "https://tumormap.ucsc.edu/?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE",
 }

Generalized format::

 {
    "bookmark": <bookmark>
 }

**Response errors**

These are returned as HTTP 400.

There may be more or less than listed here.

 | map "pancan44" not found
 | layout "sRNA" of map "pancan12" not found
 | map missing or malformed
 | layout missing or malformed
 | layoutData missing or malformed
 | nodes missing or malformed
 | node properties missing or malformed
 | query malformed
