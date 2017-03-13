
Menus
=====


Downloading
-----------

Download Node IDs
^^^^^^^^^^^^^^^^^

To download node IDs, a group of nodes must already be selected and saved to
the *Short List* as described in the section, *Select Node Groups*.

To download node IDs of a custom subgroup, go to the *File* menu
then *Download*, then click on *Node IDs*.
A window will appear for you to select the group of interest.

Other Downloads
^^^^^^^^^^^^^^^

Other available downloads are:

* PDF image of map and/or legend
* SVG image of map
* XY coordinates of the nodes prior to *flattening* them on to the hexagonal grid. The nodes are flattened on to the grid so they will not be overlapping one another, obscuring colors of nodes underneath.


Editing the Map
---------------

You may edit the map by selecting one of the options on the *Edit* menu to:

* change the background to white or black
* change the default colormap for any attributes
* attach your own label to anywhere on the map

.. * adding your own nodes to the map TBD


Selecting Nodes
---------------

Sometimes you may want to select a group of nodes to do additional analysis in
or outside of the map. Selecting a group of nodes also creates a new attribute
that will be treated just like the attributes permanently associated with
the map. This new attribute will have binary values with *one* indicating the node
belongs to the new group and *zero* for nodes that don't belong.

The most simple way to select a group of nodes is from the *Select* menu by
clicking on the method you would like to use to select the nodes:

* *by Rectangle* or *by Polygon* will allow you to select regions by clicking on the map

* *by Node IDs* will allow you to enter a list of node IDs to be selected

A window will appear to allow you to name this group and make it appear in the
*Short List*.

More advanced methods for selecting nodes and creating attributes are described
in *Creating Attributes*.


Views of the Map
----------------

There are two views of the map available under the *View* menu:

* *Map Layout* is the primary view and allows display attribute values
* *Node Density* shows the positions of the nodes before they are *flattened* into the hexagonal grid. Nodes are flattened to the grid so that they will not be overlapping one another, obscuring colors of nodes underneath.

Once in *Node Density* view, there is an additional option in the *View* menu:

* *Show Edges* shows the directed graph of node edges so you can see the relationships used in positioning the nodes


Data Operations
---------------

All of the operations on data are explained in :doc:`advancedControls`
