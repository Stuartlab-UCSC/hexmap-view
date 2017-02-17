Overlay new nodes on a map
==========================

https://<hub>/query/**overlayNodes**

POST with content-type: application/json

data-type: json

This API takes data for one or more of your nodes and performs an N-of-1 analysis
on each of your nodes against the background nodes of an existing map.

Content Example
---------------
::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "email": [
        "mok66@gmail.com",
        ...
    ],
    "viewServer": 'https://tumormap.ucsc.edu',
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
* **viewServer** : optional, the URL of the server where a bookmark will be created to view the results, defaults to the primary view server of https://tumormap.ucsc.edu
* **neighborCount** : optional, number of nearest neighbors to consider in the placement for each node, defaults to 6

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string in the form::

 {
    "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
    "neighbors": {
        "mySample1": {
            "node1": 0.352,
            "node2": 0.742,
            ...
        },
        "mySample2": {
            "node1": 0.275,
            "node2": 0.965,
            ...
        },
        ...
     }
 }

Where:

* **url**: view the new nodes overlaying the map with:
    * the requested nodes in red with google markers
    * a newly-generated attribute of '<requested-node>: neighbors' for each requested node
* **neighbors** : contains the scores of the most similar neighbors.

If multiple nodes are requested, they all appear with a single URL with a new
attribute for each requested node.
If one URL per node is desired, make a request for each node.

Response error
--------------

Response errors are returned as HTTP 400 with the text below. Message text may
not be exact.

* Error: malformed JSON
* Error: map not found: pancan44
* Error: layout of map "pancan12" not found: sRNA
* Error: name has unprintable characters (not ASCII 32-126), unprintable chars replaced with ‘_’ in <name>
* Error: parameter missing or malformed: <parameter>

