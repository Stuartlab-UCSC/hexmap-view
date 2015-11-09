#!/usr/bin/env python2.7
"""
statsSortLayer.py
Object for generating one layer's sort stats for layout-aware & layout-ignore
"""

import sys, os, argparse, json, pool, copy, csv, traceback, pprint
import scipy.stats
from math import log10, floor

def significantDigits(x, sig=6):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    return float(format % x)

class ForEachLayer(object):

    def __init__(s, parm):

        # Build the output filename for precomputed stats
        if 'writeFile' in parm:
            suffix = '_' + parm['layout'] + '_rstats.tab'
            filename = 'layer_' + str(parm['layerIndex']) + suffix
            s.file = os.path.join(parm['directory'], filename)

        # Required parameters
        s.alg = parm['alg']
        s.directory = parm['directory']
        s.layerA = parm['layerA']
        s.layers = parm['layers']
        s.statsLayers = parm['statsLayers']

        # Dynamic focus attribute options
        if 'layerFiles' in parm:
            s.layerFiles = parm['layerFiles']

        # Layout-aware options:
        if 'windowAdditives' in parm:
            s.windowAdditives = parm['windowAdditives']
        if 'windowNodes' in parm:
            s.windowNodes = parm['windowNodes']

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
    def layoutBinaryPearson(s, layerB):

        # Initialize the counts for the layers to the additives in C2
        A = copy.copy(s.windowAdditives)
        B = copy.copy(A)

        # Find nodes with an attribute value of one.
        # Nodes are the x,y coordinates of hexagons before squiggling
        for i, nodes in enumerate(s.windowNodes):
            for node in nodes:

                # Does this node have a value of one in layer A or B?
                a = (s.layers[s.layerA].has_key(node)
                    and s.layers[s.layerA][node] == 1)
                b = (s.layers[layerB].has_key(node)
                    and s.layers[layerB][node] == 1)

                # Only increment the count if both a and b are not one,
                # essentially to avoid counting this value twice
                if not (a and b):
                    if a: A[i] += 1
                    if b: B[i] += 1

        return s.pearsonOnePair(A, B)

    def __call__(s):

        # Open a csv writer for stats of this layer against all other layers,
        # if a filename was provided
        fOut = None
        if hasattr(s, 'file'):
            fOutFile = open(s.file, 'w')
            fOut = csv.writer(fOutFile, delimiter='\t')

        # Compare each layer against the given layer
        response = []
        for layerB in s.statsLayers:
            if s.layerA == layerB: continue  # TODO may not work with layout-ignore




            # Call the appropriate function
            val = eval('s.' + s.alg)(s, layerB)




            # Add a line for the stats result with this other layer
            line = [layerB, significantDigits(val)]
            if fOut is None:

                # Add this line to the response array
                response.append(line)
            else:

                # Write this line to the stats file
                fOut.writerow(line)

        if hasattr(s, 'file'):
            fOutFile.close()
        else:
            print json.dumps(response, sort_keys=True)

def layoutStats(parm):

    # This handles the creation of parameters specific to layout-aware stats

    # Populate a window node and additives arrays from windows_*.tab
    fname = "windows_" + str(parm['layout']) + ".tab"
    fpath = os.path.join(parm['directory'], fname)
    if not os.path.isfile(fpath):
        print "Error:", fname, "not found, so statistics could not be computed\n"
        return 0;
    with open(fpath, 'rU') as f:
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

    # Set the pair compare stats algorithm
    parm['alg'] = 'layoutBinaryPearson'

    #return parm

def dynamicStats(parm):

    # This handles dynamic stats initiated by the client

    # Adjust the directory from that received from the client
    # TODO where do we get the directory from? rename directory to project?
    directory = '/Users/swat/dev/hexagram/public/' + parm['directory'][:-1]
    parm['directory'] = directory

    # Populate the layer to file names dict by pulling the
    # layernames and base layer filenames from layers.tab
    fOut = None
    with open(os.path.join(directory, "layers.tab"), 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        layerFiles = {}
        for i, line in enumerate(f.__iter__()):
            layerFiles[line[0]] = line[1]

    parm['layerFiles'] = layerFiles

    # Populate a minimal layers dict with the layers values from the data files
    layers = {}
    for layerName in parm['statsLayers']:

        if layerName in parm['dynamicData']:

            # This attribute is dynamic with no data file
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

    # Complete populating the parms for layout-aware
    if 'layout' in parm:
        layoutStats(parm)

    # Create an instance of ForEachLayer and call it
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
