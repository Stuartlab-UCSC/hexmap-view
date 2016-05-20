#!/usr/bin/env python2.7
"""
pythonManager.py
Prepare to call a python script
"""
import sys, os, json, copy, csv, math, traceback
import importlib
import scipy.stats
from pythonApiHelpers import readJsonRequestData
from pythonApiHelpers import writeJsonResponseData

def pythonWrapper(pythonCallName, jsonRequestFile, serverDir):

    opts = readJsonRequestData(jsonRequestFile)
    
    if opts == 1:
        return 1
    
    if 'TESTpythonCallStub' in opts['data']:
        return writeJsonResponseData({'TESTpythonCallStub': 'success'});

    # Call the the python script, which writes the results file for now
    module = importlib.import_module(pythonCallName, package=None)
    rc = module.fromNodejs(opts)
    if rc != 0:
        return 1

    # The python script has written the file already, so send the results
    # filename back to the nodejs caller via stdout.
    # This may change later as we work out the APIs.
    print opts['out_file']
    
    return 0
    
if __name__ == "__main__" :
    try:
        return_code = pythonWrapper(sys.argv[1], sys.argv[2], sys.argv[3])
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)
