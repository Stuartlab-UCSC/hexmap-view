#!/usr/bin/env python2.7
"""
statsDynamic.py
This prepares dynamic stats data for calculation of stats by the module common
to dynamic and pre-computed stats: statsSortLayer.
"""

import sys, os, json, copy, csv, math, traceback, pprint
import scipy.stats

from statsLayer import ForEachLayer

def dynamicLayoutAwareStats(parm):

    # This handles the creation of parameters specific to layout-aware stats

    # Populate a window node and additives arrays from windows_*.tab
    fname = "windows_" + str(parm['layout']) + ".tab"
    fpath = os.path.join(parm['directory'], fname)
    if not os.path.isfile(fpath):
        print "Error:", fname, "not found, so statistics could not be computed\n"
        return 0;

    windowNodes = []
    windowAdditives = []

    with open(fpath, 'rU') as f:
        f = csv.reader(f, delimiter='\t')
        for i, line in enumerate(f.__iter__()):
            windowNodes.append([])
            for j, val in enumerate(line):
                if j == 0:
                    windowAdditives.append(float(val))
                else:
                     windowNodes[i].append(val)
    parm['windowAdditives'] = windowAdditives
    parm['windowNodes'] = windowNodes

def dynamicIgnoreLayoutStats(parm):

    # Retrieve the hexagon names from the hexNames.tab file
    fpath = os.path.join(parm['directory'], "hexNames.tab")
    if not os.path.isfile(fpath):
        print "Error:", fpath, "not found, so statistics could not be computed\n"
        return 0;

    hexNames = []
    with open(fpath, 'rU') as f:
        for i, line in enumerate(f.__iter__()):
            hexNames.append(line[:-1]) # with new-line removed

    parm['hexNames'] = hexNames

def dynamicStats(parm):

    # This handles dynamic stats initiated by the client

    # Populate the layer to file names dict by pulling the
    # layernames and base layer filenames from layers.tab
    fOut = None
    with open(os.path.join(parm['directory'], "layers.tab"), 'rU') as f:
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
            with open(os.path.join(parm['directory'], filename), 'rU') as f:
                f = csv.reader(f, delimiter='\t')
                layers[layerName] = {}
                for i, line in enumerate(f.__iter__()):
                    layers[layerName][line[0]] = float(line[1])
    parm['layers'] = layers

    # Complete populating the parms for layout-aware or layout-ignore
    if 'layout' in parm:
        ret = dynamicLayoutAwareStats(parm)
    else:
        ret = dynamicIgnoreLayoutStats(parm)
    if ret == 0: return 0

    # Create an instance of ForEachLayer and call it
    oneLayer = ForEachLayer(parm)
    results = oneLayer()
    return results

def fromNodejs(args):
    return dynamicStats(args)

if __name__ == "__main__" :
    try:
        return_code = dynamicStats(sys.argv[1:])
    except:
        traceback.print_exc()
        return_code = 1
        
    sys.exit(return_code)
