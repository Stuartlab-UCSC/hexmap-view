#!/usr/bin/env python2.7


import sys
import unittest
from rootDir import getRootDir

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'createMapIn/'   # The input data
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
            '--similarity', inDir + 'mcr.top6.tab',
            '--names', 'mRNA',
            '--scores', inDir + 'mcrchopra.atts.tab',
            '--colormaps', inDir + 'mcrchopra.colormaps.tab',
            #'--min_window_nodes', '2',
            #'--max_window_nodes', '5',
            #'--mi_window_threshold', '2',
            #'--mi_window_threshold_upper', '5',
            #'--window_size', '20',
            #'--truncation_edges', '6', #6 is the default
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
