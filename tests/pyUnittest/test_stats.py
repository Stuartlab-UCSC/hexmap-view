#!/usr/bin/env python2.7


import sys
import unittest
from rootDir import getRootDir

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/stats/'   # The input data
expDir = testDir + 'exp/stats/' # The expected output data
outDir = testDir + 'out/stats/' # The actual output data

import layout
import testUtil as util

class Test_stats(unittest.TestCase):

    def runPy(s):
    
        # Build the parms to be passed to layout.py
        opts = [
            '--similarity', inDir + 'artificial_sparse.tab',
            '--names', 'mRNA',
            '--scores', inDir + 'attributes.tab',
            '--colormaps', inDir + 'colormaps.tab',
            '--first_attribute', 'Subtype',
            '--directory', outDir,
        ]
        
        #clear output directory
        util.removeOldOutFiles(outDir)
        
        # Run the layout
        layout.main(opts)

    def test_stats(s):
        s.runPy()
        util.compareActualVsExpectedDir(s, outDir, expDir)


if __name__ == '__main__':
    unittest.main()
