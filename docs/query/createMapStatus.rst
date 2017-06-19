Future: Create a map: Status
============================

https://<compute_server>/query/**createMapStatus**

POST with content-type: application/json

data-type: json

This API checks the status of a job to create a map. This API may only be called
after a create map job has been submitted to the compute server via the web API:
:doc:`createMap`.

Content Example
---------------
::

 {
    "jobId": "5563fdf09484a241d066022bf91a9e96d6ae1976c4d7502d384cc2a87001067a",
 }

Where:

* **jobId** : the job ID returned from the call to :doc:`createMap`.

Response success
----------------

This is returned as HTTP 200 with the content as a JSON string containing::

 {
    "status": "Request received",
    "url": "https://tumormap.ucsc.edu/?p=CKCC/V3"
 }

Where:

* **status** : one of:

 * Request received
 * Failure
 * Success

* **url** is only returned upon successful completion.

When the map build is complete, if an email address was provided in the call
to :doc:`createMap`, a message will be sent with the URL in the case of success
or a failure message will be sent.

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string.
