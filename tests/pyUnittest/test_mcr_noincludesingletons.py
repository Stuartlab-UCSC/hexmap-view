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
import util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'createMapIn/'   # The input data
outDir = testDir + 'mcr_noincludesingletonsOut/' # The actual output data
scriptDir = rootDir + 'www/server'

#http://stackoverflow.com/questions/3108285/in-python-script-how-do-i-set-pythonpascriptDir = rootDir + 'www/server'

#point the python path to the script directory
#sys.path.append(scriptDir)

import compute_sparse_matrix
import layout

class Test_mcr_noincludesingletons(unittest.TestCase):

    def test_mcr_noincludesingletons(s):
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
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        #clear output directory
        util.removeOldOutFiles(outDir)

        #run layout.py
        layout.main(optsLayoutSparse)

        util.compareActualVsExpectedDir(s, testDir +'mcrchropa_expout', outDir)

if __name__ == '__main__':
    unittest.main()
