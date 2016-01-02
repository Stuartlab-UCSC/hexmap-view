#!/usr/bin/env python2.6
"""
diffAnalysis.py
A stub file to be sure the client code is calling and receiving properly.
"""

import sys, os, csv, json, tempfile, random, traceback


if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        print "WWWWWWWWWWWW what's up?"
        return_code = 1
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
