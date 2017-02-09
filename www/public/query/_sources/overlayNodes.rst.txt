Place new nodes on a map
------------------------

**Request**

Query ID for the request URL: **overlayNodes**

Example::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "mok66@gmail.com",
        ...
    ],
    "numberOfNeighbors": 6,
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

A curl example using the development server::

 curl -s -k -d '{"map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1":
 "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0",
 "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2":  "2.5424", "PSMA2P3": "0", "CTD-2367A17.1":
 "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0",
 "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4":
 "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112",  "PSMA2P3": "0",
 "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}' -H \
 Content-Type:application/json -X POST -v https://tumormap.ucsc.edu:8112/query/overlayNodes

A URL would be returned as a json string of this form::

 '{"bookmark":"https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a"}'

Going to this URL would bring up a tumor map with:

 * the requested nodes in red with google markers
 * the six nearest neighbors of the first node requested highlighted in yellow as a newly-generated attribute of *<requested-node-id>: neighbors*. There will be one newly-generated attribute for each requested node.
 * all other nodes in grey

If multiple nodes are in the request, they and their neighbors will
all appear with a single URL with one new neighbor attribute per requested node.
If multiple nodes are to be placed with one URL per node, make one request
for each node.

To obtain a list of closest neighbors, select the new neighbors attribute then
go to the File menu -> Download -> Node IDs.

Definitions

 | *email* : optional parameter, one or more email addresses to receive the bookmark
 | *layout* : type of values by which the new node will be placed on the map. e.g., "mRNA"
 | *mapID* : frozen map ID. e.g., "CKCC/v1"
 | *nodes* : the nodes to be placed on the map
 | *node* : ID of the node to be placed on the map. e.g., TCGA sample ID
 | *node-property* : identifier for a node's property, e.g., "TP53"
 | *numberOfNeighbors* : optional parameter, the number of nearest neighbors to consider in the placement for each node, defaults to 6

Generalized Format of request::

 {
    "map": <mapID>,
    "layout": <layout>,
    "email": [
        <email>,
        (1 to N email addresses ...)
    ],
    "numberOfNeighbors": <number>,
    "nodes": {
        <node>: {
            <node-property>: <node-property value>,
            (1 to N properties ...)
        },
        (1 to N nodes ...)
    },
 }

**Response success**

This is returned as HTTP 200::

 '{"bookmark":"https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a"}'

Going to this URL would bring up a tumor map with:

 * the requested nodes in red with google markers
 * the six nearest neighbors of the first node requested highlighted in yellow as a newly-generated attribute of *<requested-node-id>: neighbors*. There will be one newly-generated attribute for each requested node.
 * all other nodes in grey

**Response errors**

These are returned as HTTP 400.

There may be more errors returned than listed here.

 | map "pancan44" not found
 | layout "sRNA" of map "pancan12" not found
 | map missing or malformed
 | layout missing or malformed
 | layoutData missing or malformed
 | nodes missing or malformed
 | node properties missing or malformed
 | query malformed
