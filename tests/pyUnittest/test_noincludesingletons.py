#!/usr/bin/env python2.7

# This tests python, using python's easier calls to shell commands
# from here than from mocha

'''
This test doesn't pass, but the only differences in the files are the order of the lines.

This can be seen by using the sort_files script (hand code the directories you want to order)
 and then performing a diff. The only differences will be in the scrambled log file.
'''
import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
import testUtil as util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout/'   # The input data
outDir = testDir + 'out/noIncludeSingletons/' # The actual output data

import compute_sparse_matrix
import layout

class Test_noincludesingletons(unittest.TestCase):

    def test_mcr_noincludesingletons(s):
        '''
        This test insures that if you start from the same data,
          the output does not depend on the input form

        '''
        expDir = testDir +'exp/layoutBasic/'
        rawdatafile = inDir + 'mcrchopra.data.tab'
        sparse6_path = inDir + 'mcr.top6.tab'

        #opts for compute sparse to create a sparse top 6 spearman
        opts = [
            '--in_file', rawdatafile,
            '--metric', 'spearman',
            '--output_type', 'SPARSE',
            '--top', '6',
            '--out_file', sparse6_path,
            '--num_jobs', '2'
        ]
        compute_sparse_matrix.main(opts)

        opts = [
            "--similarity", sparse6_path,
            "--names", "mRNA",
            "--scores", inDir + "mcrchopra.atts.with_strs.tab",
            "--colormaps", inDir + 'mcrchopra.colormaps.tab',
            "--directory", outDir,
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)
        layout.main(opts)
        util.compareActualVsExpectedDir(s, expDir, outDir)

if __name__ == '__main__':
    unittest.main()
