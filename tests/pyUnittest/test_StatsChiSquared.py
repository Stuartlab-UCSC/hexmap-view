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

class TestChi2(unittest.TestCase):

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
        files = glob.glob('*chi2*')
        refFiles = ['layer_0_sstats.tab', 'layer_1_sstats.tab',
            'layer_2_sstats.tab', 'layer_3_sstats.tab',
            'layer_4_sstats.tab', 'layer_7_sstats.tab',
            'layer_9_sstats.tab']
        #print 'FFFFFFFFFFFFFiles', files
        s.assertTrue(files == refFiles)

    def test_chi2FileContents(s):
        with open(outDir + 'layer_7_sstats.tab', 'rU') as fIn:
            fIn = csv.DictReader(fIn, delimiter='\t')
            r = fIn.next();
            s.assertEqual(float(r['TP53_mutated']), 0.000340309112565)
            s.assertEqual(float(r['TP63_mutated']), 0.000340309112565)
            s.assertEqual(float(r['TP53_expression_altered']), 8.95324483173E-14)
            s.assertEqual(float(r['TP63_expression_altered']), 8.95324483173E-14)
            s.assertEqual(float(r['DNA_Repair_Broken']), 8.95324483173E-14)
            s.assertEqual(float(r['Subtype']), 9.35762296884e-14)
            s.assertEqual(float(r['RB1_level']), 0.442955611255)

if __name__ == '__main__':
    unittest.main()
