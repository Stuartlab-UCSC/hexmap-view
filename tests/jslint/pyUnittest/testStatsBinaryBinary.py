import os, glob, filecmp
import unittest
from run import runPy

class TestStatsBinaryBinary(unittest.TestCase):

    rootDir = '/Users/swat/hex-stats/'

    def test_outFiles(s):
        rootDir = '/Users/swat/hex-stats/'
        s.refDir = 'pyOutRef/'
        s.testDir = 'pyOutTest/'
        runPy()
        os.chdir(rootDir + s.refDir)
        s.refFiles = glob.glob('*')
        os.chdir(rootDir + s.testDir)
        s.testFiles = glob.glob('*')
        os.chdir(rootDir)
        s.assertTrue(s.testFiles == s.refFiles) # list of files should match reference

        s.refFiles.remove('debug_binary.tab') # ignore this which changes for each run

        # compare the file contents with the reference
        cmp = filecmp.cmpfiles(s.testDir, s.refDir, s.refFiles)
        if cmp[1] != []:
            print 'mismatched files: ' + str(cmp[1])
        s.assertTrue(cmp[1] == []) # mismatched files
        
        if cmp[2] != []:
            print 'errors comparing files: ' + str(cmp[2])
        s.assertTrue(cmp[2] == []) # errors

        # there should be 5 bin-bin files:

        # the files should have these values:

        # manually calculate chi-squared values?

if __name__ == '__main__':
    unittest.main()
