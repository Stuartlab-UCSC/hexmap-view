Place new nodes
===============

https://hexcalc.ucsc.edu/query/**placeNode**

HTTP POST with content-type: application/json

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
  and values as properties of each node

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string containing
something like::

 {
    "jobId": "123",
    "jobStatusUrl": "https://hexCalc.sdsc.edu/jobStatus/jobId/123",
    "status": "InJobQueue"
 }

Where:

* **jobId** : a unique job identifer
* **jobStatusUrl** : a URL that may be used to check the status of the calculation
  and get the result
* **status** : usually "InJobQueue"


Response error
--------------

Response errors have some HTTP code other than 200, with JSON content that may
contain a stack trace, such as::

 {
    "error": "Some message."
    "stackTrace" "an optional stack trace"
 }

Getting the results
-------------------

The results of the calculation may be retrieved with the URL supplied in the
successful response. Statuses that may be returned are described at
:doc:`jobStatus`

When the job has completed successfully, the response to the get status request
will be "Success" and the result object will contain something like::

 {
    "status": "Success",
    "result": {
        "nodes": [
            {
                "id": "MySample1",
                "url": "https://tumormap.ucsc.edu/?bookmark=55631067a",
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
                "url": "https://tumormap.ucsc.edu/?bookmark=55631067a",
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
        ]
    }
 }

Where:

* **status** : "Success"
* **nodes** : an array of results for each of your nodes
* **id** : your node ID
* **neighborIDs** : a list of the most similar neighbors to your node
* **neighborScores** : a list of scores corresponding to the neighborIDs list
* **url**: view the new nodes overlaying the map with this for each node:
    * a marker pointing out the node
    * a new coloring attribute that shows the nearest neighbors in yellow
    * a new coloring attribute that shows the similarity score for each neighbor

Note that if the optional input parameter of 'individualViewUrls' is true, only
one node will be at each URL. Otherwise the URLs returned for each node will be
identical and contain all nodes.


