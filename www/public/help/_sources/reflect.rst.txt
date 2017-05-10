
Map Reflection Tool
===================

Reflection is defined as an operation to transition from one map to another
via a selection of nodes. E.g. given a group of samples on a Sample Map,
mRNA reflection allows the user to view genes on a Gene Map whose mRNA are up
or down regulated in those samples, and visa versa. Technical details are
described at the bottom of this page.

Reflecting a set of data from one map onto a companion map may be performed by
clicking on the **Tools** menu then clicking on **Map Reflection**.

The resulting window, **Reflect on Another Map** is described below.

Not all maps have reflection maps. If this option is greyed out in the Tools
menu, then this map has no reflection maps.

If this option does not exist in the Tools menu, then you do not have the proper
authority to run this compute-intensive task. Ask hexmap at ucsc dot edu
with justification for authorization.


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

Technical Details
+++++++++++++++++
Currently, reflection is an operation that transitions from columns<->rows
of a data matrix. The data matrix is most often the same data matrix that is
used to generate the matching data type layout. Before this operation is
preformed, the data matrix undergoes a CLR transform (in all cases except for
SCNV). The CLR transform is the euclidean distance of the column-wise and
row-wise z-scores of each cell in the data matrix. This operation is intended
to help with symmetry, i.e. if you reflect from a group of samples to a group
of genes then reflect back to samples using the "high" reflection category from
genes, you should generally be returned the original sample selection.

For mRNA, miRNA, Methylation, RPPA, a t-test is preformed and the top and bottom
ranking t-statistics are highlighted.

For SCNV, gistic-like thresholds are averaged and the top and bottom ranking
averages are highlighted.

Note:
If a user has their own instance of Tumor Map and would like to implement a
reflection operation other than the ones listed above, please contact the
developers. In general any python implementation whose input is column/row
names and whose outputs is a ranking of row/column names could be used as a
reflection operation.
