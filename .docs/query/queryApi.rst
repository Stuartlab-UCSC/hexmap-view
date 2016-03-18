Query API
=========

All Queries
-----------
API query URLs begin with "http://tumormap.ucsc.edu/query/" followed by the
specific query ID. For testing in development, use
"http://hexmap.sdsc.edu:8111/query/" followed by the query ID.

API query parameters are sent in the HTTP POST message body in JSON format.

API responses are returned in JSON format.

Query API: overlayNodes
-----------------------

Overlay new nodes on a frozen map.

**Request**

Example::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
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

This curl example using the development server::

 curl -H Content-Type:application/json -X POST -d \
 '{"map": "CKCC/v1/stable", "layout": "mRNA", "nodes": {"node1": {"gene1": "1", "gene2": "2"}, "node2": {"gene1": "3", "gene2": "4"}}}' \
 hexmap.sdsc.edu:8111/query/overlayNodes

should return a bookmark of the form::

 {"bookmark": "http://hexmap.sdsc.edu:8111/?b=586633986"}

Definitions

 | *layout* : type of values by which the new node will be placed on the map. e.g., "mRNA"
 | *mapID* : frozen map ID. e.g., "CKCC/v1"
 | *nodes* : the nodes to be placed on the map
 | *node* : ID of the node to be placed on the map. e.g., TCGA sample ID
 | *node-property* : identifier for a node's property, e.g., "TP53"

Generalized Format::

 {
    "map": <mapID>,
    "layout": <layout>,
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
