Server Sources
--------------
The dynamic and precomputed statistics use the same python code at the layer
level, statsLayer.py.

Shared
^^^^^^
This is shared between the server-only pipeline and the client-initiated pipeline.

**statsLayer.py** calls the stats libraries for one layer. The client uses this
for dynamic stats and the server uses this for pre-computed stats

Server only
^^^^^^^^^^^
This list includes all of the files currently checked into the repository in
hexagram/server.

**hexagram.py** : original code-base and the top executable in generating the
final input files for the tumor map

**stats.Layout.py** : precomputed layout-aware stats

**statsNoLayout.py** : precomputed layout-independent stats

**pool.py** : general utility to manage parallel processing

**diffAnalysis.py** : perform dynamic differential analysis with input from the client.
Currently unused, but probably will be used soon

Client-initiated
^^^^^^^^^^^^^^^^
The dynamic statistics are initiated by the client via Meteor
rather than directly issuing http requests.

statsDynamic
............

**meteorMethods.js** : node file that handles calls and responses between the client
and server

**statsDynamic.py** : the top executable when computing dynamic stats as called from
the client

placeNewNodes
.............



