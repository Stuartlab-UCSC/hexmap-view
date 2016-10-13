#!/usr/bin/env python2.7
"""
layoutTest.py
"""

import sys, traceback
import layout
from pythonCall import pythonWrapper


def tester():
    pythonCallName = 'layout'
    jsonRequestFile = '/Users/swat/data/featureSpace/createMapTestBigger/coordinates1.json'

    pythonWrapper(pythonCallName, jsonRequestFile)

if __name__ == "__main__" :
    try:
        return_code = tester();
    except:
        traceback.print_exc()
        return_code = 1
        
    sys.exit(return_code)
