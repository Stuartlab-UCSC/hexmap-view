Create a map
------------

https://<server>/query/**createMap**

Content-Type: application/json

**Content Example**::

 {
    "map": "CKCC/v1",
    "layout": "mRNA",
    "authGroup": "CKCC",
    "email": [
        "mok66@gmail.com",
        ...
    ],
    "layoutFileFormat": "featureMatrix",
    "layoutAttributeFiles": {
        "mRNA": "/a/b/c/mRNA_expression.tab",
        "CNV": "/a/b/c/CNV.tab",
        ...
    },
    "colorAttributeFiles": [
        "clinical.tab",
        "phenontype",
        ...
    ],
    "colormapFile": "/a/b/c/colormap.tab",
    "outDirectory": "/a/b/view/CKCC/v1",
    "neighborCount": 8,
    "firstColorAttribute": "Tissue",
    "layoutAwareStats": true,
    "layoutIndependentStats": true
 }

Where:

* **map** : a unique ID in the form: <group>/<map> or simply: <map>
* **authGroup** : optional, the authorization group to which a user must belong to view this map, defaults to publicly viewable
* **email** : optional, one or more email addresses to receive the response
* **layoutFileFormat** : Note 1
* **layoutAttributeFiles** : one or more, the full path to the attribute data file containing the values to use for the layout: the keys are the layout names. Note 1
* **colorAttributeFiles** : optional, one or more, the full path to the attribute data file containing the values to use for coloring the nodes. Note 1
* **colormapFile** : optional, the full path to the existing colormap to which new categorical color attributes will be added and existing attributes with new categories will be added. If a colormap is not provided one will be automatically generated
* **outDirectory** : full directory path for the output files
* **neighborCount** : optional, the number of neighbors of each node to consider in laying out the map; defaults to 6 **Duncan** is this the truncation_edges parm to layout.py?
* **firstColorAttribute** : optional, the attribute to be used to color the map on initial display. If not supplied and densityStats are requested then the attribute with the highest density will be displayed first. Otherwise the first attribute alphabetically will be used.
* **layout*Stats** : optional, true indicates this class of stats should be calculated, defaults to false. Note that these are compute-intensive so you may want to run them only when you are satisfied with your layout and coloring attributes.

Note 1: For file formats go to the viewer -> Help menu -> User guide -> Create a Map.

A URL pointing to the new map will be returned as a json string in the form::

 { "bookmark": "https://tumormap.ucsc.edu/?p=CKCC/V1" }

**Response success**

This is returned as HTTP 200 with the content as a JSON string in the form above.

**Response errors**

Response errors are returned as HTTP 400 with an explanation.

There may be more errors returned than listed here.

* Error: malformed JSON
* Error: name has unprintable characters (not ASCII 32-126), unprintable chars replaced with ‘_’ in <name>
* Error: parameter missing or malformed: <parameter>
