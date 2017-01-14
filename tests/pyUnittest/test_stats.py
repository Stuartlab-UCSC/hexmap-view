#!/usr/bin/env python2.7


import sys
import unittest
from rootDir import getRootDir

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'statsIn/'   # The input data
expDir = testDir + 'statsExp/' # The expected output data
outDir = testDir + 'statsOut/' # The actual output data
scriptDir = rootDir + 'www/server'

#http://stackoverflow.com/questions/3108285/in-python-script-how-do-i-set-pythonpath
#point the python path to the script directory
sys.path.append(scriptDir)

import layout
import util

class TestStats(unittest.TestCase):

    def runPy(s):
    
        # Build the parms to be passed to layout.py
        opts = [
            '--similarity', inDir + 'artificial_sparse.tab',
            '--names', 'mRNA',
            '--scores', inDir + 'old_attributes.csv',
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
