#!/usr/bin/env python2.7


import sys
import unittest
from rootDir import getRootDir

rootDir = getRootDir()

# These dirs should depend only on the above rootDir
# using the repository directory structure starting at 'hexagram/'
testDir = rootDir + 'tests/pyUnittest/'
inDir = testDir + 'in/stats/'   # The input data
expDir = testDir + 'exp/stats/' # The expected output data
outDir = testDir + 'out/stats/' # The actual output data

import testUtil as util
import leesL
import csv,os

class Test_dynLayoutAware(unittest.TestCase):

    def test_dynamicLayoutAware(s):
        '''
        test the call to dynamic layout aware stats in a similar fasion to that done by the UI.
        does so for all the binary layers in the stats expected directory, and compares the output
        with the precomputed layout aware files from that expected directory
        '''
        #reset the outDir path
        outDir = os.path.join(testDir,'out','dynLayoutAware')

        #we are going to do stats for each of these binaries and compare them with the precomputed.
        binLayers = ["categoricalBinary", "TP63_ mutated", "TP53_expression altered", "TP63_expression altered", "DNA_Repair Broken"]

        #helper function for structuring input as the UI call does.
        def read_layer(filename,layerName):
            '''
            reads data into the same structure as the needed for input
            i.e. a dict of dicts, {attrname : {s1:val,...}}
            @param filename: the path to the two column attribute file
            @param layerName: the name of the attribute the filename belongs to
            @return: {layerName : {s1:val,...}}
            '''
            # Pull the data for this layer from the file
            layers = {}
            with open(os.path.join(expDir, filename), 'rU') as f:
                f = csv.reader(f, delimiter='\t')
                layers[layerName] = {}
                for i, line in enumerate(f.__iter__()):
                    layers[layerName][line[0]] = float(line[1])

            return layers

        #read the layers object so we can get the correct indecies and files per attribute
        layers = leesL.readLayers(os.path.join(expDir,'layers.tab'))

        #clear output directory
        util.removeOldOutFiles(outDir)

        #calls the dynamic function for each binary attribute
        for attribute in binLayers:

            parm = {
                "directory" : expDir,
                "layout": 0,
                "layerA" : attribute,
                "dynamicData" : read_layer(layers[1].loc[attribute],attribute),
                "tempFile"    : os.path.join(outDir,'statsL_' + leesL.getLayerIndex(attribute,layers) + '_0.tab')
                }

            leesL.dynamicCallLeesL(parm)

        #compare all stats files individually
        for attribute in binLayers:
            util.compareActualVsExpectedFile(s, 'statsL_' + leesL.getLayerIndex(attribute,layers) + '_0.tab', outDir, expDir)

if __name__ == '__main__':
    unittest.main()
