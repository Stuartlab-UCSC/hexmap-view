#!/usr/bin/env python2.7
"""
chi.py is used to parallelize computations for association statistics via
chi-squared contingency table calculations.
""" 
import argparse, sys, os, numpy, traceback
import scipy.stats
import tsv

def significantDigits(x, sig=6):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")
    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    return float(format % x)

def chi2onePair(layerA, layerB, layers, hexNames):

    def reportEmptyLayer(layer):
        # For pre-computed stats, write any layer name
        # who has no values to a file, to report later
        if hasattr(s, 'file'):
            with open(os.path.join(s.directory, 'empty_layers.tab'), 'w+') as f:
                f.writerow(layer + ' \n')

    # Find the ranges of layer A & B
    # This is silly for binary data, but good for categorical data
    vals = layers[layerB].values()
    if len(vals) < 1:
        reportEmptyLayer(layerB)
        return 0
    bMax = int(max(vals))
    bMin = int(min(vals))

    vals = layers[layerA].values()
    aMax = int(max(vals))
    aMin = int(min(vals))

    # Initialize the contingency table
    table = [[0 for i in range(bMax - bMin + 1)] for j in range(aMax - aMin + 1)]

    # TODO can we make two vectors of A & B rather than a contingency table?
    #      Especially if other stats algorithms use two vectors
    #      one-way t-test & one-way anova
    
    # Count the number of each value in each of the two layers. If the
    # hexagon is found in both layers, increment the contingency table count.
    for hexagon in hexNames:

        has_data = True
        try:
            aVal = int(layers[layerA][hexagon])
        except KeyError:
            # this means this hexagon has no value in this layer
            has_data = False

        try:
            bVal = int(layers[layerB][hexagon])
        except KeyError:
            # this means this hexagon has no value in this layer
            has_data = False

        if has_data == True:
            table[aVal - aMin][bVal - bMin] += 1

    # Call the chi-squared function
    try:
        _, p, _, _ = scipy.stats.chi2_contingency(table)

    except ValueError:
        # We probably had all zeros for a column in the contingency table.
        # See <http://stats.stackexchange.com/q/73708>. Chi-squared can't be
        # done in this case, so we make p NaN.
        p = float("NaN")

    return [layerA, layerB, significantDigits(p)]
