Python API
==========

The server calls python scripts for computations.

**Requests**

Requests are made from nodejs to python scripts via pythonCall.js:call(), the
entry point to the 'pythonCall agent'. Parameters are passed as a javascript
array. The python routine will be called with this array as if
it were called from the command line so the parameters will go through the
python routine's command-line parser.

The call from nodejs is::

 PythonCall.call(operation, opts, calcCtx)

Where:

* operation : the name of the python script
* opts : array of parameters to be passed to the python script
* calcCtx : optional, any data to be used in processing the result

**Response success**

The python script responds with either a python data structure or a filename
containing the results in json. The pythonCall agent returns the results as a
javascript structure to the original nodejs caller as::

 {
    statusCode: 200,
    data: <results>
 }

**Response for captured error**

When the python script captures an error, the error string is returned via
stdout with a prefix of "Error:" and the script returns a zero.

This is the only case when the python script should use a print statement to
stdout while stdout is not redirected elsewhere. The zero returned indicates the
script captured this error already and the error message has already been
reported.

The pythonCall agent returns the results as a javascript structure to the
original nodejs caller as::

 {
    statusCode: <400 or 500 series>,
    data: "Error: <error-message>"
 }

**Response for uncaptured errors**

If the python code exits on an uncaptured error, a one is returned.
The pythonCall agent returns the results as a javascript structure to the
original nodejs caller as::

 {
    statusCode: 500,
    data: "Error: <error-message>"
 }

**Web APIs**

Most python computation scripts should be available via a call from nodejs or
via the web API. Descriptions of the web APIs are at:

https://tumormap.ucsc.edu/query/index.html
