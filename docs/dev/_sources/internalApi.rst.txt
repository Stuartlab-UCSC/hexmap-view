Internal Calc API on Hub
========================

.. toctree::
   :maxdepth: 1

   Nof1

General information
-------------------

The 'hub' contains an http server, data files and scripts that perform
computations on those data files. The http server responds to requests for data
files and requests for computations using the web APIs described at:
https://tumormap.ucsc.edu/query/index.html

This page describes the internal API for calling computation scripts upon
receipt of a request via the web API.

Prior to script call
--------------------
Prior to calling the script, parameters received in the http request are
extracted from JSON into a python, sanity validated, and
file locations are derived from the map, layout and/or attribute.

File paths are derived from the map ID, etc before calling the script.

Script call
-----------
The computation script is called from the http server via a spawned python
process, passing the parameters as a python Namespace object.

Defaults for parameters not provided should be set by the computation script
in common code used via
the web API, command-line, or other entry points so that they are set in only
one place.

After script call
-----------------
Any email addresses included in the request are used to send a job completion
message. Any URLs needed are generated and returned to the original web API
caller.
