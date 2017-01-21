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
#sys.path.append(scriptDir)

import compute_sparse_matrix
import layout

class Test_mcr_fullsim(unittest.TestCase):

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

        util.compareActualVsExpectedDir(s,testDir +'mcrchropa_expout' , outDir)

if __name__ == '__main__':
    unittest.main()
