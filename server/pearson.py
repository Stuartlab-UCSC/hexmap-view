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

def main (args):
    """
    This tool will compute pearson correlation coefficients by comparing
    the values found in two specific layers.
    This tool will be run within the hexagram.py and has been constructed
    so that all pearson correlation tests may run in parallel, so that compute
    time is shorter and memory will no longer be an issue.

    args[] = 'python'
    args[0] = 'pearson.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four index values:
               layer-1, layer-2, pearson-layer-1, pearson-layer-2; ..."
               we're using var names of lx1, lx2, slx1, slx2
    args[3] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file
    """

    # Parse the arguments
    directory = args[1]
    file_index = args[3]

    # Convert the subprocess string into a list of lists
    index_quads = []
    for quad in args[2].split(";"):
        index_quads.append(quad.split(","))

    #print 'index_quads:', index_quads

    # We want to parse out the requisite rows from the cont_values.tab file
    # Before we do so, we want a single list of layers that we shall need.
    # This way we won't create multiples of the same rows.
    uniq_layers = set()

    # Note that quad[0] & quad[1] are not used in this file
    for quad in index_quads:
        uniq_layers.add(quad[2])
        uniq_layers.add(quad[3])

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
    # pearson_values_<file_index>.tab
    with open(os.path.join(directory, "pearson_values_"+ file_index + ".tab"), "w") as writer:
        writer = csv.writer(writer, delimiter='\t')
        for quad in index_quads:

            # We remove all windows that have 0s as they had no samples with
            # values for the attribute/layer.
            slx1 = quad[2]
            slx2 = quad[3]
            #print 'slx1, slx2, uniq:', slx1, slx2, uniq
            val1 = uniq[slx1]
            val2 = uniq[slx2]
            if val1 != 0 and val2 != 0:

                # Compute R Coefficient & P-Value, ignoring the P-Value
                pearson_val = scipy.stats.pearsonr([val1], [val2])
                # Take Absolute Value Because We Want to Know All Correlations
                # Positive and Negative
                r_val = pearson_val[0]

                # Write a new line to the output file in the following format:
                # Continuous Index1	Continuous Index2	R-Coeff
                #print 'slx1, slx2, val1, val2, r_val:',slx1, slx2, val1, val2, r_val
                writer.writerow([slx1, slx2, r_val])

    return 0

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = main(sys.argv)
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
