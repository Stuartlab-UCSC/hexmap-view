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
outDir = testDir + 'mcr_no_colormap_with_rawOut/' # The actual output data
scriptDir = rootDir + 'www/server'

#http://stackoverflow.com/questions/3108285/in-python-script-how-do-i-set-pythonpath
#point the python path to the script directory
#sys.path.append(scriptDir)

import layout

class Test_mcr_no_colormap_with_raw(unittest.TestCase):

    def test_mcr_no_colormap_with_raw(s):
        rawdatafile = inDir + 'mcrchopra.data.tab'

        optsLayoutRaw = [
            "--role", "mcrchopra",
            "--similarity_full", inDir + 'mcr.fullsim.stable.tab',
            "--names", "layout",
            "--scores", inDir + "mcrchopra.atts.with_strs.tab",
            "--directory", outDir,
            "--include-singletons",
            "--no_density_stats",
            "--no_layout_independent_stats",
            "--no_layout_aware_stats"]

        util.removeOldOutFiles(outDir)

        layout.main(optsLayoutRaw)
        #calls a bash script that puts the lines of the files in standard order so they can be compared.
        util.compareActualVsExpectedDir(s,testDir +'mcrchropa_nocolor_expout' , outDir)

if __name__ == '__main__':
    unittest.main()
