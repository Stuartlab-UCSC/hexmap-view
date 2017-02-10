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
outDirBase = testDir + 'out/layoutBasic'
expDirBase = testDir + 'exp/layoutBasic'
expDir = expDirBase + '/'
outSim6File = testDir + 'out/sim6Layout'

rawDataFile = inDir + 'mcrchopra.data.tab'
top6SimDataFile = inDir + 'mcr.top6.stable.tab'

colorDataFile = inDir + 'mcrchopra.colormaps.tab'
attsCodedFile = inDir + 'mcrchopra.atts.with_strs.tab'

import compute_sparse_matrix
import layout

class Test_sim6Layout(unittest.TestCase):

    def test_sim6Layout(s):
        '''
        This test insures that if you start from the same data,
          the output does not depend on the input form

        '''
        outDir = outDirBase + '_top6/'

        #opts for compute sparse to create a sparse top 6 spearman
        optsSparsSim = [
            '--in_file', rawDataFile,
            '--metric', 'spearman',
            '--output_type', 'SPARSE',
            '--top', '6',
            '--out_file', outSim6File,
            '--num_jobs', '2'
        ]
        compute_sparse_matrix.main(optsSparsSim)

        optsLayoutSparse = [
            "--similarity", outSim6File,
            "--names", "layout",
            "--scores", attsCodedFile,
            "--colormaps", colorDataFile,
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)
        layout.main(optsLayoutSparse)
        util.compareActualVsExpectedDir(s, expDir, outDir)

if __name__ == '__main__':
    unittest.main()
