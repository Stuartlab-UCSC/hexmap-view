Future: Job Status
==================

https://<compute_server>/jobstatus/jobid/<jobId>

HTTP GET

data-type: json

This API checks the status of a compute job.

Example URL
-----------
::

 https://tumormap.ucsc.edu/jobstatus/jobid/34672

Where '34672' is the job ID which is returned from a web API call of the form::

 https://tumormap.ucsc.edu/query/<operation>

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
 * Success
 * Error

* **url** : returned upon successful completion and otherwise has a value
  of 'undefined'.

Response error
--------------

Response errors are returned with some code other than HTTP 200 with the content
containing a more specific message as a JSON string in the form::

 {
    "error": "Some message."
 }
