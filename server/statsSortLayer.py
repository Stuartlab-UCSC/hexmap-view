#!/usr/bin/env python2.7
"""
statsSortLayer.py
Object for generating one layer's sort stats for layout-aware & layout-ignore
and for both pre-computed and dynamic stats
"""

import sys, os, json, copy, csv, math, traceback, pprint
import scipy.stats

def significantDigits(x, sig=6):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    return float(format % x)

class ForEachLayer(object):

    def __init__(s, parm):

        # Required parameters
        s.directory = parm['directory']
        s.layerA = parm['layerA']
        s.layers = parm['layers']
        s.statsLayers = parm['statsLayers']

        if 'layout' in parm:

            # Layout-aware options:
            s.windowAdditives = parm['windowAdditives']
            s.windowNodes = parm['windowNodes']
            if 'writeFile' in parm:
                suffix = '_' + parm['layout'] + '.tab'
                filename = 'statsL_' + str(parm['layerIndex']) + suffix
                s.file = os.path.join(parm['directory'], filename)
        else:

            # Layout-ignore options:
            s.hexNames = parm['hexNames']

            # Save the data type lists and determine layerA's data type
            if 'binLayers' in parm:
                s.binLayers = parm['binLayers']
                if s.layerA in s.binLayers:
                    s.layerAtype = 'bin'
            if 'catLayers' in parm:
                s.catLayers = parm['catLayers']
                if s.layerA in s.catLayers:
                    s.layerAtype = 'cat'
            if 'contLayers' in parm:
                s.contLayers = parm['contLayers']
                if s.layerA in s.contLayers:
                    s.layerAtype = 'cont'

            if 'writeFile' in parm:
                s.temp_dir = parm['temp_dir']
                index = s.statsLayers.index(s.layerA)
                s.file = os.path.join(s.temp_dir, "p_val" + str(index) + ".tab")

                # Pre-computed stats only need to look at stats layers after
                # layerA, so set the layerB layers to show that
                s.bLayers = s.statsLayers[index:]

            else:
                # Dynamic stats, so we want layerB to start with the first layer
                s.bLayers = s.statsLayers

    @staticmethod
    def bothDiscreteOnePair(layerA, layerB, layers, hexNames):

        # This handles one attribute pair for ignore-layout stats when both
        # attributes have any combination of binary and categorical values

        # Find the ranges of layer A & B
        # This is silly for binary data, but good for categorical data
        vals = layers[layerB].values()
        bMax = int(max(vals))
        bMin = int(min(vals))

        vals = layers[layerA].values()
        aMax = int(max(vals))
        aMin = int(min(vals))

        # Initialize the contingency table that will contain counts for each
        # combination of values between the two attributes. So for a binary
        # attribute vs. a categorical attribute of 3 possible values, we will
        # have a 2 x 3 contingency table initialized to all zeroes.
        table = [[0 for i in range(bMax - bMin + 1)] \
            for j in range(aMax - aMin + 1)]

        # Loop through all the hexagons incrementing the count in the
        # appropriate contingency table cell. Ignore those hexagons that do not
        # have a value in one or both of the attributes.
        for hexagon in hexNames:

            try:
                aVal = int(layers[layerA][hexagon])
            except KeyError:
                # this means this hexagon has no value in this layer
                continue

            try:
                bVal = int(layers[layerB][hexagon])
            except KeyError:
                continue

            table[aVal - aMin][bVal - bMin] += 1

        # Call the chi-squared function
        try:
            _, p, _, _ = scipy.stats.chi2_contingency(table)

        except Exception:
            # We probably had all zeros for a column in the contingency table.
            # See <http://stats.stackexchange.com/q/73708>. Chi-squared can't be
            # done in this case.
            p = float('NaN')
            #p = float(None)

        return [layerA, layerB, significantDigits(p)]

    @staticmethod
    def anyContinuousOnePair(layerA, layerB, layers, hexNames, bothContinuous=False):

        # This handles one attribute pair for ignore-layout stats when either
        # or both attributes have continuous values.

        # Loop through all the hexagons building a vector for each of the
        # attributes in the pair. If the hexagon has a value in both
        # attributes, add the values to the vectors. Otherwise ignore this
        # hexagon in calculating this attribute-pair statistics.
        A = B = []

        for hexagon in hexNames:
            try:
                aVal = int(layers[layerA][hexagon])
            except KeyError:
                # this means this hexagon has no value in this layer
                continue
            try:
                bVal = int(layers[layerB][hexagon])
            except KeyError:
                continue

            A.append(aVal)
            B.append(bVal)

        # Call the stats library function
        try:
            if bothContinuous:
                # Pearson call returns like so:
                #   [Pearsons-correlation-coefficient, 2-tailed-p-value]
                r, p = scipy.stats.pearsonr(
                    layers[layerA].values(),
                    layers[layerB].values()
                )
            else:
                # Anova call returns like so: [F-value, p-value-of-F-distribution]
                f, p = scipy.stats.f_oneway(
                    layers[layerA].values(),
                    layers[layerB].values()
                )

        except Exception:
            # We make p None.
            p = float('NaN')
            #p = float(None)

        return [layerA, layerB, significantDigits(p)]

    @staticmethod
    def isEmptyLayer(s, layer):

        if len(s.layers[layer].values()) < 1:
            # For pre-computed stats, write any layer name
            # who has no values to a file, to report later
            if hasattr(s, 'file'):
                with open(os.path.join(s.directory, 'empty_layers.tab'), 'a') as f:
                    f.write(layer + '\n')
            return True
        else:
            return False

    @staticmethod
    def layoutIgnore(s, layerB):

        # Determine layerB's data type
        types = [s.layerAtype]
        if hasattr(s, 'binLayers') and layerB in s.binLayers:
            types.append('bin')
        elif hasattr(s, 'catLayers') and layerB in s.catLayers:
            types.append('cat')
        elif hasattr(s, 'contLayers') and layerB in s.contLayers:
            types.append('cont')

        else:
            # LayerB is not in any of the lists of desired data types, so bail
            return 'continue'

        # Skip any layers with no values at all
        if s.isEmptyLayer(s, layerB):
            return 'continue'

        # Call the appropriate stats algorithm based on both layers' data types

        # Is one attribute continuous?
        if types.count('cont') > 0:
            return s.anyContinuousOnePair(s.layerA, layerB, s.layers, s.hexNames,
                types.count('cont') == 2)

        # Is there any combination of binary and categorical?
        elif types.count('bin') == 2 \
            or types.count('cat') == 2 \
            or (types.count('bin') == 1 and types.count('cat') == 1):
            return s.bothDiscreteOnePair(s.layerA, layerB, s.layers, s.hexNames)

        # We should never get here. TODO log an error?
        return 'continue'

    @staticmethod
    def layoutAware(s, layerB):

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

        vals = scipy.stats.pearsonr(A, B)
        return [layerB, significantDigits(vals[0]), significantDigits(vals[1])]

    @staticmethod
    def is_number(x):
        try:
            float(x)
            return True
        except ValueError:
            return False

    def __call__(s):

        # Skip any layers with no values at all
        if s.isEmptyLayer(s, s.layerA):
            print "Info: Attribute", s.layerA, "has no values, so no statistics to calculate for it.\n"
            return 0;

        # Open a csv writer for stats of this layer against all other layers,
        # if a filename was provided
        fOut = None
        if hasattr(s, 'file'):
            fOutFile = open(s.file, 'w')
            fOut = csv.writer(fOutFile, delimiter='\t')

        # Compare each layer against the given layer
        response = []
        error = False
        for layerB in s.statsLayers:

            # We don't want to compare a layer to itself for layout-aware stats
            if s.layerA == layerB and hasattr(s, 'windowNodes'): continue

            # Based on layout-aware or not, call a
            # function to compare layers A & B
            if hasattr(s,'windowNodes'):
                line = s.layoutAware(s, layerB)
            else:
                line = s.layoutIgnore(s, layerB)

            if line == 'continue': continue

            # Add the result to either an array or a file
            if fOut is None:

                # Add this line to the response array
                response.append(line)
            else:

                # Write this line to the stats file
                fOut.writerow(line)

        if hasattr(s, 'file'):
            fOutFile.close()
        else:

            # Replace any nan's with a string 'nan' because json doesn't know
            # what to do with those
            for i, line in enumerate(response):
                for j, val in enumerate(line):
                    if s.is_number(val) and math.isnan(val):
                        response[i][j] = 'nan'

            print json.dumps(response, sort_keys=True)

        return 0

