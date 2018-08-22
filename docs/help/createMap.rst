
Create a Map
============

You can create a map with your own data by selecting *Create map* from the *File*
menu, then supplying at least a layout feature file in one of the four following
formats.

See `Technical Overview`_ section below for an explanation of the pipeline used to
create a map.

.. _feature-formats:

Features to Lay Out the Map
---------------------------attributes

Features are properties of samples used to lay out the map. The feature file must
be in TSV (tab-separated values) format in one of the following forms.

**Feature data** : AKA **clustering data**. This is the most basic of the layout
input formats where similarities and XY locations will be calculated for you.
This contains a full matrix with sample IDs across the top and feature IDs in the
first column::

 feature   sample_1  sample_2   sample_3  ...
 TP53      0.6423    0.7654     0.2345
 NAS1      0.2345    0.6423     0.7654
 BRCA1     0.7654    0.2345     0.6423
 ...

**Full similarity** : This contains similarity scores between all sample pairs
as a full matrix which will be used to calculate xy positions.
This has sample IDs across the top and in the first column with
similarity scores as the values::

 samples     sample_1  sample_2  sample_3  ...
 sample_1    0.7654    0.6423    0.9524
 sample_2    0.9524    0.7654    0.6423
 sample_3    0.6423    0.9524    0.7654
 ...

**Sparse similarity** :This contains similarity scores between the top neighbor
samples of each sample as a sparse matrix which will be used to calculate xy positions.
This has sample IDs in the first two columns with the the
similarity scores in the third column::

 sample_1    sample_2    0.9524
 sample_1    sample_3    0.76543
 sample_2    sample_4    0.6423
 ...

**XY positions** : This is the most processed of the layout input formats,
containing the x and y coordinates in two-dimensional space of each sample, as
the the example where the header line is optional::

 #ID         x       y
 sample_1    73.6    63.6
 sample_2    63.6    23.8
 sample_3    23.8    73.6
 ...

.. _attribute-format:

Attributes to Color the Map
---------------------------

Note that attributes are optional.

Attributes are properties of samples used to color the map. The attribute file
must be in TSV (tab-separated values) format with the
attributes IDs across the top and sample IDs in the first column, like::

 sample      age   disease stage  ...
 sample_1    81    BRCA    IV
 sample_2    96    COAD    III
 sample_3    52    GBM     II
 ...

Missing values: Replace with zero
---------------------------------
Check this checkbox to replace missing values with zero in the
**layout input file** of format **feature data** or **full similarity**.
More on this in the Technical Overview below.

Troubleshooting
---------------

Help in resolving issues is at :doc:`createMapTrouble`.

Technical Overview
------------------

The **layout input formats** described in the `Features to Lay Out the Map`_
section represent different stages of the pipeline used to create a map.
**Feature data** is the beginning of the pipeline, any nxm matrix can be
used. Spearman correlations are calculated representing the similarity between all
columns in the **Feature data** matrix. The resulting nxn matrix of Spearman
correlations is the **Full similarity** matrix. The **Full similarity** matrix is
then sparsified by taking the 6 highest Spearman correlations for each sample, this
sparsification is the **Sparse similarity** input format. **XY positions** are then
produced by applying the `openOrd layout algorithm
<https://www.researchgate.net/publication/253087985_OpenOrd_An_Open-Source_Toolbox_for_Large_Graph_Layout>`_
to the **Sparse similarity** representation.

The **XY positions** are further modified by the hexagonal binning process. The hexagonal
binning process first lays a hexagonal tiling over the x-y plane, then assigns each point
in the xy space to the nearest hexagon. If a point is assigned to a hexagon that is
already occupied, then a breadth-first search on the hexagon tilling is used to find
the nearest empty hexagon. If the OpenOrd clustering algorithm is used the size of the
hexagons is set to 1. This has been shown to be reasonable with the scaling of the
algorithm. If **XY positions** are input, a hexagon size is set such that hexagons cover
5% of the open space in the plane. The open space is determined by
(max x - min x) * (max y - min y), and the area of a hexagon is is sqrt(3)*3/2 *S^2,
where S is the side length.

Missing values in **Feature data**
++++++++++++++++++++++++++++++++++

We strongly encourage users to choose and execute an
appropriate method for dealing with missing values before using our pipeline.
In general there is not a single method that is best for all types of data.
There is an option on the **Create Map** window to replace any missing values
with zeroes. This applies to **feature data** whose missing values are
converted to zero before calculating Spearman similarities.
Depending on the distribution of the data our technique of filling with zeroes
may be problematic.

