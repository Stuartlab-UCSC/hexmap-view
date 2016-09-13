
Create a Map
============

You can create a map with your own data.

These terms are used throughout this document:

**node** : the entity represented by a hexagon on the map

**feature** : a property of nodes used to lay out the map

**attribute** : a property of nodes used to color the map

Feature Formats
---------------

A feature is a property of nodes used to lay out the map. The feature file must
be in TSV (tab-separated values) format file in one of the following forms.

**Feature matrix** : This is the most basic of the feature file formats.
This contains a full matrix with node IDs across the top and feature IDs in the
first column, like::

 feature   node1   node2   node3   ...
 feature1  val     val     val
 feature2  val     val     val
 feature2  val     val     val
 ...

**Similarity full matrix** : This contains similarity scores between node pairs
as a full matrix. This has node IDs across the top and in the first column with
similarity scores as the values, like::

 nodes   node1   node2   node3   ...
 node1   val     val     val
 node2   val     val     val
 node3   val     val     val
 ...

**Similarity sparse matrix** :This contains similarity scores between node pairs
as a sparse matrix. This has node IDs in the first two columns with the the
similarity scores in the third column, like::

 node1   node2   val
 node1   node3   val
 node1   node5   val
 ...

**Node XY positions** : This is the most processed of the feature file formats,
containing the x and y coordinates in two-dimensional space of each node, like::

 node1   x-val   y-val
 node2   x-val   y-val
 node3   x-val   y-val
 ...

Attribute Format
----------------

An attribute is a property of nodes used to color the map. The attribute file
must be in TSV (tab-separated values) format file with the
attributes IDs across the top and node IDs in the first column, like::

 nodes   attr1   attr2   attr3   ...
 node1   val     val     val
 node2   val     val     val
 node3   val     val     val
 ...

Layout Methods
--------------

Layout methods are the algorithms used to arrange the nodes on the
two-dimensional map with the following options available.

**DrL** : Distributed Recursive (Graph) Layout

**tSNE** : t-distributed Stochastic Neighbor Embedding

**MDS** : Multidimensional scaling

**PCA** : Principal Component analysis

**ICA** : Independent Component Analysis

**isomap** : Isomap Embedding

**spectral embedding** : Project the sample on the first eigenvectors of the graph Laplacian

Statistics
----------

Statistics may be precomputed at map creation time, or dynamically calculated
as they are needed when viewing the map. The trade-off: precomputing takes
significantly more time to build a map, vs. dynamic calculation while viewing
the map will mean slower sorts by correlation.