# Class end ###################################################

def dynamicLayoutAwareStats(parm):

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

def dynamicIgnoreLayoutStats(parm):

    # Retrieve the hexagon names from the hexNames.tab file
    fpath = os.path.join(parm['directory'], "hexNames.tab")
    if not os.path.isfile(fpath):
        print "Error:", fname, "not found, so statistics could not be computed\n"
        return 0;

    hexNames = []
    with open(fpath, 'rU') as f:
        for i, line in enumerate(f.__iter__()):
            hexNames.append(line[:-1]) # with new-line removed

    parm['hexNames'] = hexNames

def dynamicStats(parm):

    # This handles dynamic stats initiated by the client

    # Adjust the directory from that received from the client
    # TODO where do we get the directory prefix from?
    directory = '../../../../../public/' + parm['directory'][index:-1]
    parm['directory'] = directory

    # TODO? Build a layer_names list in the form:
    # [name0, name1, name2...]
    # So it emulates the layer_names built during viz-pre-processing.
    # fill missing array elements with 'none' so the indexes match those of
    # the layer_*.tab file names.

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
    parm['layers'] = layers

    # Complete populating the parms for layout-aware or layout-ignore
    if 'layout' in parm:
        dynamicLayoutAwareStats(parm)
    else:
        dynamicIgnoreLayoutStats(parm)

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
