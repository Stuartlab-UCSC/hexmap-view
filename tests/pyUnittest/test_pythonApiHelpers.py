#!/usr/bin/env python2.7

import os, sys, glob, filecmp, shutil, csv
import unittest
from rootDir import *

rootDir = getRootDir()
pythonDir = rootDir + '.python/'
serverDir = rootDir + 'server/'
sys.path.append(pythonDir)
sys.path.append(serverDir)
from statsLayer import ForEachLayer

class TestPythonApi(unittest.TestCase):

    def test_helpers(s):

        from pythonApiHelpers import callHelpersExample

        # TODO this should test more than a success return
        filename = 'testData/test_overlayNode_request_short.json'
        rc = callHelpersExample(filename)
        s.assertTrue(rc != 1) # not 1 is success

if __name__ == '__main__':
    unittest.main()
