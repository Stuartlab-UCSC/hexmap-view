#!/usr/bin/env python2.7
"""
statsSortLayoutLayer.py
Object for generating one layer's stats for layout-aware sort stats
"""

import sys, os, argparse, json, pool, copy, csv, traceback, pprint
import scipy.stats
from math import log10, floor

class ForEachLayer(object):

    def __init__(s, parm):

        # Build the filename for precomputed stats
        if parm['writeFile'] == 'yes':
            suffix = '_' + parm['layout'] + '_rstats.tab'
            filename = 'layer_' + str(layerAindex) + suffix
            s.file = os.path.join(parm['directory'], filename)

        # Required parameters
        s.alg = parm['alg']
        s.directory = parm['directory']
        s.layerA = parm['layerA']
        s.layers = parm['layers']
        s.statsLayers = parm['statsLayers']

        # Layout options:
        if 'windowAdditives' in parm:
            s.windowAdditives = parm['windowAdditives']
        if 'windowNodes' in parm:
            s.windowNodes = parm['windowNodes']

        # Dynamic options
        if 'layerFiles' in parm:
            s.layerFiles = parm['layerFiles']

        # Pre-computed options
        if 'writeFile' in parm:
            s.writeFile = parm['writeFile']

    @staticmethod
    def significantDigits(x, sig=6):

        if sig < 1:
            raise ValueError("number of significant digits must be >= 1")

        # Use %e format to get the n most significant digits, as a string.
        format = "%." + str(sig-1) + "e"
        return float(format % x)

    @staticmethod
    def pearsonOnePair(A, B):

        # Compute the pearson value for this layer pair.
        # This gets done each way, since order matters here.

        # Compute R Coefficient & P-Value. We want a sign, and we want the
        # p-value, so apply the sign of the R Coefficient to the P-Value
        pearson_val = scipy.stats.pearsonr(A, B)

        r_val = pearson_val[0]
        val = p_val = pearson_val[1]
        if r_val < 0:
            val = -1 * p_val

        return val

    @staticmethod
    def layoutBinaryPearson(s, layerA, statsLayers, layers, sigDig, writeFile,
        fOut):

        response = []
        for layerB in statsLayers:
            if layerA == layerB: continue

            # Initialize the counts for the layers to the additives in C2
            A = copy.copy(s.windowAdditives)
            B = copy.copy(A)

            # Find nodes with an attribute value of one.
            # Nodes are the x,y coordinates of hexagons before squiggling
            for i, nodes in enumerate(s.windowNodes):
                for node in nodes:

                    # Does this node have a value of one in layer A or B?
                    a = (layers[layerA].has_key(node)
                        and layers[layerA][node] == 1)
                    b = (layers[layerB].has_key(node)
                        and layers[layerB][node] == 1)

                    # Only increment the count if both a and b are not one,
                    # essentially to avoid counting this value twice
                    if not (a and b):
                        if a: A[i] += 1
                        if b: B[i] += 1

            val = s.pearsonOnePair(A, B)

            # Make a line for the stats results with this other layer
            line = [layerB, sigDig(val)]
            #if writeFile:
            if writeFile == 'yes':
                fOut.writerow(line)
            else:
                #print line
                response.append(line)

        return response

    def __call__(s):

        # Open a csv writer for stats of this layer against all other layers,
        # if a filename was provided
        fOut = ''
        if s.writeFile == 'yes':
            fOutFile = open(s.file, 'w')
            fOut = csv.writer(fOutFile, delimiter='\t')

        # Call the stats algorithm given
        response = eval('s.' + s.alg)(s, s.layerA, s.statsLayers, s.layers,
            s.significantDigits, s.writeFile, fOut)

        if s.writeFile == 'yes':
            fOutFile.close()
        else:
            print json.dumps(response, sort_keys=True)

def dynamicStats(parm):

    # This handles dynamic stats initiated by the client

    # Adjust the directory from that received from the client
    # TODO where do we get the directory from?
    # TODO rename directory to project
    directory = '/Users/swat/dev/hexagram/public/' + parm['directory'][:-1]
    parm['directory'] = directory

    # Dynamic options #############
    # Populate the layer to file names dict by pulling the
    # layernames and filenames from layers.tab
    with open(os.path.join(directory, "layers.tab"), 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        layerFiles = {}
        for i, line in enumerate(f.__iter__()):
            layerFiles[line[0]] = line[1]
    parm['layerFiles'] = layerFiles

    # Populate a minimal layers dict with the layers values
    layers = {}
    for layerName in parm['statsLayers']:

        if layerName in parm['dynamicData']:

            # dynamicData means this attribute is dynamic with no data file
            # so pull its data from the dynamicData given
            layers[layerName] = parm['dynamicData'][layerName]
        else:

            # Pull the data for this layer from the file
            filename = layerFiles[layerName]
            with open(os.path.join(directory, filename), 'rU') as f:
                f = csv.reader(f, delimiter='\t')
                layers[layerName] = {}
                for i, line in enumerate(f.__iter__()):
                    layers[layerName][line[0]] = float(line[1])
    parm['layers'] = layers

    #print 'layers:'
    #pprint.pprint(layers)

    # Layout options ############
    # Populate a window node and additives arrays from windows_*.tab
    with open(os.path.join(directory, "windows_" + str(parm['layout']) + ".tab"), 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        windowNodes = []
        windowAdditives = []
        for i, line in enumerate(f.__iter__()):
            windowNodes.append([])
            for j, val in enumerate(line):
                if j == 0:
                    windowAdditives.append(float(val))
                else:
                     windowNodes[i].append(val)
    parm['windowAdditives'] = windowAdditives
    parm['windowNodes'] = windowNodes

    # A required parameter
    parm['alg'] = 'layoutBinaryPearson'

    # Pre-computed options
    # TODO this should just be or not be and not used here in dynamic only land
    parm['writeFile'] = 'no'

    # Create a ForEachLayer instance and call it
    oneLayer = ForEachLayer(parm)
    oneLayer()

    return 0

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        parmWrapper = json.loads(sys.argv[1]);
        return_code = dynamicStats(parmWrapper['parm'])
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
