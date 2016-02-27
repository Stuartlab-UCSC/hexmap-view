Requirements
============

Python 2.7
----------

DRL graph layout [1]
--------------------

Install::

 wget https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip
 #alternatively:
     curl https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip > c41341de8058.zip
 unzip c41341de8058.zip
 cd adam*/src
 cp Configuration.gnu Configuration.mk
 make
 ls ../bin

FDR correction for p-values [2]
-------------------------------

Install the Benjamini-Hochberg method::

 easy_install -U statsmodels

http://statsmodels.sourceforge.net/devel/install.html

PATH environment variable
-------------------------

Set your PATH environment variable to include python and DRL layout executables::

 <hexagram-root>/hexagram/.python:<root>/hexagram/server:<drl-root>/drl-graph-layout/bin

Sphinx
------

Sphinx is used to build this document. To modify this document, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html

TBD
---

more TBD

References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.

(TODO:  check this in In somehow)

[2] (TODO: reference & check this in In somehow)

