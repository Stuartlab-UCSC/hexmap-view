#!/usr/bin/env python2.7

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
import testUtil as util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout'
outDir = testDir + 'out/dataTypes'
expDir = testDir + 'exp/dataTypes'

top6SimDataFile = path.join(inDir, 'mcr.top6.tab')
attsFile = path.join(inDir, 'dataTypes.atts.tab')
colormapFile = path.join(inDir, 'dataTypes.colormaps.tab')

import layout

class Test_dataTypes_calc(unittest.TestCase):

    def test_NoColormap(s):

        opts = [
            "--scores", attsFile,
            "--similarity", top6SimDataFile,
            "--names", "layout",
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)
        layout.main(opts)
        util.compareActualVsExpectedFile(s, 'Layer_Data_Types.tab', outDir, expDir)
        util.compareActualVsExpectedFile(s, 'colormaps.tab', outDir, expDir)

    #def test_withColormap(s):

if __name__ == '__main__':
    unittest.main()
