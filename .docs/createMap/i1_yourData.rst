
Your Data
=========

This describes the file format our utilities are expecting in order to
transform your data into a tumor map.


Genomic Matrix
--------------

There may be one or more of these files, with each file corresponding to a layout.
These should be tab-separated values containing node IDs across the top
with genes as the first column, like::

 ID       S1    S2    S3    ...
 gene1    val   val   val   ...
 gene2    val   val   val   ...
 ...

Attribute Matrix
----------------

There may be one or more of these files.
These should be tab-separated values containing attribute labels across the top
with sample IDs as the first column, like::

 ID   Subtype   TP63_ mutated   Apoptosis   ...
 S1   1         0               45
 S2   3         1               40
 ...
