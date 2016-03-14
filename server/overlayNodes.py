#!/usr/bin/env python2.7
"""
OverlayNodes.py
This is a stub for the overlayNodes.py currently being written. It returns a 
# fake xy position for each node requested.
"""

import sys, os, json, copy, csv, math, traceback, pprint
import pythonApiHelpers
import scipy.stats

def processRequest(requestData):

    # TODO UNUSED!
    # For this stub, we'll return a fake xy position for each node requested
    map = 'pancan33+/stable
    '
    layout = 'mRNA'
    resData = {
       "map": map,
       "layouts": {
           layout: {},
           },
       },
    }
    i = 1
    for node in requestData['layouts']['mRNA']:

        # Assuming our map has a max coordinates of (110, 110) and there are no
        # more that 10 nodes.
        x = 10 * i
        i += 1
        resData[map][layout][node] = {'x': x, 'y': x}
    
    return resData

def overlayNodes(parmFile):

    requestData = pythonApiHelpers.readJsonRequestData(jsonRequestFile)
    if requestData == 1:
        return 1

    responseData = processRequest(requestData)
    rc = pythonApiHelpers.writeJsonResponseData(responseData);
    return rc

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = overlayNodes(sys.argv[1])
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
