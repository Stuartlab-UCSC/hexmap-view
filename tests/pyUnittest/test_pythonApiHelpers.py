#!/usr/bin/env python2.7
"""
test_pythonApiExample.py
"""

import os, sys, glob, filecmp, shutil, csv
import unittest
from rootDir import *

rootDir = getRootDir()
pythonDir = rootDir + '.python/'
serverDir = rootDir + 'server/'
sys.path.append(pythonDir)
sys.path.append(serverDir)
from statsLayer import ForEachLayer

class TestPythonExample(unittest.TestCase):
    from pythonApiHelpers import callHelpersExample

    #sys.stdout = open('file', 'w')
    filename = 'testData/test_overlayNode_request_short.json'
    callHelpersExample(filename)

if __name__ == '__main__':
    unittest.main()
