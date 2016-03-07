Requirements
============

Python and modules
------------------

Python and modules required::

 Python 2.7.10
 ...
 >>> import statsmodels
 >>> statsmodels.__version__
 '0.6.1'
 >>> import numpy
 >>> numpy.__version__
 '1.10.4'
 >>> import scipy
 >>> scipy.__version__
 '0.17.0'

Miniconda was used to install these versions..

http://conda.pydata.org/docs/install/quick.html

Use this form of the anaconda command to install a specific version::

 conda install scipy=0.15.0

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

PATH environment variable
-------------------------

Set your PATH environment variable to include the tumor map python executables
and the DRL layout executables::

 <hexagram-root>/hexagram/.python:<root>/hexagram/server:<drl-root>/drl-graph-layout/bin

Sphinx
------

Sphinx is used to build this document. To modify this document, Sphinx needs to
be installed according to http://www.sphinx-doc.org/en/stable/install.html

References
----------

[1] S. Martin, W. M. Brown, R. Klavans, K. Boyack, "Dr. L: Distributed Recursive
(Graph) Layout," in preparation for Journal of Graph Algorithms and
Applications.

(TODO:  check this in somehow with yulia's changes)


