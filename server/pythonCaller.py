#!/usr/bin/env python2.7
"""
pythonCaller.py
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
    
    # TODO this test code should not be in here.
    if 'pivot_data' in opts and 'TESTpythonCallStub' in opts['pivot_data']:
        print writeJsonResponseData({'TESTpythonCallStub': 'success'});
        return 0

    # Call the the python script, which returns the results as a dict
    module = importlib.import_module(pythonCallName, package=None)
    result = module.fromNodejs(opts)
    if result == 1:
        return 1

    # Write the results to a temp file and return the file name
    # to the nodejs caller via stdout.
    print writeJsonResponseData(result)
    return 0

if __name__ == "__main__" :
    try:
        return_code = pythonWrapper(sys.argv[1], sys.argv[2], sys.argv[3])
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)
