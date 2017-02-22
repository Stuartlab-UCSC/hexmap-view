Internal Calc API Overview
==========================

.. toctree::
   :maxdepth: 1

   Nof1

General information
-------------------

The 'hub' contains an http server, data files and scripts that perform
computations on those data files. The http server responds to requests for
computations using the web APIs described at:
https://tumormap.ucsc.edu/query/index.html.

The http server fulfills requests by calling calc scripts via the
'internal calc API' which is described on this document.

Prior to script call
--------------------
Prior to calling the script, parameters received in the http request are
validated, and file locations are derived from the map, layout and/or attribute.

Script call
-----------
The computation script is called from the http server via a spawned python
process, passing the parameters as a python Namespace object.

Defaults for parameters should be set by the computation script
in common code so they are only set once, regardless of entry point.

After script call
-----------------
Any email addresses included in the request are used to send a job completion
message. Http status codes are set and any URLs needed are generated and
returned to the web API caller.
