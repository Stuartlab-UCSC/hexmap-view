#!/usr/bin/env python2.7
"""
pythonApiHelpers.py
This has helper functions to read and write json-formatted files.
There is also an example of calling these helper functions: callHelpersExample
"""

import sys, math, json, tempfile, traceback, pprint

def sigDigs(x, sig=7):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")

    if math.isnan(x):
        return 1

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    return float(format % x)

def readJsonRequestData(jsonRequestFilename):

    # This reads the json-formatted file and returns it's data as a python dict.
    # Returns 0 on success, 1 on error.

    # Read the json-formatted data from the file
    try:
        with open(jsonRequestFilename, 'rU') as f:
            requestData = json.load(f)
    except:
        print 'Error: json file:', jsonRequestFilename, 'could not be read', '\n'
        return 1
    return requestData

def writeJsonResponseData(responseData):

    # This creates a temporary file, transforms the dict into json format,
    # then writes it to the temporary file.
    # Returns 0 on success, 1 on error.

    # Create a temporary file
    try:
        fileHandle, filename = tempfile.mkstemp(suffix='.json')
    except:
        print 'Error: the response file could not be created', '\n'
        return 1

    # Write the data to the file as json
    try:
        with open(filename, 'w') as f:
            json.dump(responseData, f, sort_keys=True, indent=4)
    except:
        print 'Error: the response data could not be transformed into json format'
        return 1

    return filename

def callHelpersExample(jsonRequestFile):

    requestData = readJsonRequestData(jsonRequestFile)
    if requestData == 1:
        return 1

    # requestData now contains the request data in a python dict, so this is
    # where you process that data.
    
    # For this stub, let's just return the given data
    rc = writeJsonResponseData(requestData);
    return rc

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = callHelpersExample(sys.argv[1])
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
