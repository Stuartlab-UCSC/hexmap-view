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
outDir = testDir + 'mcr_xy_no_attsOut/' # The actual output data
scriptDir = rootDir + 'www/server'

#http://stackoverflow.com/questions/3108285/in-python-script-how-do-i-set-pythonpath
#point the python path to the script directory
#sys.path.append(scriptDir)

import layout

class Test_mcr_xy_no_atts(unittest.TestCase):

    def test_mcr_xy_no_atts(s):
        coord = testDir +'mcrchropa_expout' + '/xyPreSquiggle_0.tab'

        optsLayoutRaw = [
            "--role", 'mcrchopra',
            "--coordinates", coord,
            "--names", "layout",
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)

        layout.main(optsLayoutRaw)
        #check that it is mostly the same as the other files
        util.compareActualVsExpectedDir(s,testDir +'mcrchropa_noatts_expout/' , outDir,
                                        excludeFiles = ['log',
                                                        'neighbors_0.tab',
                                                        'assignments0.tab',
                                                        'hexNames.tab',
                                                        'xyPreSquiggle_0.tab']
                                        )
        util.compareActualVsExpectedFile(s,'/neighbors_0.tab',outDir,testDir +'xyExp')
        util.compareActualVsExpectedFile(s,'/assignments0.tab',outDir,testDir +'xyExp')
        util.compareActualVsExpectedFile(s,'/xyPreSquiggle_0.tab',outDir,testDir +'xyExp')

if __name__ == '__main__':
    unittest.main()
