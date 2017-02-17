Internal computation API
========================

The 'hub' contains an http server, data files and scripts that perform
computations on those data files. The http server responds to requests for data
files and requests for computations using the web APIs described at:
https://tumormap.ucsc.edu/query/index.html

This page describes the internal API for calling computation scripts upon
receipt of a request via the web API.

Prior to script call
--------------------
Prior to calling the script, parameters received in the http request are
extracted from JSON into a python data structure and validated.

File paths are derived from the map ID, etc before calling the script.

Script call
-----------
The computation script is called from the http server via a spawned python
process, passing the parameters as a python data structure to a function named
'webApi'.

Defaults for parameters not provided should be set by the computation script in
webApi's parameters. Any other defaults should be set in common code used via
the web API, command-line, or other entry points so that they are set in only
one place.

Successful return
-----------------
The script should return a python data struct upon success. Any output written
to stdout or stderr is ignored.

Failure return
---------------
The script should return a one upon failure. Explicitly-caught errors should be
reported via stderr before returning with a one.

The script should capture any errors not explicitly captured with this sort of
logic::

    try:
        return_value = main(opts)
    except:
        traceback.print_exc()
        return_value = 1
    sys.exit(return_value)

Any output to stdout is ignored.

Note that this is more standard and different from our previous way of calling
scripts where an explicitly-caught error wrote a message beginning with 'Error'
to stdout and returned a value of zero.

After script call
-----------------
Any email addresses included in the request are used to send a job completion
message. Any URLs needed are generated and returned to the original web API
caller.
