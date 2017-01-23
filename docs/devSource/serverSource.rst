Source: Server
--------------
The server code is in two main directories: calc and www/server. The calc
directory contains code to preprocess the data before being viewed in the tumor
map. This code is never accessed by the client.

The www/server directory has code that is initiated by the client to run on the
server and includes node scripts.

Client-initiated
^^^^^^^^^^^^^^^^
hexagram/server contains the files that are initiated by the client via Meteor
rather than directly issuing http requests. These are some of the important files:

**createMap.js** : create a map via the UI

**dbMethods.js** : miscellaneous database access

**diffAnalysis.py** : perform dynamic differential analysis with input from the client.
Currently unused

**files.js** : the Meteor methods for accessing flat files on the server.

**http.js** : Receive and respond to incoming HTTP requests according to
the query API.

**layout.py** : generates the final input files for the tumor map

**mapManager.js** : manage translations from one map to another, like reflection

**overlayNodes.js** : handles Nof1 analysis fromt the UI

**project.js** : handles project list retrieval based on user role

**pythonCall.js, pythonCall.py** : helper functions to read and write json-formatted files
from python and call a python function from the UI

**reflection.py** : handles reflections

**secure.js** : handles checking user roles for authorization

**statsDynamic.py** : transforms a dynamic stat layer into a normal layer for computations

**statsLayer.py** calls the stats libraries for one layer. The client uses this
for dynamic stats and the server uses this for pre-computed stats. This is the
only file used by the server and client.

Other scripts are used by the above primary scripts.


Server only
^^^^^^^^^^^
hexagram/calc contains files that are only used by the server and not
initiated by the client.
