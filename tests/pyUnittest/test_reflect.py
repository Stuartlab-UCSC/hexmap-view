#!/usr/bin/env python2.7

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
expNoAttsDir = expDirBase + 'NoAtts/'
expNoColorDir = expDirBase + 'NoColor/'
expXyDir = expDirBase + 'Xy/'

rawDataFile = inDir + 'mcrchopra.data.tab'
fullSimDataFile = inDir + 'mcr.fullsim.stable.tab'
top6SimDataFile = inDir + 'mcr.top6.stable.tab'
coordDataFile = testDir +'exp/layoutBasic' + '/xyPreSquiggle_0.tab'

colorDataFile = inDir + 'mcrchopra.colormaps.tab'
attsStringsFile = inDir + 'mcrchopra.atts.with_strs.tab'
attsCodedFile = inDir + 'mcrchopra.atts.with_strs.tab'

import layout
import compute_sparse_matrix

class Test_reflect(unittest.TestCase):

    def test_basic(s):
        """
        TODO
        outDir = outDirBase + '_full_no_atts/'

        opts = [
            "--similarity_full", fullSimDataFile,
            "--names", "layout",
            "--metric", 'spearman',
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)
        layout.main(opts)
        util.compareActualVsExpectedDir(s, expNoAttsDir, outDir)
        """

if __name__ == '__main__':
    unittest.main()
