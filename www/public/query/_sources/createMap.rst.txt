Future: Create a map
====================

https://<compute_server>/query/**createMap**

POST with content-type: application/json

data-type: json

This API builds a new map from data you supply.

Content Example
---------------
::

 {
    "map": "CKCC/v3",
    "authGroup": "CKCC",
    "email": [
        "mok66@gmail.com",
        ...
    ],
    "layoutInputFormat": "clusterData",
    "neighborCount": 8,
    "firstColorAttribute": "Disease",
    "layoutAwareStats": false,
    "layoutIndependentStats": false,
    "reflectionMapType": "geneMap",
    "colormap": {
        "Disease": {
            "BRCA": "#0000FF",
            "LUAD": "#00FF00"
        },
        "Tumor Stage": {
            "Stage I": "#0000FF",
            "Stage II": "#00FF00"
        },
        ...
    },
    "colorAttributes": [
        "Node1": {
            "Disease": "BRCA",
            "Tumor Stage": "Stage I",
            ...
        },
        "Node2": {
            "Disease": "LUAD",
            "Tumor Stage": "Stage II",
            ...
        },
        ...
    ],
    "layoutInput": {
        "name": "mRNA",
        "data": {
            "Node1": {
                "ALK": 0.897645,
                "TP53": 0.904140,
                ...
            },
            "Node2": {
                "ALK": 0.897645,
                "TP53": 0.904140,
                ...
            },
            ...
        },
        ...
    }
 }

Where:

* **map** : a unique identifier. If you want the map to belong to a map group, that is included before the specific map separated by a slash as in the example.
* **authGroup** : optional, defaults to viewable by the user who creates the map. The authorization group to which a user must belong to view this map.
* **email** : optional, one or more email addresses to receive the response
* **layoutInputFormat** : one of [clusterData, fullSimilarity, sparseSimilarity, xyPositions]. The format of the layout input, See the section, "Layout input formats" below.
* **neighborCount** : optional, defaults to 6. The number of neighbors of each node to consider in laying out the map.
* **firstColorAttribute** : optional, defaults to the attribute with the highest density; the attribute to be used to color the map on initial display
* **layoutAwareStats** : optional, defaults to false. true indicates the statistics which consider the placement of nodes should be calculated. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.
* **layoutIndependentStats** : optional, defaults to false. true indicates the statistics that are independent of the placement of nodes should be calculated. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.
* **reflectionMapType** : optional, with a value of "geneMap". Generate another map with 90-degree rotated clustering data so that clustering features are used as the nodes in the layout. Color attributes are provided and determined by the map type. "genemap" will produce a map with the genes as nodes in the layout with a set of pre-defined signatures as color attributes.
* **colormap** : optional, defaults to a colormap generated during computations. A colormap already defined for the color attributes which maps each category value to a color. New attributes and categories will be added to this colormap.
* **colorAttributes** : optional, contains properties of nodes given in the layout input used to color the map. Your attribute names and values are ojects within each node.
* **layoutInput** : contains your layout name and data to use in laying out the map.

 * **name** : string used to name this layout. This is included for each layoutInputFormat.
 * **data**: the data to be used to determine the layout. The format is specific to each layoutInputFormat as described below.

Layout input formats
^^^^^^^^^^^^^^^^^^^^

**clusterData**:
The most basic of the layout input formats where similarities among nodes
and xy positions will be calculated for you. The main example above shows an
example of this format which contains your node names and values.

**fullSimilarity**
This format contains similarity scores between all node pairs which will be used to
calculate xy positions. An example which contains your node names and values::

 "data": {
    "Node1": {
        "Node1": 0.897645,
        "Node2": 0.904140",
        ...
    },
    "Node2": {
        "Node1": 0.897645,
        "Node2": 0.904140,
        ...
    },
    ...
 },

**sparseSimilarity**
This format contains similarity scores between each node and its **neighborCount**
closest neighbor nodes which will be used to calculate xy positions. This format
is identical to that of **fullSimilarity**. Rather than containing a similarity
score for every node pair, only the nodes with the top scores
for each node are included.

**xyPositions**
This format is the most processed of the layout input formats,
containing the x and y coordinates in two-dimensional space of each node. An
example which contains [x,y] positions for each of your node names::

 "data": {
    "Node1": {
        [4.897, 8.226],
        [55.693, 95.5],
        ...
    },
    "Node2": {
        [4.897, 8.226],
        [55.693, 95.5],
        ...
    },
    ...
 },

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string containing::

 {"status": "Request received."}

If the web API was called via the viewer, when the map build is complete,
this will be returned as a JSON string and the user will be given the
opportunity to load the map::

 { "bookmark": "https://tumormap.ucsc.edu/?p=CKCC/V3" }

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string.
