Future: Place new nodes
=======================

https://<compute_server>/query/**overlayNodes**

POST with content-type: application/json

data-type: json

This API takes data for one or more of your nodes and places them over the
background nodes of an existing map.

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
    "individualViewUrls": true,
    "neighborCount": 8,
    "nodes": [
        {
            "id": "MySample1",
            "features": [
                "ALK",
                "TP53",
                ...
            ],
            "values": [
                0.897645,
                0.904140,
                ...
            ]
        },
        {
            "id": "MySample2",
            "features": [
                "ALK",
                "TP53",
                ...
            ],
            "values": [
                0.897645,
                0.904140,
                ...
            ]
        },
        ...
    ],
    "nodes": { // deprecated in favor of the above "nodes" form.
        "MySample1": {
            "ALK": 0.897645,
            "TP53": 0.904140,
            ...
        },
        "MySample2": {
            "ALK": 0.897645,
            "TP53": 0.904140,
            ...
        },
        ...
    }
 }
    
Where:

* **map** : a unique identifier. If the map belongs to a map group, that is
  included before the specific map separated by a slash as in the example.
* **layout** : name of a particular layout of nodes within a map
* **email** : optional; one or more email addresses to receive the response
* **viewServer** : optional; defaults to https://tumormap.ucsc.edu; the URL to
  view the results
* **individualViewUrls** : optional; defaults to False; True means a view URL
  for each node will be returned; False means all node positions will be
  returned in one view URL
* **neighborCount** : optional; defaults to 6; number of nearest neighbors to
  consider in placing each node
* **nodes** : contains an array of node objects with the node ID, feature names
  and values as properties of each node; the second form of nodes shown in the
  example is deprecated because it uses data as keys.

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string in the form::

 {
    "placedNodes": [
        {
            "id": "MySample1",
            "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
            "neighborIDs": [
                "node1",
                "node2",
                ...
            ],
            "neighborScores": [
                0.352,
                0.742,
                ...
            ]
        },
        {
            "id": "MySample2",
            "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
            "neighborIDs": [
                "node3",
                "node4",
                ...
            ],
            "neighborScores": [
                0.275,
                0.965,
                ...
            ]
        },
        ...
    ],
    "nodes": { // deprecated in favor of the above "placedNodes" form.
        "MySample1": {
            "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
            "neighbors": {
                    "node1": 0.352,
                    "node2": 0.742,
                    ...
                }
            }
        },
        "MySample2": {
            "url": "https://tumormap.ucsc.edu/?bookmark=6734q4968942764875074tnu08934iobdm5edfgb44d7502d384cc2a87001067a",
            "neighbors": {
                "node1": 0.275,
                "node2": 0.965,
                ...
            }
        },
        ...
    }
 }

Where:

* **placedNodes** : contains the scores of the most similar neighbor nodes for
  each placed node.
* **nodes** : this property as shown in the example is deprecated because it
  uses data as keys. It will be included in the response until all callers have
  moved to the new form.
* **url**: view the new nodes overlaying the map with this for each node:
    * a marker pointing out the node
    * a new attribute of '<requested-node>: neighbors' that shows the nearest neighbors in yellow
    * a new attribute of '<requested-node>: neighbor values' that shows the similarity score for each neighbor
* **neighbors** : contains the scores of the most similar neighbors.


Note that if the optional input parameter of 'individualViewUrls' is true, only
one node will be at each URL. Otherwise the URLs returned for each node will be
identical and contain all nodes.

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string.
