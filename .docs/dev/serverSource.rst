Source: Server
--------------
The server code is in two main directories: .server and server. The .server
directory contains code to preprocess the data before being viewed in the tumor
map. This code is never accessed by the client.

The server directory has code that is initiated by the client but run on the
server and includes node scripts.

Server only
^^^^^^^^^^^
hexagram/.server contains files that are only used by the server and not
initiated by the client.

**clr.py** :

**compute_sparse_matrix.py** :

**convert_annotation_to_tumormap_mapping.py** :

**create_colormaps.py** :

**layout.py** : generates the final input files for the tumor map

**start/start** : scripts for starting the servers

**tsvToJson_overlayNodes.py** : transform a specifically-formatted tsv file into a json file





Utilities called by layout.py
-----------------------------

**statsLayer.py** calls the stats libraries for one layer. The client uses this
for dynamic stats and the server uses this for pre-computed stats. This is the
only file used by the server and client.

**statsLayout.py** : precomputed layout-aware stats

**statsNoLayout.py** : precomputed layout-independent stats

**topNeighbors.py**: Find the top N neighbors of each node.

**pool.py** : manages parallel tasks.

**tsv.py** : TSV read and write utility


Client-initiated
^^^^^^^^^^^^^^^^
hexagram/server contains the files that are initiated by the client via Meteor
rather than directly issuing http requests.

**dbMethods.js** : handle queries to the data base.

**diffAnalysis.py** : perform dynamic differential analysis with input from the client.
Currently unused

**files.js** : the Meteor methods for accessing flat files on the server.

**httpQuery.js** : Receive and respond to incoming HTTP requests according to
the query API.

**project.js** : handles project list retrieval based on user role

**pythonApiHelpers.py** : helper functions to read and write json-formatted files
from python. There is also an example of calling these helper functions.

**secure.js** : handles checking user roles for authorization

**statsDynamic.py** : transforms a dynamic stat layer into a normal layer for computations

**statsLayer.py** calls the stats libraries for one layer. The client uses this
for dynamic stats and the server uses this for pre-computed stats. This is the
only file used by the server and client.
