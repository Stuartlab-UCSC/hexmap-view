#!/usr/bin/env python2.7

# This tests python, using python's easier calls to shell commands
# from here than from mocha

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
import testUtil as util
from rootDir import getRootDir

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/layout/'   # The input data
outDir = testDir + 'out/similarity/' # The actual output data
expDir = testDir + 'exp/similarity/'

import compute_sparse_matrix
import testUtil as tu
import numpy as np

class Test_similarity(unittest.TestCase):

    def test_npToPd(s):
        #make some random data for testing
        ncols=50
        nrows=40
        dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)
        #switch over to numpy
        dt, cn, rn = compute_sparse_matrix.pandasToNumpy(dataDF)

        #make sure the returned dimensions and values are correct
        passed  = len(rn) == nrows and \
                  len(cn) == ncols and \
                  np.all(dataDF.values == dt)

        s.assertTrue(passed,'numpy to pandas conversion failed')

    def test_pdToNp(s):
        #make some random data for testing
        ncols=40
        nrows=50
        dataDF = tu.getdf('','random',ncols=ncols,nrows=nrows)

        #use pandas native conversion to numpy
        dataNP = dataDF.as_matrix()

        #make the expected row and column names (because of how getdf() works)
        cn = range(ncols)
        rn = range(nrows)

        #use our conversion to numpy
        data = compute_sparse_matrix.numpyToPandas(dataNP,cn,rn)

        #makes sure the row names and column names are as expected and then
        # makes sure all the values are equal
        passed = \
              not len(set(data.index).symmetric_difference(set(dataDF.index))) \
            and \
              not len(set(data.columns).symmetric_difference(set(
               dataDF.columns))) \
            and \
              dataDF.equals(data)

        s.assertTrue(passed,'pandas to numpys conversion failed')

    def test_Top20(s):

        #make some random data for testing
        nrows=50
        ncols=50
        top=20
        dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

        neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                           dataDF.columns,
                                                           top)
        gb = neiDF.groupby(neiDF.columns[0]).count()

        passed = gb.shape[0] == nrows and \
                (gb[gb.columns[1]] == top).sum() == nrows

        s.assertTrue(passed,'top ' + str(top) + ' reduction failed')

    def test_Top10(s):

            #make some random data for testing
            nrows=25
            ncols=25
            top=10
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

            neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                               top)
            gb = neiDF.groupby(neiDF.columns[0]).count()

            passed = gb.shape[0] == nrows and \
                (gb[gb.columns[1]] == top).sum() == nrows

            s.assertTrue(passed,'top ' + str(top) + ' reduction failed')

    def test_Top3(s):

            #make some random data for testing
            nrows=20
            ncols=20
            top=3
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

            neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                               top)
            gb = neiDF.groupby(neiDF.columns[0]).count()

            passed = gb.shape[0] == nrows and \
                (gb[gb.columns[1]] == top).sum() == nrows

            s.assertTrue(passed,'top ' + str(top) + ' reduction failed')
    def test_Top30(s):

            #make some random data for testing
            nrows=100
            ncols=100
            top=30
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

            neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                               top)
            gb = neiDF.groupby(neiDF.columns[0]).count()

            passed = gb.shape[0] == nrows and \
                (gb[gb.columns[1]] == top).sum() == nrows

            s.assertTrue(passed,'top ' + str(top) + ' reduction failed')

    def test_Top1(s):

            #make some random data for testing
            nrows=10
            ncols=10
            top=1
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

            neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                               top)
            gb = neiDF.groupby(neiDF.columns[0]).count()

            passed = gb.shape[0] == nrows and \
                (gb[gb.columns[1]] == top).sum() == nrows

            s.assertTrue(passed,'top ' + str(top) + ' reduction failed')
    def test_TopOver(s):

            #make some random data for testing
            nrows=10
            ncols=10
            top=11
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)
            try:
                neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                           top)
                s.assertTrue(False,'No exception was thrown with invalid top '
                                   'argument')

            except ValueError as e:
                #checks the exception says something about the 'top' argument
                passed = 'top' in str(e)
                s.assertTrue(passed,'Exception thrown did not complain about '
                                    'top argument')

    def test_Top0(s):

            #make some random data for testing
            nrows=5
            ncols=5
            top=0
            dataDF = tu.getdf('','random',nrows=nrows,ncols=ncols)

            neiDF = compute_sparse_matrix.extract_similarities(dataDF.values,
                                                               dataDF.columns,
                                                               top)
            passed = neiDF.shape == (0,0)

            s.assertTrue(passed,'top 0 did not have empty dimensions')

if __name__ == '__main__':
    unittest.main()
