#!/usr/bin/env python2.7
"""
statsLayer.py
Object for generating one layer's sort stats for layout-aware & 
layout-independent and for both pre-computed and dynamic stats
"""

import sys, os, json, copy, csv, math, operator, traceback, pprint
import scipy.stats
import numpy
from utils import sigDigs

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
            # One of either temp_dir or layerIndex should be provided
            if 'tempFile' in parm:

               s.file = parm['tempFile']
               s.dynamic = True
            else:

                # layerIndex was provided, probably from the precomputed stats
                filename = 'stats_' + str(parm['layerIndex']) + '.tab'
                s.file = os.path.join(parm['directory'], filename)

    """
    # not used anymore
    @staticmethod
    def findSignificancyCutoff(s, layerName):

        # For a binary layer, find the lowest count of hexagons in a category
        # and return 10% of that. For a categorial or continuous return infinity
        if layerName in s.binLayers:
            ones = filter(lambda x: x == 1, s.layers[layerName].values())
            zeros = filter(lambda x: x == 0, s.layers[layerName].values())
            return min(len(ones), len(zeros)) / 10
        else:
            return float('inf')
    
    @staticmethod
    def hasEnoughCounts(s, table, layerB):

        # Any pair combination outside of binary-binary always returns true
        if not (s.layerA in s.binLayers and layerB in s.binLayers):
            return True

        # For binary-binary pairs we want to prevent finding high statistical
        # significance when there are only a few counts of an attribute value.
        # In the contingency table, if the biggest count of the cells is less
        # than 10% of the sample count of the smallest of the attribute values
        # we don't want to compute stats for that attribute pair.

        # Include both attributes when looking for the smallest value count
        significancyCutoffB = s.findSignificancyCutoff(s, layerB)
        cutoff = min(s.significancyCutoffA, significancyCutoffB)

        # Find the biggest count of nodes in a single cell in the table.
        biggest = 0;
        for row in table:
            for cell in row:
                biggest = max(biggest, cell)

        # Return true if the biggest cell count is greater than the cutoff
        return (biggest > cutoff)
    """

    @staticmethod
    def bothDiscrete(s, layerA, layerB, layers, hexNames):

        # This handles one attribute pair for layout-independent stats when both
        # attributes have any combination of binary and categorical values

        # Find the ranges of layer A & B.
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

        DEBUG = False
        if DEBUG and layerB == 'BRCA Subtype':
            # Capture the contingency table
            fname = '/cluster/home/swat/tmpDebug' #'/cluster/home/swat/tmpDebug'
            file = open(fname, 'w')
            f = csv.writer(file, delimiter='\t')
            for row in table:
                f.writerow(row)
            f.writerow(['checking for enough counts in the table'])
        
        if DEBUG and layerB == 'BRCA Subtype':
            f.writerow(['there ARE enough counts in the table'])
            file.close()
        
        # Run different a different test if both layers are binary
        if hasattr(s, 'binLayers') and layerA in s.binLayers and layerB in s.binLayers:

            # Both layers are binary so call the Fisher exact test function
            # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.fisher_exact.html
            try:
                oddsratio, pValue = scipy.stats.fisher_exact(table)
            except Exception:
                pValue = float('NaN')
        else:

            # Both layers are not binary so call the chi-squared function
            # http://docs.scipy.org/doc/scipy-0.16.0/reference/generated/scipy.stats.chi2_contingency.html#scipy.stats.chi2_contingency
            try:
                chi2, pValue, dof, expectedFreq = scipy.stats.chi2_contingency(table)
                # the below lambda parm is not available in v17 of scipy.stats, the one we're using but is available in v15.
                #chi2, pValue, dof, expectedFreq = scipy.stats.chi2_contingency(table, lambda_='log-likelyhood')
            except Exception:
            
                # We probably had all zeros for a column in the contingency table.
                # See <http://stats.stackexchange.com/q/73708>. Chi-squared can't be
                # done in this case.
                pValue = float('NaN')

        return [layerB, sigDigs(pValue)]

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
            pValue = float('NaN')

        return [layerB, sigDigs(pValue)]

    @staticmethod
    def oneContinuousOneCategorical(s, layerA, layerB, layers, hexNames):

        # This handles one attribute pair for layout-independent stats when one
        # of the attributes is continuous and the other categorical.

        # Assign new names to the layers depending on which is continuous.
        if layerA in s.contLayers:
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

        try:
            # Kruskal-Wallis H-test for independent samples returns like so:
            #     [Kruskal-Wallis_H_statistic, pValue]
            # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.f_oneway.html

            # Create a string to evaluate to make the call because we have
            # a variable number of lists to pass in
            stat, pValue = eval('scipy.stats.mstats.kruskalwallis(' + str(lists)[1:-1] + ')')
        except Exception:
            pValue = float('NaN')

        return [layerB, sigDigs(pValue)]

    @staticmethod
    def oneContinuousOneBinary(contLayers, layerA, layerB, layers, hexNames):

        # This handles one attribute pair for layout-independent stats when one
        # of the attributes is continuous and the other binary.

        # Assign the new variable names to the layers depending on which is
        # continuous
        if layerA in contLayers:
            contL = layerA
            binL = layerB
        else:
            contL = layerB
            binL = layerA

        # Generate a list of lists that contains only values present in both of
        # the attributes for each of the hexagons. This list looks like the
        # below, where each hexagon's list contains the binary value, then the
        # continuous value.
        #   [
        #       [0, 4.3452],
        #       [1, 5.73453],
        #       ...
        #   ]
        DEBUG = False

        if DEBUG and contL != 'GP17_Basal signaling program':
            DEBUG = False
            fname = '/cluster/home/swat/tmpDebug'
            file = open(fname, 'w')
            f = csv.writer(file, delimiter='\t')
            f.writerow(['#node', binL, contL])

        hexKeyVals = []
        for hexagon in hexNames:

            # Look for this hexagon's value in the binary layer
            if hexagon in layers[binL]:
                binVal = int(layers[binL][hexagon])
            else:
                # No value in the binary layer, so ignore this hexagon
                continue

            # Look for this hexagon's value in the continuous layer
            if hexagon in layers[contL]:
                contVal = layers[contL][hexagon]
            else:
                # No value in the continuous layer, so ignore this hexagon
                continue

            hexKeyVals.append([binVal, float(contVal)])
            if DEBUG: f.writerow([hexagon, binVal, float(contVal)])

        # Build two vectors. Each vector will contain the continuous values
        # associated with one binary value, with the cutoffs applied, inclusive.
        lists = [[], []]
        for x in hexKeyVals:
            lists[x[0]].append(x[1])

        if DEBUG:
            f.writerow(['#lists[0]'])
            for i in range(len(lists[0])):
                f.writerow([lists[0][i]])
            f.writerow(['#lists[1]'])
            for i in range(len(lists[1])):
                f.writerow([lists[1][i]])

        if len(lists[0]) == 0 or len(lists[1]) == 0:
        
            # With no values in one of the lists,
            # no good stats will come of this
            return [layerB, float('NaN')]

        try:
            # Ranksums test returns like so [statistic, p-value]
            # For continuity correction see scipy.stats.mannwhitneyu.
            # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ranksums.html
            
            statistic, pValue = scipy.stats.ranksums(lists[0], lists[1])

        except Exception:
            if DEBUG: f.writerow(['exception on lib call'])
            pValue = float('NaN')

        if DEBUG:
            f.writerow(['#attribute', 'pValue', 'adjPvalue'])
            f.writerow([contL, pValue, 'adjPvalue'])
            file.close()

        return [layerB, sigDigs(pValue)]

    @staticmethod
    def layoutIndependent(s, layerB):

        # If layerA is layerB, we want to write a value of nan at the p-value
        # so it will not be included in the sort in visualization
        if s.layerA == layerB:
            return [layerB, float('NaN')]

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
                return s.bothContinuous(s.layerA, layerB, s.layers, s.hexNames)

            # Is one continuous and one binary?
            elif types.count('bin') > 0:
                return s.oneContinuousOneBinary(
                    s.contLayers, s.layerA, layerB, s.layers, s.hexNames)

            else: # One is continous and one categorical
                return s.oneContinuousOneCategorical(
                    s, s.layerA, layerB, s.layers, s.hexNames)
        else:

            # This must be some combination of binary and categorical
            return s.bothDiscrete(s, s.layerA, layerB, s.layers, s.hexNames)

    @staticmethod
    def layoutAware(s, layerB):

        # Initialize the counts for the layers to the additives in C2
        A = copy.copy(s.windowAdditives)
        B = copy.copy(A)

        # Find nodes with an attribute value of one.
        # Nodes are the x,y coordinates of hexagons before squiggling
        
        #YN 20160802: changed to only compute layout aware stats for pairs of binary attributes where the counts of value 1 are comparable in both attributes
        #keep track of total counts of value 1 in the attributes A and B:
        total_a = 0
        total_b = 0
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
                
                #YN 20160802: changed to only compute layout aware stats for pairs of binary attributes where the counts of value 1 are comparable in both attributes
                #keep track of total counts of value 1 in the attributes A and B:
                if a: total_a += 1	#increment if a has 1
                if b: total_b += 1	#increment if b has 1

        #YN 20160802: changed to only compute layout aware stats for pairs of binary attributes where the counts of value 1 are comparable in both attributes
        #if number of 1s in attribute B is at least 5% of number of 1s in attribute A then compute stats, else skip:
        ratio = float(total_b) / float(total_a)
        if ratio >= 0.05:
            try:
                # Call the stats library function
                # Pearson call returns like so:
                #   [Pearsons-correlation-coefficient, 2-tailed-p-value]
                # http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html
                correlation, pValue = scipy.stats.pearsonr(A, B)
            except Exception:
                correlation = float('NaN')
                pValue = float('NaN')
        else:
            correlation = float('NaN')
            pValue = float('NaN')

        return [layerB, sigDigs(correlation), sigDigs(pValue)]

    @staticmethod
    def adjustPvalue(s, preAdjusted, layoutAware):

        if layoutAware:
            idx = 2
        else:
            idx = 1

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

                    # No adjustment will happen so just write a NaN value to
                    # the file so the UI won't try to display this value
                    f.writerow(row + [float('NaN')])
                    continue

                # Extract the p-values from the data.
                # Skip NaNs so the stats routine will take it.
                if not math.isnan(row[idx]):
                    preAdjVals.append(row[idx])
            
            if not adjust:
                return

            try:
                # Benjamini-Hochberg FDR correction for p-values returns:
                #   [reject, p_vals_corrected, alphacSidak, alphacBonf]
                # http://statsmodels.sourceforge.net/devel/generated/statsmodels.sandbox.stats.multicomp.multipletests.html
                reject, adjPvals, alphacSidak, alphacBonf = multicomp.multipletests(preAdjVals, alpha=0.05, method='fdr_bh')

            except Exception:
                adjPvals = [float('NaN') for x in preAdjusted]

            try:
                # Bonferroni correction for p-values returns:
                #   [reject, p_vals_corrected, alphacSidak, alphacBonf]
                # http://statsmodels.sourceforge.net/devel/generated/statsmodels.sandbox.stats.multicomp.multipletests.html
                reject, adjPvalsB, alphacSidak, alphacBonf = multicomp.multipletests(preAdjVals, alpha=0.05, method='bonferroni')

            except Exception:
                adjPvalsB = [float('NaN') for x in preAdjusted]

            #need an iterator so we can skip NaN values
            adjPiter = 0
            for i, row in enumerate(preAdjusted):
                #if the original p-value was NaN then so are the corrected.
                if math.isnan(row[idx]):
                    f.writerow(row + [sigDigs(float('NaN')), sigDigs(float('NaN'))])
                else:
                    f.writerow(row + [sigDigs(adjPvals[adjPiter]), sigDigs(adjPvalsB[adjPiter])])
                    adjPiter += 1

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

            s.adjustPvalue(s, preAdjusted, True)

        else:

            # for layout-independent stats
 
            # unused:
            #s.significancyCutoffA = s.findSignificancyCutoff(s, s.layerA)
            
            for layerB in s.statsLayers:

                if s.layerA == layerB: continue
                
                line = s.layoutIndependent(s, layerB)
                if line == 'continue': continue

                preAdjusted.append(line)

            s.adjustPvalue(s, preAdjusted, False)

        # For dynamic stats, pass the results file name to the caller
        if hasattr(s, 'dynamic'):
            return s.file

        return 0
