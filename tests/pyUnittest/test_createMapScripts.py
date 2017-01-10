#!/usr/bin/env python2.7

# This tests python, using python's easier calls to shell commands
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
scriptDir = rootDir + 'www/server'

#http://stackoverflow.com/questions/3108285/in-python-script-how-do-i-set-pythonpath
#point the python path to the script directory
sys.path.append(scriptDir)

import compute_sparse_matrix

class TestCreateMap(unittest.TestCase):

    def test_similarityTop20Spear(s):

        # Test for sparse matrix with 20 top neighbors and spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.top20.spearman.tab'
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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
        expDir = testDir + 'computeSimExp/' # The expected output data
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

        # Test for sparse matrix with 3 top neighbors and spearman correlation
        baseName = 'TGCT_IlluminaHiSeq_RNASeqV2'
        outName = baseName + '.full.spearman.tab'
        expDir = testDir + 'computeSimExp/' # The expected output data
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

    """
    #The below do not work with each other for an unknown reason
    # they are split up into the three test_mcr*.py scripts
    def test_mcr_top6(s):
        '''
        This test insures that if you start from the same data,
          the output does not depend on the input form

        '''
        rawdatafile = inDir + 'mcrchopra.data.tab'
        sparse6_path = inDir + 'mcr.top6.tab'

        #opts for compute sparse to create a sparse top 6 spearman
        optsSparsSim = [
            '--in_file', rawdatafile,
            '--metric', 'spearman',
            '--output_type', 'SPARSE',
            '--top', '6',
            '--out_file', sparse6_path,
            '--num_jobs', '2'
        ]
        compute_sparse_matrix.main(optsSparsSim)

        optsLayoutSparse = [
            "--similarity", sparse6_path,
            "--names", "mRNA",
            "--scores", inDir + "mcrchopra.atts.tab",
            "--colormaps", inDir + 'mcrchopra.colormaps.tab',
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        #clear output directory
        util.removeOldOutFiles(outDir)

        #run layout.py
        layout.main(optsLayoutSparse)

        util.compareActualVsExpectedDir(s, testDir +'mcrchropa_out', outDir)

    def test_mcr_fullsim(s):

        rawdatafile = inDir + 'mcrchopra.data.tab'
        fullsim_path = inDir + '/mcr.fullsim.tab'


        #opts for compute sparse to create a full spearman
        optsFullSim = [
            '--in_file', rawdatafile,
            '--metric', 'spearman',
            '--output_type', 'full',
            '--out_file', fullsim_path,
            '--num_jobs', '2'
        ]

        compute_sparse_matrix.main(optsFullSim)

        #options for different layout.py executions

        optsLayoutFull = [
            "--similarity_full", fullsim_path,
            "--names", "mRNA",
            "--scores", inDir + "mcrchopra.atts.tab",
            "--colormaps", inDir + "mcrchopra.colormaps.tab",
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        #clear output directory
        util.removeOldOutFiles(outDir)

        layout.main(optsLayoutFull)

        util.compareActualVsExpectedDir(s,testDir +'mcrchropa_out' , outDir)

    def test_mcr_raw(s):
        rawdatafile = inDir + 'mcrchopra.data.tab'

        optsLayoutRaw = [
            "--feature_space", rawdatafile,
            "--names", "mRNA",
            "--metric", 'spearman',
            "--scores", inDir + "mcrchopra.atts.tab",
            "--colormaps", inDir + "mcrchopra.colormaps.tab",
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)

        layout.main(optsLayoutRaw)

        util.compareActualVsExpectedDir(s,testDir +'mcrchropa_out' , outDir)
    """
if __name__ == '__main__':
    unittest.main()
