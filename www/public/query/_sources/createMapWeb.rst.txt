Future: Web: Create a map
=========================

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
    "clusterData": {
        "name": "mRNA",
        "features": {
            "Node1": {
                "ALK": "0.897645",
                "TP53": "0.904140",
                ...
            },
            "Node2": {
                "ALK": "0.897645",
                "TP53": "0.904140",
                ...
            },
            ...
        },
        ...
    },
 }

Where:

* **map** : a unique ID in the form: <group>/<map> or simply: <map>
* **authGroup** : optional, defaults to viewable by the user who creates the map, the authorization group to which a user must belong to view this map
* **email** : optional, one or more email addresses to receive the response
* **layoutInputFormat** : the format of the layout file, one of [clusterData, fullSimilarity, sparseSimilarity, xyPositions] see Note 1
* **neighborCount** : optional, defaults to 6, the number of neighbors of each node to consider in laying out the map
* **firstColorAttribute** : optional, the attribute to be used to color the map on initial display
* **layoutAwareStats** : optional, true indicates this class of stats should be calculated, defaults to false. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.
* **layoutIndependentStats** : optional, true indicates this class of stats should be calculated, defaults to false. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.
* **reflectionMapType** : optional, generate another map with 90-degree rotated clustering data so that clustering features are used as the nodes in the layout. Color attributes are provided and determined by the map type. One of: [geneMap]
* **colormap** : optional, defaults to a colormap generated during computations, a colormap already defined for the color attributes which maps each category value to a color. New attributes and categories will be added to this map.
* **colorAttributes** : optional, the values to use for coloring the nodes. Note 1
* **layoutFeatures** : one or more required, the features used to layout the map

 * **name** : string used to name this layout
 * **features** : the values to use for this layout. Note 1

Note 1: For format descriptions see https://tumormap.ucsc.edu/help/createMap.html

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

Response errors are returned as HTTP 400 with an explanation.

There may be more errors returned than listed here.

* Error: malformed JSON
* Error: name has unprintable characters (not ASCII 32-126), unprintable chars replaced with ‘_’ in <name>
* Error: parameter missing or malformed: <parameter>
