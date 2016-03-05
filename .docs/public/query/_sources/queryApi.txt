Query API
=========

Revision: February 21, 2016

All Queries
-----------
 | API query URLs begin with "https://tumormap.ucsc.edu/" for production, followed by the specific query ID. For develoment, use "http://hexmap.sdsc.edu:8111/".
 | API query parameters are sent in the HTTP POST message body in JSON format.
 | API responses are returned in JSON format.


Query API: overlayNodes
-----------------------

Overlay new nodes on a frozen map.

**Query format**

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

Format::

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
        (1 to N layouts)
        ...
    },
 }

**Response success**

These are returned as HTTP 200.

Example::

 {
    "bookmark": "https://tumormap.ucsc.edu/?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE",
 }

Format::

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

Notes:
 # For callers other than Treehouse, a gene list needs to be maintained on the
 tumormap server in order to respond about unknown genes.




