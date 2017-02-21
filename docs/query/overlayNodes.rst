Future: Overlay new nodes on a map
==================================

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
    "individualViewUrls": True,
    "neighborCount": 8,
    "nodes": {
        MySample1": {
            "ALK": "0.897645",
            "TP53": "0.904140",
            "POGZ": "0.792754",
            ...
        },
        "MySample2": {
            "ALK": "0.897645",
            "TP53": "0.904140",
            "POGZ": "0.792754",
            ...
        },
        "MySample3": {
            "ALK": "0.897645",
            "TP53": "0.904140",
            "POGZ": "0.792754",
            ...
        },
        ...
    }
 }
    
Where:

* **email** : optional; one or more email addresses to receive the response
* **viewServer** : optional; defaults to https://tumormap.ucsc.edu; the URL to view the results
* **individualViewUrls** : optional; defaults to False; True means a view URL for each node will be returned; False means all node positions will be returned in one view URL
* **neighborCount** : optional; defaults to 6; number of nearest neighbors to consider in placing each node

The nodes in this expanded json form would go over the wire with:

stringCount = featureCount * nodeCount * 2

Alternatively, a list of tsv lines would be more compact, which would make a
difference in wire time for large node counts:

stringCount = featureCount * (nodeCount + 1)::

    "nodes": [
        "feature\tMySample1\tMySample2\tMySample3",
        "ALK\t0.897645\t0.897645\t0.897645",
        "TP53\t0.904140\t0.904140\t0.904140",
        "POGZ\t0.792754\t0.792754\t0.792754",
        ...
    ]

Caller considerations:

* Is this more error-prone being less readable, or are callers simply going load a tsv file into a list?

Implementation considerations:

* when a python 2d array is desired, use hubUtil.tsvListToPythonArray()
* a similar method may be needed for tsv-list-to-numpy-2d-array, or to pandas if they don't already exist

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string in the form::

 {
    "url": "https://tumormap.ucsc.edu/?bookmark=5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
    "neighbors": {
        "MySample1": {
            "node1": 0.352,
            "node2": 0.742,
            ...
        },
        "MySample2": {
            "node1": 0.275,
            "node2": 0.965,
            ...
        },
        ...
     }
 }

Where:

* **url**: view the new nodes overlaying the map with:
    * the requested nodes in red with a pin/marker
    * a newly-generated attribute of '<requested-node>: neighbors' for each requested node
* **neighbors** : contains the scores of the most similar neighbors.

Alternatively, to support multiple nodes with a view URL for each node, we could
return the data in this form::

 {
    "nodes": {
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


Response error
--------------

Response errors are returned as HTTP 400 with the text below. Message text may
not be exact.

* Error: malformed JSON
* Error: map not found: pancan44
* Error: layout of map "pancan12" not found: sRNA
* Error: name has unprintable characters (not ASCII 32-126), unprintable chars replaced with ‘_’ in <name>
* Error: parameter missing or malformed: <parameter>

