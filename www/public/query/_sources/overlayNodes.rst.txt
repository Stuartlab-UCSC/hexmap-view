Overlay new nodes on a map
--------------------------

http://tumormap.ucsc.edu/query/**overlayNodes**

Content-Type: application/json

**Content Example**::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "mok66@gmail.com",
        ...
    ],
    "neighborCount": 8,
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

Where:

* **email** : optional, one or more email addresses to receive the response
* **neighborCount** : optional, number of nearest neighbors to consider in the placement for each node, defaults to 6

The return data will be in the form::

 {
    "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
    "neighbors": {
        "node1": 0.352,
        "node2": 0.742,
        "node3": 0.523,
        ...
    }
 }

Where:

* **url**: view the new nodes overlaying the map with:
    * the requested nodes in red with google markers
    * a newly-generated attribute of '*<requested-node>: neighbors*' for each requested node
* **neighbors** : contains the scores of the most similar neighbors.

If multiple nodes are requested, they all appear with a single URL with a new
attribute for each requested node.
If one URL per node is desired, make a request for each node.

**Response success**

This is returned as HTTP 200 with the content as a JSON string in the form above.

**Response errors**

Response errors are returned as HTTP 400 with the text below.

* malformed JSON
* map not found: pancan44
* layout of map "pancan12" not found: sRNA
* parameter missing or malformed: <parameter>

