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

def compareActualVsExpectedDir(s, outDir, expDir,excludeFiles=['log']):
    os.chdir(expDir)
    expFiles = glob.glob('*')
    os.chdir(outDir)
    outFiles = glob.glob('*')
    
    # Verify the filenames are those expected
    #print 'outFiles', outFiles
    #print 'expFiles', expFiles
    s.assertTrue(outFiles == expFiles,
                 msg='Differences in file names: ' +
                     str( set(expFiles).symmetric_difference(set(outFiles)))
                 )

    # Compare the file contents with the expected
    # Returns three lists of file names: match, mismatch, errors
    diff = filecmp.cmpfiles(outDir, expDir, expFiles)

    #Files given by the exludeFiles list we know will be different,
    # so ignore them
    for file in excludeFiles:
        if file in diff[1]: #in case we are comparing dirs without a log file
           diff[1].remove(file)

    mismatch = diff[1]

    s.assertTrue(mismatch == [] or mismatch == None,
                 msg='mismatching files: ' + str(mismatch)
                 ) # mismatched files
    
    # There should be no errors resulting from the diff
    #if diff[2] != []:
    #    print 'errors comparing files: ' + str(diff[2])
    s.assertTrue(diff[2] == [],
                 msg='Errors with diff: ' + str(diff[2])
                 ) # errors

def compareActualVsExpectedFile(s, fname, outDir, expDir):
    
    # Verify the directory exists
    s.assertTrue(path.exists(outDir))

    # Verify the file exists
    s.assertTrue(path.isfile(outDir + fname))

    # Compare the file contents
    s.assertTrue(filecmp.cmp(outDir + fname, expDir + fname))
    
