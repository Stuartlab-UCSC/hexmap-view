#!/usr/bin/env python2.7
"""
statsSortLayer.py
Object for generating one layer's sort stats for layout-aware & layout-ignore
and for both pre-computed and dynamic stats
"""

import sys, os, json, copy, csv, math, traceback, pprint
import scipy.stats

def sigDigs(x, sig=6):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    return float(format % x)

def is_number(x):
    try:
        float(x)
        return True
    except ValueError:
        return False

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

            # Create the filename to write results.
            # One of either tempFile or layerIndex should be provided
            if 'tempFile' in parm:
                s.file = parm['tempFile']
            else:

                # layerIndex was provided, probably from the precomputed stats
                suffix = '_' + parm['layout'] + '.tab'
                filename = 'statsL_' + str(parm['layerIndex']) + suffix
                s.file = os.path.join(parm['directory'], filename)
        else:

            # Layout-ignore options:

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

            s.hexNames = parm['hexNames']

            # Create the filename to write results.
            # One of either temp_dir or tempFile should be provided
            if 'tempFile' in parm:

               s.file = parm['tempFile']
            else:

                # temp_dir was provided, probably from the precomputed stats
                index = s.statsLayers.index(s.layerA)
                s.file = os.path.join(parm['temp_dir'], "p_val" + str(index) + ".tab")

            if 'dynamicData' in parm:

                # Dynamic stats, so we want layerB to start with the first layer
                s.bLayers = s.statsLayers
            else:

                # Pre-computed stats only need to look at stats layers after
                # layerA, so set the layerB layers to show that
                s.bLayers = s.statsLayers[index:]


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
            chi2, pValue, dof, expectedFreq = scipy.stats.chi2_contingency(table)
        except Exception:
            # We probably had all zeros for a column in the contingency table.
            # See <http://stats.stackexchange.com/q/73708>. Chi-squared can't be
            # done in this case.
            # http://docs.scipy.org/doc/scipy-0.16.0/reference/generated/scipy.stats.chi2_contingency.html#scipy.stats.chi2_contingency
            chi2 = pValue = dof = expectedFreq = float('NaN')

        return [layerA, layerB, sigDigs(pValue)]

    @staticmethod
    def bothContinuousOnePair(layerA, layerB, layers, hexNames):

        # This handles one attribute pair for ignore-layout stats when
        # both attributes have continuous values.

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
            # Pearson call returns like so:
            #   [Pearsons-correlation-coefficient, 2-tailed-p-value]
            # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html
            correlation, pValue = scipy.stats.pearsonr(layers[layerA].values(),
                layers[layerB].values())
        except Exception:
            correlation = pValue = float('NaN')

        return [layerA, layerB, sigDigs(pValue)]

    @staticmethod
    def oneContinuousOnePair(layerA, layerB, layers, hexNames, layerAtype,
        binary=False):

        # This handles one attribute pair for ignore-layout stats when only one
        # of the attributes has continuous values. Binary attributes are treated
        # as if they are categorical with two values when building the vectors.
        # Binary attributes may use a different stats library function than
        # categorical.

        # Assign new names to the layers depending on which is continuous
        if layerAtype == 'cont':
            contL = layerA
            catL = layerB
        else:
            contL = layerB
            catL = layerA

        # Build a vector for each category of the categorical attribute.
        # For each hexagon store its continuous value in the category vector to
        # which it belongs. If the hexagon does not have a value in either of
        # the attributes, ignore it.
        vals = {}
        for hexagon in hexNames:
            try:
                catVal = str(int(layers[catL][hexagon]))
            except KeyError:
                # The hexagon has no value in the categorical layer
                continue
            try:
                contVal = layers[contL][hexagon]
            except KeyError:
                # The hexagon has no value in the continuous layer
                continue

            if catVal in vals:
                vals[catVal].append(contVal)
            else:
                vals[catVal] = [contVal]

        lists = vals.values()

        if binary:

            # Call the binary-continuous stats library function
            try:
                # (Welch's) t-test call returns like so: [t-value, p-value]
                # Including equal variance argument being False makes this a
                # Welch's t-test.
                # http://docs.scipy.org/doc/scipy-0.14.0/reference/generated/scipy.stats.ttest_ind.html

                tValue, pValue = scipy.stats.ttest_ind(lists[0], lists[1], 0, False)
            except Exception:
                tValue = pValue = float('NaN')

        else:
            # Call the categorical-continuous stats library function
            try:
                # Anova call returns like so: [F-value, p-value]
                # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.f_oneway.html

                # Create a string to evaluate to make the call because we have
                # a variable number of lists to pass in
                fValue, pValue = eval('scipy.stats.f_oneway(' + str(lists)[1:-1] + ')')
            except Exception:
                fValue = pValue = float('NaN')

        return [layerA, layerB, sigDigs(pValue)]

    @staticmethod
    def layoutIgnore(s, layerB):

        # If layerA is layerB, we want to write a value of nan at the p-value
        # so it will not be included in the sort in visualization
        if s.layerA == layerB:
            return [s.layerA, layerB, float('NaN')]

        # Determine layerB's data type
        types = [s.layerAtype]
        if hasattr(s, 'binLayers') and layerB in s.binLayers:
            types.append('bin')
        elif hasattr(s, 'catLayers') and layerB in s.catLayers:
            types.append('cat')
        elif hasattr(s, 'contLayers') and layerB in s.contLayers:
            types.append('cont')

        else:
            # We should never get here.
            return 'continue'

        # Call the appropriate stats algorithm based on both layers' data types

        # Is one attribute continuous?
        if types.count('cont') > 0:

            # Are both attributes continuous?
            if types.count('cont') > 1:
                return s.bothContinuousOnePair(s.layerA, layerB, s.layers,
                    s.hexNames)

            # Handle the case where only one attribute is continuous
            else:
                if types.count('bin') > 0:
                    binary = True
                else:
                    binary = False
                sys.stdout.flush()
                return s.oneContinuousOnePair(s.layerA, layerB, s.layers,
                    s.hexNames, s.layerAtype, (types.count('bin') > 0))

        # Is there any combination of binary and categorical?
        elif types.count('bin') == 2 \
            or types.count('cat') == 2 \
            or (types.count('bin') == 1 and types.count('cat') == 1):
            return s.bothDiscreteOnePair(s.layerA, layerB, s.layers, s.hexNames)

        # We should never get here.
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

        # Call the stats library function
        try:
            # Pearson call returns like so:
            #   [Pearsons-correlation-coefficient, 2-tailed-p-value]
            # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html
            correlation, pValue = scipy.stats.pearsonr(A, B)
        except Exception:
            correlation = pValue = float('NaN')

        return [layerB, sigDigs(correlation), sigDigs(pValue)]

    def __call__(s):

        # Compare each layer against the given layer
        error = False
        with open(s.file, 'w') as fOut:
            fOut = csv.writer(fOut, delimiter='\t')
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

                # Write this result line to the stats file
                fOut.writerow(line)

        # For dynamic stats, pass the results file name to the caller via stdout
        if hasattr(s, 'dynamicData'):
            print json.dumps(s.file)

        return 0
