import os, sys, glob, filecmp, shutil
import unittest
from rootDir import getRootDir

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'statsIn/'   # The input data
expDir = testDir + 'statsExp/' # The expected output data
outDir = testDir + 'statsOut/' # The actual output data

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
            '--min_window_nodes', '2',
            '--max_window_nodes', '5',
            #'--mi_window_threshold', '2',
            #'--mi_window_threshold_upper', '5',
            '--window_size', '20',
            '--truncation_edges', '6',
            '--first_attribute', 'Subtype',
            '--directory', outDir,
        ]
        
        # Clear the data output directory
        try:
            shutil.rmtree(outDir)
        except:
            pass
        
        # Run the layout
        rc = layout.main(opts);
        #rc = hexagram.main(opts);

    def test_stats(s):
        s.runPy()
        util.compareActualVsExpectedDir(s, outDir, expDir)

if __name__ == '__main__':
    unittest.main()
