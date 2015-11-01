#!/usr/bin/env python2.7
"""
statsSortLayoutLayer.py
Object for generating one layer's stats for layout-aware sort stats
"""

# TODO not all of these are needed
import sys, os, argparse, json, pool, copy, csv
import scipy.stats

from math import log10, floor

class ForEachLayer(object):

    def __init__(s, layerA,     layerAindex, statsLayers, layers, windowNodes, windowAdditives, opts):

        #print ('__ init __')

        # Build the filename for precomputed stats
        suffix = '_' + opts['layout'] + '_rstats.tab'
        s.file = os.path.join(opts['directory'], 'layer_' + str(layerAindex) + suffix)

        # Store the rest of the parameters
        s.layerA = layerA
        s.statsLayers = statsLayers
        s.layers = layers
        s.windowNodes = windowNodes
        s.windowAdditives = windowAdditives
        s.opts = opts

    @staticmethod
    def significantDigits(x, sig=6):

        if sig < 1:
            raise ValueError("number of significant digits must be >= 1")

        # Use %e format to get the n most significant digits, as a string.
        format = "%." + str(sig-1) + "e"
        return float(format % x)

    @staticmethod
    def pearsonOnePair(A, B):

        #print ('__ pearsonOnePair __')

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
    def layoutBinaryPearson(s, layerA,   statsLayers,   layers,   windowNodes,   windowAdditives,   opts,   fOut):

        #print ('__ layoutBinaryPearson __')

        for layerB in statsLayers:
            if layerA == layerB: continue

            # Initialize the counts for the layers to the additives in C2
            A = copy.copy(windowAdditives)
            B = copy.copy(A)

            # Find nodes with an attribute value of one.
            # Nodes are the x,y coordinates of hexagons before squiggling
            for i, nodes in enumerate(windowNodes):
                for node in nodes:

                    # Does this node have a value of one in layer A or B?
                    a = (layers[layerA].has_key(node)
                        and layers[layerA][node] == 1)
                    b = (layers[layerB].has_key(node)
                        and layers[layerB][node] == 1)

                    # Only increment the count if both a and b are not one
                    # essentially to avoid counting this twice
                    if not (a and b):
                        if a: A[i] += 1
                        if b: B[i] += 1

            val = s.pearsonOnePair(A, B)

            # Make a line for the stats results with this other layer
            line = [layerB, s.significantDigits(val)]
            if s.opts['writeFile'] == 'yes':
                fOut.writerow(line)
            else:
                #print line
                s.response.append(line)

    def __call__(s):

        #print ('__ call __')

        # Open a csv writer for stats of this layer against all other layers,
        # if a filename was provided
        if s.opts['writeFile'] == 'yes':
            fOutFile = open(s.file, 'w')
            fOut = csv.writer(fOutFile, delimiter='\t')
        else:
            fOut = ''
            s.response = []

        # Call the stats algorithm given
        eval('s.' + s.opts['alg'])(
            s, s.layerA, s.statsLayers, s.layers, s.windowNodes, s.windowAdditives, s.opts, fOut)

        if s.opts['writeFile'] == 'yes':
            fOutFile.close()
        else:
            print json.dumps(s.response, sort_keys=True)

if __name__ == '__main__':

    # For dynamic stats initiated by the client

    # Parms passed from the client
    parser = argparse.ArgumentParser(description='Calc layout-aware sort stats for one layer.')
    parser.add_argument('layerA', metavar='Focus attribute name\n') # layerA
    parser.add_argument('layerIndex', metavar='Focus attribute index\n')
    parser.add_argument('layout', metavar='Layout index\n') # opts['layout']
    parser.add_argument('directory', metavar='directory\n') # opts['directory']
    args = parser.parse_args()

    # TODO where do we get the directory from?
    # Adjust the directory from that received from the client
    directory = args.directory[:-1]
    directory = '/Users/swat/dev/hexagram/public/' + directory

    # Create the statsLayers array from the binary layers
    # pulled from Layer_Data_Types.tab
    with open(os.path.join(directory, "Layer_Data_Types.tab"), 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        statsLayers = []
        for i, line in enumerate(f.__iter__()):
            if line[0] == 'Binary':
                for attr in line[1:]:
                    statsLayers.append(attr)
                break

    # Generate the layerFiles by pulling the
    # layernames and filenames from layers.tab
    with open(os.path.join(directory, "layers.tab"), 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        layerFiles = {}
        for i, line in enumerate(f.__iter__()):
            layerFiles[line[0]] = line[1]

    # Create a layers dict by pulling from all the layer_*.tab files
    layers = {}
    for layerName in statsLayers:
        filename = layerFiles[layerName]
        with open(os.path.join(directory, filename), 'rU') as f:
            f = csv.reader(f, delimiter='\t')
            layers[layerName] = {}
            for i, line in enumerate(f.__iter__()):
                layers[layerName][line[0]] = float(line[1])

    # Create a window nodes array and window additives array from windows_*.tab
    with open(os.path.join(directory, "windows_" + str(args.layout) + ".tab"), 'rU') as f:
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

    # Build the stats context
    opts = {
        'writeFile': 'no',
        'layout': args.layout,
        'alg': 'layoutBinaryPearson',
        'directory': directory,
        'layerFiles': layerFiles,
    }
    # TODO we shouldn't have to use the for statement since this is only one call
    # We also should not need another process spawned
    allLayers = [ForEachLayer(
        layerA, args.layerIndex, statsLayers, layers, windowNodes, windowAdditives, opts)
        for layerA in [args.layerA]]
    pool.runSubProcesses(allLayers)
