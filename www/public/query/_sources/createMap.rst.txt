Future: Create a map
====================

https://<calc_server>/query/**createMap**

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
    "outDirectory": "/myMapViewData/view/CKCC/v3",
    "neighborCount": 8,
    "firstColorAttribute": "Disease",
    "layoutAwareStats": true,
    "layoutIndependentStats": true
    "colormap": [
        ["# Attribute", "Index", "label", "Color", "Index", "label", "Color ..."],
        ["Disease", "0", "BRCA", "#0000FF", "1", "LUAD", "#00FF00"],
        ["Tumor Stage", "0", "Stage I", "#0000FF", "1", "Stage II", "#00FF00"],
        ...
        (TBD is this format easiest for calc code?)
    ],
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
    "layoutFeatures": {
        "name": "mRNA",
        "format": "featureMatrix",

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
* **authGroup** : optional, defaults to viewable by the public, the authorization group to which a user must belong to view this map
* **email** : optional, one or more email addresses to receive the response
* **outDirectory** : full directory path for the output files
* **neighborCount** : optional, defaults to 6, the number of neighbors of each node to consider in laying out the map
* **firstColorAttribute** : optional, defaults to the attribute with the highest density, attribute to be used to color the map on initial display
* **layout*Stats** : optional, true indicates this class of stats should be calculated, defaults to false. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.
* **colormap** : optional, defaults to a colormap generated during computations, a colormap already defined for the color attributes which maps each category value to a color
* **colorAttributes** : optional, the values to use for coloring the nodes. Note 1
* **layoutFeatures** : one or more required, the features used to layout the map

 * **name** : string used to name this layout
 * **format** : a format identifier. Note 1
 * **features** : the values to use for this layout. Note 1

Note 1: For acceptable formats see https://tumormap.ucsc.edu/help/createMap.html

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string containing a URL
pointing to the new map in the form::

 { "bookmark": "https://tumormap.ucsc.edu/?p=CKCC/V3" }

Response error
--------------

Response errors are returned as HTTP 400 with an explanation.

There may be more errors returned than listed here.

* Error: malformed JSON
* Error: name has unprintable characters (not ASCII 32-126), unprintable chars replaced with ‘_’ in <name>
* Error: parameter missing or malformed: <parameter>
