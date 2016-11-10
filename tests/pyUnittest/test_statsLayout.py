# test_statsLayout.py

import os, sys, glob, filecmp, shutil, csv
import unittest
from rootDir import *
import numpy as np

from statsLayoutNew import * # TODO use statsLayout eventually

rootDir = getRootDir()
pythonDir = rootDir + '.python/'
serverDir = rootDir + 'server/'
sys.path.append(pythonDir)
sys.path.append(serverDir)

class TestStatsLayout(unittest.TestCase):

    def test_find_single_attr_counts(s):
        Cp = [
            ['s0', 's1', 's10'],
            ['s2', 's3', 's4'],
            ['s5', 's6', 's7', 's8', 's9'],
        ]
        C = np.array(Cp) # should this have a data type for strings?
        layers = {
            'A': {
                'data': {
                    's0': 0,
                    's2': 1,
                    's3': 1,
                    's4': 1,
                    's6': 1,
                    's7': 1,
                    's8': 1,
                    's9': 1,
                }
            },
        }
        counts = find_single_attr_counts(C, layers['A']['data'])
        np_counts = np.array(counts, dtype=np.int8)
        expected = np.array([1, 0, 0, 2], dtype=np.int8)
        #print 'expected', expected
        #print 'np_counts', np_counts
        s.assertTrue((np_counts == expected).all())
        """
    def test_find_attrs_counts (s):
        Cp = [
            ['s0', 's1', 's10'],
            ['s2', 's3', 's4'],
            ['s5', 's6', 's7', 's8', 's9'],
        ]
        C = np.array(Cp) # should this have a data type for strings?
        layers = {
            'A': {'data': {
                    's0': 0,
                    's2': 1,
                    's3': 1,
                    's4': 1,
                    's6': 1,
                    's7': 1,
                    's8': 1,
                    's9': 1,
            }},
            'B': {'data': {
                    's0': 1,
                    's1': 1,
                    's2': 1,
                    's5': 1,
                    's7': 1,
                    's9': 0,
            }},
        }
        ctx = {'binary_layers': ['A', 'B']}
        counts = find_attrs_counts (C, layers, ctx)
        np_counts = np.array(counts, dtype=np.int8)
        expected = np.array([[1, 0, 0, 2], [0, 0, 0, 3]], dtype=np.int8)
        #print 'expected', expected
        #print 'np_counts', np_counts
        s.assertTrue((np_counts == expected).all())
        """

if __name__ == '__main__':
    unittest.main()
