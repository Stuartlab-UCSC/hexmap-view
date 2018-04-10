Job Status
==========

https://hexcalc.ucsc.edu/**jobStatus/jobId/<jobId>**

HTTP GET

data-type: json

This API checks the status of a compute job.

Example URL
-----------
::

 https://hexcalc.ucsc.edu/jobStatus/jobId/123

Where '123' is the job ID which is returned from a web API call of the form::

 https://hexcalc.ucsc.edu/query/<operation>

Response success
----------------

This is returned as HTTP 200 with the content something like::

 {
    "status": "Success",
    "result": "some result"
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

Response errors have some HTTP code other than 200, with JSON content that may
contain a stack trace, such as::

 {
    "error" : <errorMessage>,
    "stackTrace" : <trace>
 }
