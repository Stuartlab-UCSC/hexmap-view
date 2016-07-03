#!/usr/bin/env python2.7
"""
pearson.py provides the functionality to compute pearson-correlation 
coefficients (r-values) from two layer arrays. We are seperating this function
from the hexagram.py file so that we can parallelize the computations.
""" 
import argparse, sys, os, itertools, math, numpy, subprocess, shutil, tempfile
import traceback, numpy, pprint
import scipy.stats
import os.path
import tsv, csv

def pearson (args):
    """
    This tool will compute pearson correlation coefficients by comparing
    the values found in two specific layers.
    This tool has been constructed so that pearson correlation tests may run in 
    parallel.

    args[] = 'python'
    args[0] = 'pearson.py'
    args[1] = 'subprocess_string' - string containing pairs of index values:
               layer-1, layer-2
               we're using var names of lx1, lx2, respectively
    args[2] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file
    args[3[ = 'file_index'- TODO which file?
    """

    # Parse the arguments
    directory = args[1]
    file_index = args[3]

    # Convert the subprocess string into a list of pairs
    index_pairs = []
    for pair in args[2].split(";"):
        index_pairs.append(pair.split(","))

    #print 'index_pairs:', index_pairs

    # We want to parse out the requisite rows from the cont_values.tab file
    # Before we do so, we want a single list of layers that we shall need.
    # This way we won't create multiples of the same rows.
    uniq_layers = set()

    for pair in index_pairs:
        uniq_layers.add(pair[0])
        uniq_layers.add(pair[1])

    uniq = dict([])

    uniq_layers = list(uniq_layers)
    for i, u in enumerate(uniq_layers):
        uniq[u] = ''

    # Find the layers of interest in the cont_values.tab file
    with open(os.path.join(directory, "cont_values.tab"), 'rU') as reader:
        reader = csv.reader(reader, delimiter='\t')

        value_iterator = reader.__iter__()

        for i, layer in enumerate(value_iterator):
            ulx = str(layer[1:2][0])
            if ulx in uniq.keys():
                uniq[ulx] = float(layer[2:][0])

    # Write all pearson correlation coefficients computed to a file.
    with open(os.path.join(directory, 'layer_' + file_index + base + '_.tab'),
        'w') as writer:
        writer = csv.writer(writer, delimiter='\t')
        for pair in index_pairs:

            # We remove all windows that have 0s as they had no samples with
            # values for the attribute/layer.
            lx1 = pair[2]
            lx2 = pair[3]
            #print 'lx1, lx2, uniq:', lx1, lx2, uniq
            val1 = uniq[lx1]
            val2 = uniq[lx2]
            if val1 != 0 and val2 != 0:

                # Compute R Coefficient & P-Value, ignoring the P-Value
                pearson_val = scipy.stats.pearsonr([val1], [val2])
                # Take Absolute Value Because We Want to Know All Correlations
                # Positive and Negative
                r_val = pearson_val[0]

                # Write a new line to the output file in the following format:
                # Continuous Index1	Continuous Index2	R-Coeff
                #print 'lx1, lx2, val1, val2, r_val:',lx1, lx2, val1, val2, r_val
                writer.writerow([lx1, lx2, r_val])

    return 0

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = pearson(sys.argv)
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
