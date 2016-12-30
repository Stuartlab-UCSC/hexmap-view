#!/usr/bin/env python2.7
"""
A stub file for testing and development.
"""

import sys, os, json, traceback

def findIt (data):
    data = {
       "map": "stable",
       "mRNA Seq": {
           "mySample1": {
               "ALK": "0.897645",
               "TP53": "0.904140",
               "POGZ: "0.792754",
           },
       },
    }
    #TBD

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = findIt(sys.argv[1])
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
