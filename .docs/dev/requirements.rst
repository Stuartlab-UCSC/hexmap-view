Requirements
============

Our servers
-----------

The public server is at https://tumorMap.ucsc.edu which resides on the virtual
machine called hexmap.sdsc.edu, running on the standard https port: 443. User,
'hexmap' should be used to update this server.

The development servers are running at https://hexmap.sdsc.edu:8111 and other
ports beginning with 8 in the 8 thousands.

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

Use this form of the conda command to install the specific versions of packages
listed above::

 conda install numpy=1.10.4 scipy=0.17.0 statsmodels=0.6.1

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

 <hexagram-root>/.python:<hexagram-root>/server:<drl-root>/bin

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


