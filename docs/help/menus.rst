
Menus
=====


File Operations
---------------

These operations are available on the **File** menu.

Save/Bookmark
^^^^^^^^^^^^^

Use this to save your current view as a bookmark to retrieve in the future or
share with others.

Create Map
^^^^^^^^^^

Create a map using your data. For details see :doc:`createMap`

Download Node IDs
^^^^^^^^^^^^^^^^^

To download node IDs, a group of nodes must already be selected and saved to
the **Short List** as described below in, :ref:`selectingNodes`.

To download node IDs of a custom subgroup, go to the **File** menu
then **Download**, then click on **Node IDs**.
A window will appear for you to select the group of interest.

Other Downloads
^^^^^^^^^^^^^^^

Other available downloads are:

**PDF** : PDF image of map and/or legend

**SVG** : SVG image of map

**XY coordinates** : positions of the nodes in the preliminary projection on the
X-Y plane, before they are snapped to a hexagonal grid


Edit the Map
------------

You may edit the map by selecting one of the options on the **Edit** menu:

**Background** : change the background to white or black

**Colormap** : change the color of any categorical attribute.
Once the colormap window is displayed you can change any colors for any
categorical attribute.
When you change a color for an attribute that is currently displayed,
as soon as you exit the color box the new color will be reflected on the map.
To restore a color value to it's original color,
clear its box of text and the original value will appear.
Colormap changes made may be saved as a bookmark from the **File** menu:
**Save/Bookmark**. These colors will be shown only when this bookmark is used
and the colormap generated with the map will not be changed.

Place new Nodes
^^^^^^^^^^^^^^^

Select this option to add your own nodes to the map. If this option is greyed
out then this map does not have all of the required data to place new nodes.
A window will appear for you to upload a file that contains your new nodes with
features that match the ones in the map.

After the upload is complete and the data are used to compute the placement,
the nodes will appear on your map. Also an email will be sent indicating the
computations are complete with the URL to view the map with the new nodes.
This is helpful if the computations take a long time.

Two new attributes will be returned for each node. One will contain the list of
nearest neighbors and the other will contain the similarity values of those
neighbors.

Note that at least 50% of the features provided must match those in the map or
an error will be returned.

.. feature disabled:
.. **Add Label** : attach your own label to anywhere on the map

.. _selectingNodes:

Select Nodes
------------

To select a group of nodes, click on one of the options in the **Select** menu.

Sometimes you may want to select a group of nodes to do additional analysis in
or outside of the map. Selecting a group of nodes creates a new attribute
in the **Short List**. This new attribute will have binary values with *one*
indicating the node belongs to the new group and *zero* for nodes that don't
belong.

Note that this attribute will be irretrievably removed if removed from the
**Short List**.

The most simple way to select a group of nodes is from the **Select** menu by
clicking on the method you would like to use to select the nodes:

**by Rectangle** or **by Polygon** : select regions by clicking on the map

**by Node IDs** : enter a list of node IDs to be selected

A window will appear to allow you to name this group and make it appear in the
**Short List**.

More advanced methods for selecting nodes and creating attributes are described
in :doc:`createAttribute`.


Views of the Map
----------------

There are two views of the map available under the **View** menu:

**Hexagonal Grid** : the primary view which allows better viewing of attribute colors.

**Cartesian Plane** : shows positions of the nodes in the projection on
the X-Y plane, before they are snapped to a hexagonal grid

Once in **Node Density** view, there is an additional option in the **View**
menu:

**Show Edges** : shows the directed graph of node edges so you can see the
relationships used in positioning the nodes. Clicking on a node will highlight
the edges to neighbors used to lay out the map. Incoming edges are highlighted
with red, while outgoing edges are highlighted with green. Edges that go both
ways are shown as thick grey lines.


Tools: Data Operations
----------------------

All of the available operations on data are in the **Tools** menu and explained
in :doc:`advancedControls`
