
Map Manager
===========

The map manager handles the communications for synchronizing a user
selection of node IDs from one map to another map. The map manager queries the
target map database using the source map's node IDs. The translator then does
some magic to produce values for a list of target node IDs. These IDs and values
are sent to the target map as a generated attribute.

The below shows the workflow for reflecting a group of samples from a sample
map onto a gene map.

.. image:: mapManager.png
   :width: 800 px

(source: https://docs.google.com/presentation/d/1gUGZ2PJlEKybW9ZVv7y96lUxOjlKoA3H8kClXNbnVcc/edit#slide=id.g12bf66a90e_0_0)

**An example sequence of calls follows.**

#1 syncMapRequest
-----------------
A request to sync from a source map to a target map, sent to the map manager
from the source map via http::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "fromMapType": "tumorMap",
    "toMapType": "geneMap",
    "selection": "Kidney",
    "nodes': [
        "mySample1",
        "mySample2",
        ...
    ]
 }

#2 syncMapQuery
---------------
A query of the database from the map manager to the DB::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "fromMapType": "tumorMap",
    "toMapType": "geneMap",
    "nodes': [
        "mySample1",
        "mySample2",
        ...
    ]
 }

#3 syncMapQueryReply
--------------------
The query response from the database to the map manager, where the values are
one for each source node ID. (Is that right, or does the translator need all of
the source node values?)::

 {
    "gene1": [
        "value",
        "value",
        ...
    ],
    "gene2" [
        "value",
        "value",
        ...
    ],
    ...
 }

* Note: This returns all values, including NA values.

#4 syncMapTranslate
-------------------
The data going from the map manager to the translator will contain the to and
from map types along with the node information from the above API,
syncMapQueryReply::

 {
    "fromMapType": "tumorMap",
    "toMapType": "geneMap",
    "nodes": {
        "gene1": [
            "value",
            "value",
            ...
        ],
        "gene2" [
            "value",
            "value",
            ...
        ],
        ...
    }
 }

#5 syncMapTranslateReply
------------------------
The data returned from the translator to the map manager will be a dictionary
of node names and values::

 {
    "gene1": "value",
    "gene2": "value",
    ...
 }

#6 syncMapPush
--------------
The request sent to the target map from the map manager. This will be displayed
on the UI as a generated attribute::

 {
    "layer": "Kidney",
    "nodes": {
        "gene1": "value",
        "gene2": "value",
        ...
    }
 }
