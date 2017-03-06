import os
import unittest
import tempfile
import json
import pandas as pd
import compute_sparse_matrix
from rootDir import getRootDir
import placeNode
from placeNode_calc import *

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout/'
inDirCalc = testDir + 'in/placeNode/'
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

        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDict)

        s.assertTrue(refDF.shape == newNodesDF.shape,
                     'reading of tab array incorrect')

    def test_data_reading2(s):
        '''
        test for Nof1_hubs data input into python structures
        @return:
        '''

        #make expected input from json:
        featMat = inDir+ 'mcrchopra.data.tab'
        preSquig = expDir + '/xyPreSquiggle_0.tab'
        nodesDict = pd.read_csv(featMat,index_col=0,sep='\t').to_dict()


        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDict)

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


        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDict)

        retDict = outputToDict(*placeNode.placeNew(newNodesDF,
                                                   refDF,
                                                   xyDF,
                                                   6,
                                                   'mapId'))

        s.assertTrue(len(retDict['nodes'].keys()) == 60,
                     'json output has wrong number of nodes:')
    def test_calc_independence(s):
        '''
        Tests that doing 1 calc produces the same results as doing multiple
         calculations
        @return:
        '''

        #make expected input from json:
        featMat = inDirCalc+ 'trimmedRPPAdata.tab'
        nodesFile = inDirCalc + 'newNodesRPPA.tab'
        nodeFile1 = inDirCalc + 'newNode1RPPA.tab'
        nodeFile2 = inDirCalc + 'newNode2RPPA.tab'
        preSquig = inDirCalc + 'xyPreSquiggle_2.tab'

        nodesDictBoth = pd.read_csv(nodesFile,index_col=0,sep='\t').to_dict()
        nodesDict1 = pd.read_csv(nodeFile1,index_col=0,sep='\t').to_dict()
        nodesDict2 = pd.read_csv(nodeFile2,index_col=0,sep='\t').to_dict()

        ##
        #uses the same input function as the calc routine
        # to get data into pandas structs
        refDF,xyDF,newNodesDF = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDictBoth)

        refDF,xyDF,newNode1 = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDict1)

        refDF,xyDF,newNode2 = putDataIntoPythonStructs(featMat,
                                                         preSquig,
                                                         nodesDict2)
        ##
        #uses the same output function as the calc routine
        retDictBoth = outputToDict(*placeNode.placeNew(newNodesDF,
                                                   refDF,
                                                   xyDF,
                                                   6,
                                                   'mapId'))

        retDict1 = outputToDict(*placeNode.placeNew(newNode1,
                                                   refDF,
                                                   xyDF,
                                                   6,
                                                   'mapId'))

        retDict2 = outputToDict(*placeNode.placeNew(newNode2,
                                                   refDF,
                                                   xyDF,
                                                   6,
                                                   'mapId'))
        #

        #make sure that the x and y coord  are the same
        # whether doing the test individually or 2 nodes at the same time
        s.assertTrue(
            retDictBoth['nodes']['test1']['x'] == \
            retDict1['nodes']['test1']['x'],
                     'doing one test not independent of both'
        )
        s.assertTrue(
            retDictBoth['nodes']['test1']['y'] == \
            retDict1['nodes']['test1']['y'],
                     'doing one test not independent of both'
        )

        s.assertTrue(
            retDictBoth['nodes']['test2']['y'] == \
            retDict2['nodes']['test2']['y'],
                     'doing one test not independent of both'
        )
        s.assertTrue(
            retDictBoth['nodes']['test2']['x'] == \
            retDict2['nodes']['test2']['x'],
                     'doing one test not independent of both'
        )

    def test_commonrow_except(s):

        passed = False
        try:
           #percentage requirement is larger than available rows
           compute_sparse_matrix.common_rows(pd.DataFrame([1,2,3]),
                                             pd.DataFrame([1,2,3,4,5,6]),
                                             1.1)
           #percentage requirement is 50% when only 30% is available
           compute_sparse_matrix.common_rows(pd.DataFrame([1,2]),
                                             pd.DataFrame([1,2,3,4,5,6]),
                                             )
        except ValueError:
           passed = True

        s.assertTrue(passed,'Exception from compute_sparse_.common_rows not'
                             ' properly thrown')

    def test_commonrow(s):

        #flag to run multiple tests for incorrect row reduction
        passed = False
        try:
            d1,d2 =compute_sparse_matrix.common_rows(pd.DataFrame([1,2,3]),
                                                     pd.DataFrame([1,2,3,4,5,
                                                                   6]),
                                                    )
            passed = d2.shape == (3,1) and d1.shape == (3,1)

            d1,d2 =compute_sparse_matrix.common_rows(pd.DataFrame(index =
                                                                  ['1','2',
                                                                   '0']),
                                          pd.DataFrame(index = ['1','2','3',
                                                                '4','5','6']),
                                          .1)
            passed = d2.shape == (2,0) and d1.shape == (2,0)  and passed

            d1,d2 =compute_sparse_matrix.common_rows(pd.DataFrame(index =
                                                                  ['1','2',
                                                                   '0']),
                                                     pd.DataFrame(index = ['2',
                                                                 '4','5','6']),
                                                     .001)

            passed = d2.shape == (1,0) and d1.shape == (1,0)  and passed
            if not passed:
                print 'third' + str(d2.shape)

        except Exception as e:
            s.assertTrue(False,'exception thrown from common_rows' + str(e))


        s.assertTrue(passed,'compute_sparse_.common_rows has '
                             'imporper row reduction ')

if __name__ == '__main__':
    unittest.main()
