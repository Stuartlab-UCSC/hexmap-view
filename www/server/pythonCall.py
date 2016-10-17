#!/usr/bin/env python2.7
"""
pythonCall.py
Prepare to call a python script
"""
import sys, os, json, copy, csv, math, traceback, tempfile
import importlib
import scipy.stats

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

def writeJsonResponseData(responseData, temp_dir):

    # This creates a temporary file, transforms the dict into json format,
    # then writes it to the temporary file.
    # Returns 0 on success, 1 on error.

    # Create a temporary file
    try:
        fileHandle, filename = tempfile.mkstemp(suffix='.json', dir=temp_dir)
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

def pythonWrapper(pythonCallName, jsonRequestFile, temp_dir):

    opts = readJsonRequestData(jsonRequestFile)
    
    if opts == 1:
        return 1
    
    # TODO this test code should not be in here.
    if 'pivot_data' in opts and 'TESTpythonCallStub' in opts['pivot_data']:
        print writeJsonResponseData({'TESTpythonCallStub': 'success'}, temp_dir);
        return 0

    # Call the the python script, which returns the results as a dict
    module = importlib.import_module(pythonCallName, package=None)

    result = module.fromNodejs(opts)
    if result == 1:
        return 1

    # Write the results to a temp file and return the file name
    # to the nodejs caller via stdout.
    print writeJsonResponseData(result, temp_dir)
    return 0

if __name__ == "__main__" :
    try:
        return_code = pythonWrapper(sys.argv[1], sys.argv[2], sys.argv[3])
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)
