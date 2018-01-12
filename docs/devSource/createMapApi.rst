Create map
==========

https://hexcalc.ucsc.edu:5000/query/**createMap**

HTTP POST with content-type: application/json

data-type: json

This API builds a new map from data you have supplied via an upload to the
compute server, or data that is already on the compute server.

Content Example
---------------
::

 {
    "map": "CKCC/v3",
    "email": "mok66@gmail.com",
    "layoutInputDataId": "featureSpace/me_ucsc.edu/map/features.tab"
    "layoutInputName": "mRNA",
    "colorAttributeDataId": "featureSpace/me_ucsc.edu/map/attributes.tab",
    "outputDirectory": "view//me_ucsc.edu/map",
    "zeroReplace": true
 }

..
    FUTURE:
    "authGroup": "CKCC",
    "neighborCount": 8,
    "firstColorAttribute": "Disease",
    "layoutAwareStats": false,
    "layoutIndependentStats": false,
    “colormap”: [
        {
            “attribute”: “Disease”,
            “categories”: [
                “BRCA”,
                “LUAD”,
                ...
            ],
            “colors”: [
               “#0000FF”,
               “#00FF00”,
               ...
            ]
        },
        {
            “attribute”: “Tumor Stage”,
            “categories”: [
                “Stage I”,
                “Stage II”,
                ...
            ],
            “colors”: [
               “#0000FF”,
               “#00FF00”,
               ...
            ]
        },
        …
    ]

Where:

* **map** : a unique identifier. If you want the map to belong to a map group,
  that is included before the specific map separated by a slash as in the example.
* **email** : optional, one or more email addresses to receive the response. A
  single string may be supplied or an array of strings.
* **layoutInputDataId** : data ID on the compute server which contains your data
  to use in laying out the map.  This may be a string,
  or an array of strings when there are multiple layout input data sources.
  There are four types of data that may be provided which are described at
  `User Guide <https://tumormap.ucsc.edu/help/createMap.html>`_.
  If more than one data source is provided they all must be of the same data type.
* **layoutInputName** : string used to name this layout. This may be a string,
  or an array of strings when there are multiple layout input data sources.
* **colorAttributeDataId** : optional, data ID on the compute server which
  contains your color attribute data to use in coloring the map. This may be a
  string, or an array of strings when there are multiple color attribute data sources.
  For the format of the data, see the color attribute format section in the
  `User Guide <https://tumormap.ucsc.edu/help/createMap.html>`_.
* **outputDirectory** : the directory in which to store the output. May be
  relative to the data root, such as "view/..." or a full path
* **zeroReplace** : replace all NA values with zero

..
 FUTURE:
 * **authGroup** : optional, defaults to viewable by the user who creates the map.
  The authorization group to which a user must belong to view this map.
 * **reflectionMapType** : optional, with a value of "geneMap". Generate another
  map with 90-degree rotated clustering data so that clustering features are
  used as the nodes in the layout. Color attributes are provided and determined
  by the map type. "genemap" will produce a map with the genes as nodes in the
  layout with a set of pre-defined signatures as color attributes.
 * **neighborCount** : optional, defaults to 6. The number of neighbors of each
  node to consider in laying out the map.
 * **firstColorAttribute** : optional, defaults to the attribute with the highest
  density; the attribute to be used to color the map on initial display
 * **layoutAwareStats** : optional, defaults to false. true indicates the
  statistics which consider the placement of nodes should be calculated. Note
  that these are compute-intensive so you may want to run them only when you are
  satisfied with your layout and coloring attributes.
 * **layoutIndependentStats** : optional, defaults to false. true indicates the
  statistics that are independent of the placement of nodes should be calculated.
  Note that these are compute-intensive so you may want to run them only when
  you are satisfied with your layout and coloring attributes.

 * **colormap** : optional, defaults to a colormap generated during computations.
  A colormap already defined for the color attributes which maps each category
  value to a color. New attributes and categories will be added to this colormap.


Response success
----------------

This is returned as HTTP 200 with the content as a JSON string containing
something like::

 {
    "jobId": "123",
    "jobStatusUrl": "https://hexcalc.ucsc.edu/5000/jobStatus/jobId/123",
    "status": "InJobQueue"
 }

Where:

* **jobId** : an identifer that may be used to query the status of the job via the
  `Job Status API <http://tumormap.ucsc.edu/query/jobStatus/>`_ .
* **jobStatusUrl** : a URL that may be used to check the status
* **status** : always "InJobQueue"

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message and an optional stack trace as a JSON string
in the form::

 {
    "error": "Some message."
    "stackTrace" "an optional stack trace"
 }


Getting the results
-------------------

The results of the calculation may be retrieved with the URL supplied in the
successful response. Statuses that may be returned are described at the
`Job Status API <http://tumormap.ucsc.edu/query/jobStatus/>`_

When the job has completed successfully, the response to the get status request
will be "Success" and the result object will contain something like below where
the url is location of your new map::

 {
    "status": "Success",
    "url": "https://tumormap.ucsc.edu/?p=myMap",
    "logFile": "/hive/groups/hexmap/prod/view/me_ucsc.edu/myMap/log"
 }

If an email address was provided a message will be sent when the job completes.
