Future: Add new coloring attributes via Xena
============================================

https://<compute_server>/query/**addAttribute**

GET

This API takes data for one or more of your Xena attributes and adds them as
values to color an existing map.


Content Example
---------------

(Adding line breaks and spaces for clarity.)
::
 http://localhost:3333/?
    xena=addAttr&
    p=PancanAtlas_dev/XenaPancanAtlas&
    layout=RPPA&
    hub=https://pancanatlas.xenahubs.net/data/&
    dataset=TCGA_pancancer_10852whitelistsamples_68ImmuneSigs.xena&
    attr=some-categorical-attribute
    cat=low
    color=#00ff00
    cat=medium
    color=#000000
    cat=high
    color=#ff000

Where:

* **xena** : the type of xena query, one of: [addAttr]
* **p** : a unique map/project identifier
* **layout** : name of a particular layout of nodes within a map
* **dataset** : name of a dataset on the Xena hub
* **attr** : attribute name within the dataset
* **hub** : the URL of the Xena hub
* **cat** : optional; a category name belonging to the attribute
* **color** : optional; a color belonging to the above category in the form '#000000'


Response success
----------------

This is returned as HTTP 200.

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string.
