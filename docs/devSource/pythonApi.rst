Python API
==========

The server initiates calls to python scripts, while the python script is a
responder to the server's requests.

**Python API Helpers**

Use the helper function: readJsonRequestData() to read the json-formatted data
from the file and convert the json to a python dict.

Use the helper function: writeJsonResponseData() to convert the python data to
json, write it to a file, and pass the filename back to the caller via stdout.

This file is checked into the repository as server/pythonApiHelpers.py.

**Requests**

Requests and responses have only one parameter: a file name containing the data
in JSON format. Use the helper function: readJsonRequestData() to read the json-formatted data
from the file and convert the json to a python dict. The data are described
in the individual python APIs listed at the bottom of this page.

Example::

 python placeNewNodes.py /tmp/x.txt

**Response success**

The response from the python script is returned in stdout, so that just a print
statement is required to pass the temporary filename. This means the only print
statements you may have in your scripts include the one to return the
filename containing the response data, and errors as described in **Response errors**.

Use the helper function:
writeJsonResponseData() to convert the python data to json, write it
to a file, and pass the filename back to the caller via stdout. The data are described
in the individual python APIs listed at the bottom of this page.

**Response errors**

In place of the temporary file name used for success, use stdout to return error
and warning messages. Use one of these forms for your message so the UI can echo it.
Return a zero after printing the message so the caller will know this is a captured
error/warning, and not an unknown exception.

Warning: <some warning, not a failure, but no data>

Error: <some real error that prevented something from happening>

Example::

 print 'Warning: some minor issue occurred'
 return 0

 print 'Error: that just blew everything up'
 return 0

**Python API JSON data:**

Descriptions of the JSON data for APIs are at:

* overlayNodes: https://tumormap.ucsc.edu:8112/query/overlayNodes.html
* reflection: :doc:`pyReflection`
* statsDynamic: https://tumormap.ucsc.edu:8112/query/statsDynamic.html

