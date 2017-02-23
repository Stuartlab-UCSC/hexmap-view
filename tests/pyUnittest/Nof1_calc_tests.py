import os
import unittest
import tempfile
import json

from rootDir import getRootDir
import newplacement

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
        fin = open(featMat,'r')
        tabArr = []
        for line in fin:
            #put the line in the array minus the new line
            tabArr.append(line[:-1])

        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,tabArr)
        s.assertTrue(refDF.shape == newNodesDF.shape,'reading of tab array incorrect')

    def test_data_reading2(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        fin = open(featMat,'r')
        tabArr = []
        for line in fin:
            #put the line in the array minus the new line
            tabArr.append(line[:-1])

        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,tabArr)
        s.assertTrue(xyDF.shape == (60,2),'reading of xy positions incorrect')

    def test_json_out(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        fin = open(featMat,'r')
        tabArr = []
        for line in fin:
            #put the line in the array minus the new line
            tabArr.append(line[:-1])

        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,preSquig,tabArr)

        retDict = outputToJson(*newplacement.placeNew(newNodesDF,refDF,xyDF,6))
        s.assertTrue(len(retDict['nodes'].keys()) == 60,
                     'json output has wrong number of nodes:')

if __name__ == '__main__':
    unittest.main()
