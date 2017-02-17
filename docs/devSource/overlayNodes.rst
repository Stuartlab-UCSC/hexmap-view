API: N-of-1 Analysis
====================

This performs the computations to overlay new nodes on an existing map described
at https://tumormap.ucsc.edu/query/overlayNodes.html.

Example call
------------
::

 webApi( \
    neighborCount=8, \
    fullFeatureMatrixFile='/hexData/featureSpace/CKCC/v3/expression.2016.12.21.tab', \
    xyPositionsFile='/hexData/view/CKCC/v3/.tab', \
    nodes={ \
        mySample1: { \
            ALK: 0.897645, \
            TP53: 0.904140, \
            POGZ: 0.792754, \
            ... \
        }, \
        mySample2: { \
            ALK: 0.655793, \
            TP53: 0.279733, \
            POGZ: 0.729547, \
            ... \
        }, \
        ... \
    } \
 )

Where:

* **neighborCount** : optional, number of nearest neighbors to consider in the placement for each node, defaults to 6
* **fullFeatureMatrixFile** : full file path containing the full feature matrix against which each node will be analyzed independently
* **xyPositionsFile** : full file path containing the positions of the existing nodes in the frozen map

Return success
--------------

Upon success the return data will be a python data structure in the form::

 {
    mySample1: {
        x: 42,
        y: 36
        neighbors: {
            node1: 0.352,
            node2: 0.742,
            ...
        },
    },
    mySample2: {
        x: 42,
        y: 36
        neighbors: {
            node1: 0.275,
            node2: 0.965,
            ...
        },
    },
    ...
 }

Where:

* **neighbors** : contains the scores of the most similar neighbors.

Return error
------------

A value of one is returned when there is an error with stderr captured by the
caller of webAPI() to report to the original web API caller.




