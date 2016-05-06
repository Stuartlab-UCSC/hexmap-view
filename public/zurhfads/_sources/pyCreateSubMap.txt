
Python API: syncMaps
====================

This python API is used in communications between the map manager and the
magician. You can read about the full pipeline at the
:doc:`mapManager`
.

See :doc:`pythonApi` for general information about python APIs as well as an
example call and response.

The data within the temporary files are explained here.

Examples


syncMapDataIn
-------------
The data going from the map manager to the magician::

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

syncMapDataOut
--------------
The data returned from the magician to the map manager::

 {
    "gene1": "value",
    "gene2": "value",
    ...
 }

Response
--------

TBD

Response errors TBD

Implementation notes
--------------------

Write the values to the tsv files with seven significant digits.

