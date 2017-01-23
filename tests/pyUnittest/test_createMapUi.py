#!/usr/bin/env python2.7


import sys
import unittest
from rootDir import getRootDir

#outDirBase = '/hive/groups/hexmap/dev/view/swat_soe.ucsc.edu/'
outDirBase = '/Users/swat/data/view/swat_soe.ucsc.edu/'

# NOTE: until we get selenium up, this is how we test the UI
"""
First create maps from the UI using the map names and input data below and the 
appropriate feature data type.
Then run this script to compare the output with the expected.

    MAP NAME       INPUT DATA in in/layout/
    raw_no_atts    mcrchopra.data.tab
    raw_no_colors  mcrchopra.data.tab, mcrchopra.atts.with_strs.tab
    full_no_atts   mcr.fullsim.stable.tab
    top6_no_atts   mcr.top6.stable.tab
    xy_no_atts     exp/layoutBasicParms/xyPreSquiggle_0.tab
"""

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'statsIn/'   # The input data
expDir = testDir + 'exp/layoutBasicParmsNoAtts/' # The default expected output data

import testUtil as util

class Test_createMapUI(unittest.TestCase):

    def test_raw_no_atts(s):
    
        outDir = outDirBase + 'raw_no_atts'
        util.compareActualVsExpectedDir(s, outDir, expDir)

    def test_raw_no_colors(s):
    
        outDir = outDirBase + 'raw_no_colors'
        expDir = testDir + 'exp/layoutBasicParmsNoColor/'
        util.compareActualVsExpectedDir(s, outDir, expDir)

    def test_full_no_atts(s):
    
        outDir = outDirBase + 'full_no_atts'
        util.compareActualVsExpectedDir(s, outDir, expDir)

    def test_top6_no_atts(s):
    
        outDir = outDirBase + 'top6_no_atts'
        util.compareActualVsExpectedDir(s, outDir, expDir)

    def test_xy_no_atts(s):
    
        outDir = outDirBase + 'xy_no_atts'
        util.compareActualVsExpectedDir(s, outDir, expDir)


if __name__ == '__main__':
    unittest.main()
