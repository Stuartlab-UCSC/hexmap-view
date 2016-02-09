#!/usr/bin/env python2.7
"""
statsLayer.py
Object for generating one layer's sort stats for layout-aware & 
layout-independent and for both pre-computed and dynamic stats
"""

import sys, os, json, copy, csv, math, traceback, pprint
import scipy.stats
import numpy

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
                s.dynamic = True
            else:

                # layerIndex was provided, probably from the precomputed stats
                suffix = '_' + parm['layout'] + '.tab'
                filename = 'statsL_' + str(parm['layerIndex']) + suffix
                s.file = os.path.join(parm['directory'], filename)
        else:

            # Layout-independent options:

            if 'diffStats' in parm:
                s.diffStats = parm['diffStats']

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
               s.dynamic = True
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
    def diffStatsDiscreteFilter(table, diffStat10percent):

        # We want to prevent finding high statistical significance when there
        # are only a few counts of an attribute in both of the groups. When we
        # build a contingency table, if the biggest count of the cells is less
        # than 10% of the sample count of the smaller of the two attribute
        # counts we don't want to compute differential for that attribute.

        # Find the biggest count of all the cells in the table
        biggest = 0;
        for row in table:
            for cell in row:
                biggest = max(biggest, cell)

        # Return true if the biggest cell count is greater than 10% of the
        # sample count of the smaller of the two diff attribute counts
        return (biggest > diffStat10percent)

    @staticmethod
    def bothDiscrete(s, layerA, layerB, layers, hexNames, diffStat10percent):

        # This handles one attribute pair for layout-independent stats when both
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

        if hasattr(s, 'diffStats'):
            enoughCounts = s.diffStatsDiscreteFilter(table, diffStat10percent)
            if not enoughCounts:
                return [layerA, layerB, 1]

        # Call the chi-squared function
        try:
            chi2, pValue, dof, expectedFreq = scipy.stats.chi2_contingency(table)
        except Exception:
            # We probably had all zeros for a column in the contingency table.
            # See <http://stats.stackexchange.com/q/73708>. Chi-squared can't be
            # done in this case.
            # http://docs.scipy.org/doc/scipy-0.16.0/reference/generated/scipy.stats.chi2_contingency.html#scipy.stats.chi2_contingency
            chi2 = pValue = dof = expectedFreq = 1

        return [layerA, layerB, sigDigs(pValue)]

    @staticmethod
    def bothContinuous(layerA, layerB, layers, hexNames):

        # This handles one attribute pair for layout-independent stats when
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
    def diffStatsContinuousFilter(layerA, layerB, layers):

        # Drop the lower and upper quartiles of continuous values to avoid
        # statistical significance in cases where most values are not actually
        # different between the two groups

        # Build a vector of hex names, sorted by their values
        dict = layers[layerB]
        hexes = sorted(dict, key=dict.get)

        # Drop the lower and upper quartiles from our list of hexes
        length = len(hexes)
        quartile = int(round(length / 4))
        upper = list(hexes)
        del upper[:length - quartile]
        lower = list(hexes)
        del lower[quartile:]

        # Remove the dropped hexes from the layers dict
        for hex in lower + upper:
            del layers[layerB][hex]

    @staticmethod
    def oneContinuousOneDiscrete(s, layerA, layerB, layers, hexNames, layerAtype,
        binary=False):

        # This handles one attribute pair for ignore-layout stats when only one
        # of the attributes has continuous values. Binary attributes are treated
        # as if they are categorical with two values when building the vectors.
        # Binary attributes may use a different stats library function than
        # categorical.

        if hasattr(s, 'diffStats'):
            s.diffStatsContinuousFilter(layerA, layerB, layers)

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
    def layoutIndependent(s, layerB, diffStat10percent):

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
                return s.bothContinuous(s.layerA, layerB, s.layers,
                    s.hexNames)

            # Handle the case where only one attribute is continuous
            else:
                if types.count('bin') > 0:
                    binary = True
                else:
                    binary = False
                sys.stdout.flush()
                return s.oneContinuousOneDiscrete(s, s.layerA, layerB, s.layers,
                    s.hexNames, s.layerAtype, (types.count('bin') > 0))

        # Is there any combination of binary and categorical?
        elif types.count('bin') == 2 \
            or types.count('cat') == 2 \
            or (types.count('bin') == 1 and types.count('cat') == 1):
            return s.bothDiscrete(
                s, s.layerA, layerB, s.layers, s.hexNames, diffStat10percent)

        # We should never get here.
        return 'continue'

    @staticmethod
    def layoutAware(s, layerB):

        # Note that all other downstream methods in this class are only for
        # layout-independent layers.

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

    @staticmethod
    def adjustPvalue(s, preAdjusted):

        try:
            # Some hosts do not have this library. If not we don't adjust
            import statsmodels.sandbox.stats.multicomp as multicomp
            adjust = True

        except Exception:
            adjust = False

        with open(s.file, 'w') as f:
            f = csv.writer(f, delimiter='\t')

            preAdjVals = []
            for i, row in enumerate(preAdjusted):

                if not adjust:

                    # No adjustment will happen so just write to the file
                    f.writerow(row + [float('NaN')])
                    continue

                # Extract the p-values from the data.
                # Layout-aware and -independent store their p-values in
                # the same position. Translate NaNs to one so the stats
                # routine will take it.
                if math.isnan(row[2]):
                    preAdjVals.append(1)
                else:
                    preAdjVals.append(row[2])

            if not adjust:
                return

            try:
                # Benjamini-Hochberg FDR correction for p-values returns:
                #   [reject, p_vals_corrected, alphacSidak, alphacBonf]
                # http://statsmodels.sourceforge.net/devel/generated/statsmodels.sandbox.stats.multicomp.multipletests.html#statsmodels.sandbox.stats.multicomp.multipletests
                reject, adjPvals, alphacSidak, alphacBonf = multicomp.multipletests(preAdjVals, alpha=0.05, method='fdr_bh')

            except Exception:
                adjPvals = [float('NaN') for x in preAdjVals]

            for i, row in enumerate(preAdjusted):
                f.writerow(row + [sigDigs(adjPvals[i])])

    def __call__(s):

        # Compare each layer against the given layer
        preAdjusted = []

        if hasattr(s, 'windowNodes'):

            # for layout-aware stats
            for layerB in s.statsLayers:

                # We don't want to compare a layer to itself
                if s.layerA == layerB: continue

                line = s.layoutAware(s, layerB)
                if line == 'continue': continue
                
                preAdjusted.append(line)

        else:

            # for layout-independent stats

            if hasattr(s, 'diffStats'):

                # Find the group with the lowest count of hexagons
                # & save 10% of that for later comparisons
                ones = filter(lambda x: x == 1, s.layers[s.layerA].values())
                zeros = filter(lambda x: x == 0, s.layers[s.layerA].values())
                diffStat10percent = min(len(ones), len(zeros)) / 10
            else:
                diffStat10percent = 'na'

            for layerB in s.statsLayers:

                line = s.layoutIndependent(s, layerB, diffStat10percent)
                if line == 'continue': continue

                preAdjusted.append(line)

        s.adjustPvalue(s, preAdjusted)

        # For dynamic stats, pass the results file name to the caller via stdout
        if hasattr(s, 'dynamic'):
            print json.dumps(s.file)

        return 0
