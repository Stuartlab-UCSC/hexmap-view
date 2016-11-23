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

    def test_outFiles(s):
        s.runPy()
        os.chdir(expDir)
        expFiles = glob.glob('*')
        os.chdir(outDir)
        outFiles = glob.glob('*')
        
        # Verify the filenames are those expected
        #print 'outFiles', outFiles
        #print 'expFiles', expFiles
        s.assertTrue(outFiles == expFiles)

        # Compare the file contents with the expected
        # Returns three lists of file names: match, mismatch, errors
        diff = filecmp.cmpfiles(outDir, expDir, expFiles)
        #print 'diff', diff
        
        # The log file should be different, with the rest matching
        mismatch = diff[1].remove('log')
        #if mismatch != [] and mismatch != None:
        #    print 'mismatched files: ' + str(mismatch)
        s.assertTrue(mismatch == [] or mismatch == None) # mismatched files
        
        # There should be no errors resulting from the diff
        #if diff[2] != []:
        #    print 'errors comparing files: ' + str(diff[2])
        s.assertTrue(diff[2] == []) # errors

if __name__ == '__main__':
    unittest.main()
