Future: Job Status
==================

https://<compute_server>/jobStatus/jobId/<jobId>

HTTP GET

data-type: json

This API checks the status of a compute job.

Example URL
-----------
::

 https://tumormap.ucsc.edu/jobStatus/jobId/34672

Where '34672' is the job ID which is returned from a web API call of the form::

 https://tumormap.ucsc.edu/query/<operation>

Response success
----------------

This is returned as HTTP 200 with the content something like::

 {
    "status": "Success",
    "result": {
        "url": "https://tumormap.ucsc.edu/"
    }
 }

Where:

* **status** : one of:

 * InJobQueue
 * Running
 * Success
 * Error

* **result** : Only Success and Error may have an optional result. This
  property is only present if there is a result. The form of the result depends
  on the status as follows:

 * Success: the calculation result
 * Error: the error message, with an optional stack trace as in this example:

::

 {
    "status": "Error",
    "result": {
        "error" : <errorMessage>,
        "stackTrace" : <stackTrace>
    }
 }



Response error
--------------

Response errors are returned when the job status could not be obtained for some
reason. This response will have some code other than HTTP 200 with the content
containing a printable string and an optional stack trace. If there is no
stackTrace that property will not be in the response::

 {
    "error" : <errorMessage>,
    "stackTrace" : <trace>
 }
