
.. _createMap:

Create a Map
============

You can create a map with your own data by selecting *Create map* from the *File*
menu, then supplying at least a layout feature file and specifying its format.

Note that this is only available to certain users due to the
computationally intensive operations.

.. _feature-formats:

Features to Lay Out the Map
---------------------------

Features are properties of nodes used to lay out the map. The feature file must
be in TSV (tab-separated values) format in one of the following forms.

**Clustering data** : This is the most basic of the layout input formats where
similarities and XY locations will be calculated for you.
This contains a full matrix with node IDs across the top and feature IDs in the
first column, like::

 feature   node1   node2   node3   ...
 feature1  val     val     val
 feature2  val     val     val
 feature2  val     val     val
 ...

**Full similarity** : This contains similarity scores between all node pairs
as a full matrix which will be used to calculate xy positions.
This has node IDs across the top and in the first column with
similarity scores as the values, like::

 nodes   node1   node2   node3   ...
 node1   val     val     val
 node2   val     val     val
 node3   val     val     val
 ...

**Sparse similarity** :This contains similarity scores between the top neighbor
nodes of each node as a sparse matrix which will be used to calculate xy positions.
This has node IDs in the first two columns with the the
similarity scores in the third column, like::

 node1   node2   val
 node1   node3   val
 node1   node5   val
 ...

**XY positions** : This is the most processed of the layout input formats,
containing the x and y coordinates in two-dimensional space of each node, like::

 node1   x-val   y-val
 node2   x-val   y-val
 node3   x-val   y-val
 ...

.. _attribute-format:

Attributes to Color the Map
---------------------------

Note that attributes are optional.

Attributes are properties of nodes used to color the map. The attribute file
must be in TSV (tab-separated values) format with the
attributes IDs across the top and node IDs in the first column, like::

 ID      attr1   attr2   attr3   ...
 node1   val     val     val
 node2   val     val     val
 node3   val     val     val
 ...

..
    Layout Methods
    --------------

    The option to select a layout method other than DrL will be added to the UI soon.

    Layout methods are the algorithms used to arrange the nodes on the
    two-dimensional map with the following options available. The default is DrL.

    **DrL** : Distributed Recursive (Graph) Layout

    **tSNE** : t-distributed Stochastic Neighbor Embedding

    **MDS** : Multidimensional scaling

    **PCA** : Principal Component analysis

    **ICA** : Independent Component Analysis

    **isomap** : Isomap Embedding

    **spectral embedding** : Project the sample on the first eigenvectors of the graph Laplacian


..
   TBD This section needs to be coded before showing it to the user.

    Advanced Options
    ----------------

    Special color attributes
    ^^^^^^^^^^^^^^^^^^^^^^^^

    Handle as integer rather than categories
    ........................................

    TBD

    Handle as 2 categories rather than binary
    .........................................

    TBD

