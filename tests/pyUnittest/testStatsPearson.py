import os, sys, glob, filecmp, shutil, csv
import unittest
from rootDir import *

rootDir = getRootDir()
serverDir = rootDir + 'server/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'pyInBinChi/'
outDir = testDir + 'pyOutTest/'
sys.path.append(serverDir)
import hexagram

class TestBinaryBinary(unittest.TestCase):

    def hexIt(s):
        global inDir, outDir
        class Options:
            global inDir, outDir
            def __init__(s):
                s.associations = True
                s.colormaps = inDir + 'colormaps.txt'
                s.directory = outDir
                s.drlpath = None
                s.html = 'test.dat'
                s.mi_binary_binning = False # True
                s.mi_window_size = 25
                s.mi_window_threshold = 4 # 30
                s.mutualinfo = True
                s.names = ['mRNA seq']
                s.query = None
                s.raw = None
                s.rawsim = None
                s.scores = [inDir + 'old_attributes.csv']
                s.similarity = [inDir + 'artificial_sparse.tab']
                s.singletons = False
                s.stats = True
                s.truncation_edges = 10
                s.type = None
                s.window_size = 25
            def printIt(s):
                print json.dumps(s, indent=4, sort_keys=True)

        os.chdir(serverDir)
        s.options = Options();
        shutil.rmtree(outDir)
        hexagram.hexIt(s.options)

    def test_files(s):
        s.hexIt()
        os.chdir(outDir)
        files = glob.glob('*pear*')
        refFiles = ['layer_10_pear.tab', 'layer_5_pear.tab', 'layer_6_pear.tab',
            'layer_8_pear.tab']
        #print 'FFFFFFFFFFFFFiles', files
        s.assertTrue(files == refFiles)

    def test_fileContents(s):
        with open(outDir + 'layer_5_pear.tab', 'rU') as fIn:
            fIn = csv.DictReader(fIn, delimiter='\t')
            r = fIn.next();
            s.assertEqual(float(r['Apoptosis']), 1.0)
            s.assertEqual(float(r['Random']), -0.489895298791)
            s.assertEqual(float(r['DNA_signature']), 0.581026937372)
            s.assertEqual(float(r['Placement Badness']), -0.133589914257)

if __name__ == '__main__':
    unittest.main()
