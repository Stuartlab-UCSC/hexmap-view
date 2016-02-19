
Python API: createSubMap
------------------------

Make a new map based on data sent.

See :doc:`pythonApi` for general information about python APIs as well as an
example call and response.

The data within the temporary files are explained here.

Example request data::

 {
    "map": "pancan33+",
    "layouts": [
        "mRNA",
        ...
    ],
    "title": "PanCan33+ Gene Expression",
    "directory": "/data/pancan12",
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
    ...
 }

Definitions

**layout** : type of values by which the new node will be placed on the map. e.g., "mRNA"

**directory** : absolute path of the directory to write the rendering
input for the new map

**map** : frozen map ID. e.g., "pancan33+"

**nodeGroup** : a name
for a group of nodes. e.g., "kidney tissue"

**node** : ID of the node to be placed on the map. e.g., "mySample1"

**title** : sub-map title assigned by user

Request data Format::

 {
    "map": <map ID>,
    "layouts": [
        <layout1>,
        <layout2>,
        <one to N layouts>,
        ...
    ],
    "title": <title>,
    "directory": <directoryPath>,
    <nodeGroup>: [
        <node>,
        <node>,
        (1 to N nodes)
        ...
    ],
    <nodeGroup>: [
        <node>,
        (1 to N nodes)
        ...
    ],
    (1 to N nodeGroups)
    ...
 }

Processing notes:

Be sure to include the new title parameter when calling hexagram.py so it will
show up on the UI.

Write the values to the tsv files with 4 significant digits. This will save us
some disk space.

Response success data example and format::

 {
    "status", "success",
 }

Response error formats are at :doc:`pythonApi`
