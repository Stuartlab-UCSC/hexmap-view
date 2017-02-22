#!/usr/bin/env python2.7

# This tests python, using python's easier calls to shell commands
# from here than from mocha

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
import testUtil as util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout/'   # The input data
outDir = testDir + 'out/similarity/' # The actual output data
expDir = testDir + 'exp/similarity/'

import compute_sparse_matrix

class Test_similarity(unittest.TestCase):
    '''
    # the file TGCT_IlluminaHiSeq_RNASeqV2 was removed from the github repo
    # and so all of these tests failed.
    def test_similarityTop20Spear(s):

        # Test for sparse matrix with 20 top neighbors and spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top20.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '20',
            '--metric', 'spearman',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityTop20Pcorr(s):

        # Test for sparse matrix with 20 top neighbors and pearson correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top20.correlation.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '20',
            '--metric', 'correlation',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityTop6Spear(s):
    
        # Test for sparse matrix with 6 top neighbors and spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top6.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '6',
            '--metric', 'spearman',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityTop6Pcorr(s):

        # Test for sparse matrix with 6 top neighbors and pearson correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top6.correlation.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '6',
            '--metric', 'correlation',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityTop3Spear(s):

        # Test for sparse matrix with 3 top neighbors and spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top3.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '3',
            '--metric', 'spearman',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityTop3Pcorr(s):

        # Test for sparse matrix with 3 top neighbors and pearson correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top3.correlation.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--top', '3',
            '--metric', 'correlation',
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarityFullPcorr(s):

        # Test for full matrix with pearson correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.full.correlation.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
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

    def test_similarityFullSpear(s):

        # Test for full matrix with spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.full.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--metric', 'spearman',
            '--output_type', 'full',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)

    def test_similarity_with_in_file2(s):
        #this tests if the --in_file2 arg has anticipated behavior.
        # if we feed in the same file for --in_file2 as --in_file
        # the output should be equivelent to only using --in_file

        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top6.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + '.tab',
            '--in_file2', inDir + baseName + '.tab',
            '--metric', 'spearman',
            '--top', "6",
            '--output_type', 'sparse',
            '--out_file', outDir + outName,
            '--log', outDir + 'log',
            '--num_jobs', '2'
        ]

        util.removeOldOutFiles(outDir)
        rc = compute_sparse_matrix.main(opts)
        s.assertTrue(rc == 0)
        util.compareActualVsExpectedFile(s, outName, outDir, expDir)
    '''
    def test_n_of_1_like(s):
        #this tests if the --in_file2 arg has anticipated behavior.
        # if we feed in the same file for --in_file2 as --in_file
        # the output should be equivelent to only using --in_file

        baseName = 'nOf1'
        outName = baseName + '.top6.spearman.tab'
        opts = [
            '--in_file', inDir + baseName + 'Mat.tab',
            '--in_file2', inDir + baseName + 'Vector.tab',
            '--metric', 'spearman',
            '--top', "6",
            '--output_type', 'sparse',
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
