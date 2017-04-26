
Map Reflection Tool
===================

Reflecting a set of data from one map onto a companion map may be performed by
clicking on the **Tools** menu then clicking on **Map Reflection**.

The resulting window, **Reflect on Another Map** is described below.

Not all maps have reflection maps. If this option is greyed out in the Tools
menu, then this map has no reflection maps.

If this option does not exist in the Tools menu, then you do not have the proper
authority to run this compute-intensive task. Ask hexmap at ucsc dot edu
with justification for authorization.

Some maps have relationships with other maps so that the layout properties of
a group of nodes may be reflected onto another map. The target map will be
based on the same dataset as the first map with its nodes being the node
properties of the first map.

Input Descriptions
++++++++++++++++++

**Selection** : a **binary** attribute, possibly one you have created by
selecting a group of nodes using an option from the **Select** menu. More
information on selecting nodes is at :ref:`selectingNodes` . More information on
binary attribute data types is at :doc:`dataTypes` .

**Map ID** : the map ID of the target map upon which the data will be reflected.
This list only contains companion maps that have
information to display related to the current map.

**Layout** : the layout of the map ID upon which the data will
be reflected. This list only contains layouts of the target map ID that have
information to display related to the current map.

Click on the **Reflect** button to start up the reflection on the target map.
After computations are complete a new browser tab will be opened with the target
map displaying the reflected data.
