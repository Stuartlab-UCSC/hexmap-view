Python API
==========

The server initiates calls to python scripts, while the python script is a
responder to the server's requests.

**Requests**

Requests and responses have only one parameter: the file name containing the data
in JSON format.

The caller and responder create their temporary files in /tmp or
equivalent and the caller will remove them. All requests are asynchronous.

Example::

 python placeNewNodes.py /tmp/x.txt

**Response success**

The response from the python script is returned in stdout, so that just a print
statement is required to pass the temporary filename. This means you cannot
have any other print statements in your scripts.

Example::

 print /tmp/y.txt

**Response errors**

In place of the temporary file name used for success, use stdout to return error and warning
messages. Use one of these forms for your message so the UI can echo it.

'WARNING <some warning, not a failure, but no data>'

'ERROR <some real error that prevented something from happening>'

Example::

 print 'WARNING some minor issue occurred'
 print 'ERROR that just blew everything up'

(This may not be the best solution yet, but it is easy enough to implement
until we find a better one.)

**Python API JSON data:**

.. toctree::
   pyCreateSubMap
   pyOverlayNodes
   pyStatsDynamic

