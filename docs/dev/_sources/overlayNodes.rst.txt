Calc API: N-of-1 Analysis
=========================

This performs the computations for the public web API to overlay new nodes on an
existing map described at https://tumormap.ucsc.edu/query/overlayNodes.html.

Example call
------------
::

 compute_sparse_matrix.webApi( \
    top=8, \
    in_file1='/hexData/featureSpace/CKCC/v3/expression.2016.12.21.tab', \
    in_eucledian_positions='/hexData/view/CKCC/v3/xyPreSquiggle_0.tab', \
    newNodes={ \
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

* **top** : optional, number of nearest neighbors to consider in the placement for each node, defaults to 6
* **in_file1** : full file path containing the full feature matrix against which each node will be analyzed independently
* **in_eucledian_positions** : full file path containing the xy positions of the existing nodes in the frozen map

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




