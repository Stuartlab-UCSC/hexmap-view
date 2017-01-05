#!/usr/bin/env python2.7

# This tests javascript, using python's easier calls to shell commands
# from here than from mocha

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
import util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'createMapIn/'   # The input data
outDir = testDir + 'createMapOut/' # The actual output data

#scriptDir = rootDir + 'www/server'
#scriptDir = testDir + 'yulia'
scriptDir = testDir + 'duncan'

PYTHONPATH = rootDir + 'www/server'
os.environ["PYTHONPATH"] = PYTHONPATH

import compute_sparse_matrix
import compute_sparse_matrix_yulia

class TestCreateMap(unittest.TestCase):

    def test_similaritySparse6(s):
    
        # Test for sparse matrix with 6 top neighbors and zero num_jobs
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '_top6.tab'
        expDir = testDir + 'computeSimExp/' # The expected output data
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '6',
            '--metric', 'correlation',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '0'
        ]
        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityFull3(s):
    
        # Test for full matrix with 3 top neighbors and 3 num_jobs
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '_top3.tab'
        expDir = testDir + 'computeSimExp/' # The expected output data
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '3',
            '--metric', 'correlation',
            '--output_type', 'full',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]
        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)
    
    def test_similarityAllSameValues(s):
    
        # Test for when all of the input values are the same
        baseName = 'similarityAllSameValues'
        outName = baseName + '_top6.tab'
        expDir = testDir + 'computeSimExp/' # The expected output data
        opts = [
            '--in_file', inDir + baseName,
            '--top', '3',
            '--metric', 'correlation',
            '--output_type', 'full',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]
        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)
    
if __name__ == '__main__':
    unittest.main()
