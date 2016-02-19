Python API
==========

The server initiates calls to python scripts, while the python script is a
responder to the server's requests.

**Requests**

Requests and responses have only one parameter: the file name containing the data
in JSON format.
The caller and responder should create their temporary files in /tmp or an
equivilant and the caller will remove them. All requests are asynchronous.

Example request to a python script from the server::

 python placeNewNodes.py /tmp/x.txt

**Response: Success**

The response from the python script is returned in stdout, so that just a print
statement is required to pass the temporary filename. This means you cannot
have any other print statements in your scripts.

Example response from the python script to the server via a print command at the
end of they script::

 print /tmp/y.txt

**Response: Error**

In place of the temporary file name, use stdout to return error and warning
messages. Use one of these forms for your message so the UI can echo it.

'WARN <some warning, not a failure, but no data>'

'ERROR <some real error that prevented or will prevent something from happening>'

For example::

 print 'ERROR that just blew everything up'
 print 'WARN something minor issue occurred'

(I'm not sure this is the best solution yet, but it is easy enough to implement
until we find a better one.)


**The python APIs JSON data:**

.. toctree::
   pyCreateSubMap
   pyOverlayNodes
   pyStatsDynamic

