import os
import unittest
import tempfile
import json

from rootDir import getRootDir
import newplacement
from Nof1_calc import *

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout/'
expDir = testDir + 'exp/layoutBasic/'

class Nof1CalcTestCase(unittest.TestCase):

    def test_data_reading(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        nodesDict = pd.read_csv(featMat,index_col=0,sep='\t').to_dict()

        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,nodesDict)
        s.assertTrue(refDF.shape == newNodesDF.shape,'reading of tab array incorrect')

    def test_data_reading2(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        nodesDict = pd.read_csv(featMat,index_col=0,sep='\t').to_dict()


        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,nodesDict)
        s.assertTrue(xyDF.shape == (60,2),'reading of xy positions incorrect')

    def test_json_out(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        nodesDict = pd.read_csv(featMat,index_col=0,sep='\t').to_dict()


        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,nodesDict)

        retDict = outputToDict(*newplacement.placeNew(newNodesDF,refDF,xyDF,6))
        s.assertTrue(len(retDict['nodes'].keys()) == 60,
                     'json output has wrong number of nodes:')

if __name__ == '__main__':
    unittest.main()
