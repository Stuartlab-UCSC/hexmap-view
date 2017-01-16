#!/usr/bin/env python2.7
# testutil.py
# This tests javascript, using python's easier calls to shell commands
# from here than from mocha

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest

from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'

PYTHONPATH = rootDir + 'www/server'
os.environ["PYTHONPATH"] = PYTHONPATH

def removeOldOutFiles(outDir):
    try:
        shutil.rmtree(outDir)
    except:
        pass
    os.makedirs(outDir)

def compareActualVsExpectedDir(s, outDir, expDir):
    os.chdir(expDir)
    expFiles = glob.glob('*')
    os.chdir(outDir)
    outFiles = glob.glob('*')
    
    # Verify the filenames are those expected
    #print 'outFiles', outFiles
    #print 'expFiles', expFiles
    s.assertTrue(outFiles == expFiles)

    # Compare the file contents with the expected
    # Returns three lists of file names: match, mismatch, errors
    diff = filecmp.cmpfiles(outDir, expDir, expFiles)
    #print 'diff', diff
    
    # The log file should be different, with the rest matching
    diff[1].remove('log')
    mismatch = diff[1]
    
    #if mismatch != [] and mismatch != None:
    #    print 'mismatched files: ' + str(mismatch)
    s.assertTrue(mismatch == [] or mismatch == None) # mismatched files
    
    # There should be no errors resulting from the diff
    #if diff[2] != []:
    #    print 'errors comparing files: ' + str(diff[2])
    s.assertTrue(diff[2] == []) # errors

    s.assertTrue(diff[2] == []) # errors

def compareActualVsExpectedFile(s, fname, outDir, expDir):
    
    # Verify the directory exists
    s.assertTrue(path.exists(outDir))

    # Verify the file exists
    s.assertTrue(path.isfile(outDir + fname))

    # Compare the file contents
    s.assertTrue(filecmp.cmp(outDir + fname, expDir + fname))
    
