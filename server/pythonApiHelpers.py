#!/usr/bin/env python2.7
"""
pythonApiHelpers.py
This has helper functions to read and write json-formatted files.
There is also an example of calling these helper functions: callHelpersExample
"""

import sys, json, tempfile, traceback, pprint

def readJsonRequestData(jsonRequestFilename):

    # This reads the json-formatted file and returns it's data as a python dict.
    # On error a one is returned.

    # Read the json-formatted data from the file
    try:
        with open(jsonRequestFilename, 'rU') as f:
            jsonData = f.read();
    except:
        print 'Error: json file:', jsonRequestFile, 'could not be read', '\n'
        return 1

    # Transform the json-formatted data to a python dict
    try:
        requestData = json.loads(jsonData);
    except:
        print 'Error: json file:', jsonRequestFilename, 'is not valid json', '\n'
        return 1

    return requestData

def writeJsonResponseData(responseData):

    # This transforms the dict into json format and writes it to a file.
    # On error a one is returned; on success a zero is returned.

    # Transform the python dict to json format
    try:
        jsonData = json.dumps(responseData)
    except:
        print 'Error: the response data could not be transformed into json format', '\n'
        return 1
    
    # Create and write the temporary file
    # Note that the caller will remove this temporary file
    try:
        fileHandle, filename = tempfile.mkstemp(suffix='.json')
        fileHandle = open(filename, 'w')
        fileHandle.write(jsonData)
    except:
        print 'Error: the response data could not be written to the temporary file', '\n'
        return 1

    # Write the filename to stdout for the caller to pick up
    print filename, '\n'
    return 0

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
