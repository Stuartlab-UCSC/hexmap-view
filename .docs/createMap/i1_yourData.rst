
Your Data
=========

This describes the file format our utilities are expecting in order to
transform your data into a tumor map.


Feature Matrix
--------------

There may be one or more of these files, with each file corresponding to a layout.
These should be tab-separated values containing node IDs across the top
with feature names as the first column, like::

 feature    node1    node2    ...
 TP53       val      va
 FOXM1      val      val
 ...

Attribute Matrix
----------------

There may be one or more of these files.
These should be tab-separated values containing attribute labels across the top
with sample IDs as the first column, like::

 ID      Subtype   TP53_mutation   ...
 node1   LumB      0
 node2   Basal     1
 ...
