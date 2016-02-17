Python API
==========

Revision: February 14, 2016

The server initiates calls to python, while python is a responder to the
server's requests. All requests are asynchronous.

Requests and responses have only one parameter: the file name containing the data.
This data is in JSON format.
The caller and responder should create their temporary files and the server will
remove them.

.. toctree::
   pyPlaceNewNodes
   pyStatsDynamic