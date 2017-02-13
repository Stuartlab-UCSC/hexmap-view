#!/usr/bin/env python2.7
"""
pythonCall.py
Prepare to call a python script
"""
import sys, os, json, copy, csv, math, traceback, tempfile
import importlib

def readJsonRequestData(json_parm_filename):

    # This reads the json-formatted file and returns it's data as a python
    # structure.
    # The parameter json_parm_filename should be in the form:
    #   { "parm_filename": <parm-filename> }
    # Returns request data as a python list on success, 1 on error. Any error
    # messages are returned to nodejs via stdout.
    
    # Convert the json_parm_filename to a python dict
    try:
        data = json.loads(json_parm_filename)
    except:
        print 'Error: pythonCall.py: json-formatted:', json_parm_filename, \
            'could not be converted to a python dict\n'
        return 1

    # Find the file name in the python dict
    try:
        jsonRequestFilename = data['parm_filename']
    except:
        print 'Error: pythonCall.py: parm file:', parm_filename, \
            'is not in the json parm filename structure\n'
        return 1
    
    # Read the file and convert the json parms to a python list
    try:
        with open(jsonRequestFilename, 'rU') as f:
            requestData = json.load(f)
    except:
        print 'Error: pythonCall.py: json file:', jsonRequestFilename, \
            'could not be read\n'
        return 1

    # Return the parameters as a python list
    return requestData

def writeJsonResponseData(responseData, temp_dir):


    # This creates a temporary file, transforms the python dict into json format,
    # writes it to the temporary file, returning that filename.
    # Create a temporary file
    try:
        fileHandle, filename = tempfile.mkstemp(suffix='.json', dir=temp_dir)
    except:
        print 'Error: pythonCall.py: the response file could not be created\n'
        return 1

    # Write the data to the file as json
    try:
        with open(filename, 'w') as f:
            json.dump(responseData, f, sort_keys=True, indent=4)
    except:
        print 'Error: pythonCall.py: the response data could not be', \
            'transformed into json format\n'
        return 1

    return filename

def pythonWrapper(operation, jsonRequestFile, temp_dir):

    # Given a request/parm filename in a json object, call the python script,
    # return the result as a string via stdout then return the return code where
    # 0 indicates success or a captured error and 1 indicates an uncaptured
    # error.
    #
    # If an an error is captured by the python script and 0 is returned, the
    # python script communicates that error via stdout. This is the only case
    # when the python script should use a print statement to stdout while stdout
    # is not redirected to a file.

    # Convert the parameters within the file from json to a python list.
    opts = readJsonRequestData(jsonRequestFile)
    if opts == 1:
        return 1

    # TODO this test code should not be in here.
    if 'pivot_data' in opts and 'TESTpythonCallStub' in opts['pivot_data']:
        print writeJsonResponseData({'TESTpythonCallStub': 'success'}, temp_dir);
        return 0

    # Call the python script with the python list as if it were command-line
    # arguments.
    module = importlib.import_module(operation, package=None)
    result = module.fromNodejs(opts)
    
    # Upon an uncaptured error the python code returns a result of 1. Return a
    # general error message via stdout and return 1 indicating an uncaptured
    # error.
    if result == 1:
        print 'Error: pythonCall.py: Unknown error\n'
        return 1
    
    # On success or captured error the results are returned from the python
    # script to here and returned to the nodejs caller via stdout, then a return
    # code of 0 is returned.
    if 'tempFile' in opts:
    
        # The python script has already written the results to the temp file
        # specified in the input paramters, so return that filename to the
        # nodejs caller via stdout.
        print result
    else:
    
        # The python script has return the result as a python struct, so write
        # the results to a temp file and return the file name to the nodejs
        # caller via stdout.
        print writeJsonResponseData(result, temp_dir)

    # Return 0 indicating success or an error captured by the python script.
    return 0

if __name__ == "__main__" :
    try:
        return_code = pythonWrapper(sys.argv[1], sys.argv[2], sys.argv[3])
    except:
        traceback.print_exc()
        return_code = 1

    sys.exit(return_code)
