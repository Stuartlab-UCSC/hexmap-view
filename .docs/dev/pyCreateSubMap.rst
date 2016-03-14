
Python API: createSubMap
========================

Make a new map based on data sent.

See :doc:`pythonApi` for general information about python APIs as well as an
example call and response.

The data within the temporary files are explained here.

Request
-------

Example::

 {
    "map": "pancan33+",
    "layouts": [
        "mRNA",
    ],
    "nodeGroups": {
        "kidney tissue group": [
            "mySample1",
            "mySample2",
            ...
        ],
        "ovarian tissue group": [
            "mySample3",
            "mySample4",
            ...
        ],
    }
    "title": "PanCan33+ Gene Expression",
    "directory": "/data/pancan12",
    ...
 }

Definitions

 | *layout* : type of values by which the new node will be placed on the map. e.g., "mRNA"
 | *directory* : absolute path of the directory to write the rendering input for the new map
 | *map* : frozen map ID. e.g., "pancan33+"
 | *nodeGroup* : a group of nodes. e.g., "kidney tissue"
 | *node* : ID of the node to be placed on the map. e.g., TCGA sample ID
 | *title* : sub-map title assigned by user and displayed on the UI

Generalized format::

 {
    "map": <map ID>,
    "layouts": [
        <layout1>,
        <layout2>,
        <one to N layouts>,
        ...
    ],
    "nodeGroups": {
        <nodeGroup>: [
            <node>,
            <node>,
            (1 to N nodes)
            ...
        ],
        (1 to N nodeGroups)
        ...
    }
    "title": <title>,
    "directory": <directoryPath>,
 }

Response
--------

Response success data should be empty.

Response errors are at :doc:`pythonApi`

Processing notes
----------------

Write the values to the tsv files with seven significant digits.

