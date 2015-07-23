#!/usr/bin/env python2.7
"""
pearson.py provides the functionality to compute pearson-correlation 
coefficients (r-values) from two layer arrays. We are seperating this function
from the hexagram.py file so that we can parallelize the computations.
""" 
import argparse, sys, os, itertools, math, numpy, subprocess, shutil, tempfile
import traceback, numpy
import scipy.stats
import os.path
import tsv

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
    args[2] = 'subprocess_string' - string containing sets of four values.
               The four value are "layer1 index, layer 2 index, cont layer 1
               index, cont layer 2 index;..."
    args[3] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file
    """

    # Parse the arguments
    directory = args[1]
    file_index = args[3]

    # Currently the subprocess string is of the format:
    # "index1,index2;index1,index3;"
    # Split it such that ["index1,index2", "index1,index3"]
    list_of_index_pairs = args[2].split(";")

    # Now split each element in list_of_index_pairs such that:
    # [ [index1, index2], [index1, index 3]]
    cont_indices_repeated = []
    for pair in list_of_index_pairs:
        cont_indices_repeated.append(pair.split(","))

    # We want to parse out the requisite rows from the cont_values.tab file
    # Before we do so, we want a single list of layers that we shall need.
    # This way we won't create multiples of the same rows.
    cont_indices_single = []
    for pair in cont_indices_repeated:
        index1 = pair[0]
        index2 = pair[1]
        if index1 not in cont_indices_single:
            cont_indices_single.append(int(index1))
        if index2 not in cont_indices_single:
            cont_indices_single.append(int(index2))  

    # Debugging:
    print ('cont_indices_single: ', cont_indices_single)

    # Parse the cont_values.tab file for appropriate values
    continuous_layers = [None] * len(cont_indices_single)
    continuous_values = [None] * len(cont_indices_single)
    values_reader = tsv.TsvReader(open(os.path.join(directory, "cont_values.tab"), "r"))

    value_iterator = values_reader.__iter__()

    for index, layer in enumerate(value_iterator):
        if index in cont_indices_single:
            continuous_layers.insert (index ,layer[:2])
            print ('continuous_layers: ', continuous_layers)
            current_values = []
            current_values = map(float, layer[2:])
            print ('current_values: ', current_values)
            continuous_values.insert(index, current_values)

    # Compute correlation coefficients & print to file.
    # Write all pearson correlation coefficients computed to a file.
    # pearson_values_<file_index>.tab
    r_val_writer = tsv.TsvWriter(open(os.path.join(directory, "pearson_values_"+ file_index + ".tab"), "w"))
    for pair in cont_indices_repeated:
        index1 = int(pair[0])
        index2 = int(pair[1])
        layer1_val = continuous_values[index1]
        layer2_val = continuous_values[index2]

        # We remove all windows that have 0s as they had no samples with
        # values for the attribute/layer.
        if 0 in layer1_val or 0 in layer2_val:
            a1 = []
            a2 = []
            for m_index, mean in enumerate (layer1_val):
                if mean != 0 and layer2_val[m_index] != 0:
                    a1.append(mean)   
                    a2.append(layer2_val[m_index])
            layer1_val = a1
            layer2_val = a2

        # Compute R Coefficient & P-Value
        pearson_val = scipy.stats.pearsonr(layer1_val,layer2_val)
        # Take Absolute Value Because We Want to Know All Correlations
        # Positive and Negative
        r_val = pearson_val[0]

        # Write a new line to the output file in the following format:
        # Layer1 Name	Layer2 Name	Continuous Index1	Continuous Index2	R-Coeff
        r_val_writer.line(continuous_layers[index1][0], continuous_layers[index2][0],
        continuous_layers[index1][1], continuous_layers[index2][1], r_val)
    
    r_val_writer.close()

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
