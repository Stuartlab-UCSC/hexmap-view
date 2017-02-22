Calc API: N-of-1 Analysis
=========================

This performs the computations for the public web API to overlay new nodes on an
existing map described at https://tumormap.ucsc.edu/query/overlayNodes.html.

Example call
------------
The caller provides a single parameter when calling the calc script::

 Nof1.whateverRoutine(options)

This parameter contains the options as a Namespace object,
the same object returned by argparse.parse_args()::

 options = Namespace(
    neighborCount=8,
    fullFeatureMatrix='/hexData/featureSpace/CKCC/v3/expression.2016.12.21.tab',
    xyPositions='/hexData/view/CKCC/v3/xyPreSquiggle_0.tab',
    newNodes={
        mySample1: {
            ALK: 0.897645,
            TP53: 0.904140,
            POGZ: 0.792754,
            ...
        },
        mySample2: {
            ALK: 0.655793,
            TP53: 0.279733,
            POGZ: 0.729547,
            ...
        },
        ...
    }
 )

Where:

* **neighborCount** : optional, number of nearest neighbors to consider in the placement for each node, defaults to 6
* **fullFeatureMatrix** : full file path containing the full feature matrix against which each node will be analyzed independently
* **xyPositions** : full file path containing the xy positions of the existing nodes in the frozen map

Return success
--------------

Upon success the return data will be a python data structure in the form::

 {
    nodes: {
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
 }

Where:

* **neighbors** : contains the similarity scores of the most similar neighbors.

Return error
------------

Upon error the return will be a python data structure in the form::

 {
    "error": "Some error message or stack trace"
 }
