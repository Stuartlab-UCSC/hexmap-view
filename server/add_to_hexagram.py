#!/usr/bin/env python2.7
"""
hexagram.py: Given a matrix of similarities, produce a hexagram visualization.

This script takes in the filename of a tab-separated value file containing a
sparse similarity matrix (with string labels) and several matrices of
layer/score data. It produces an HTML file (and several support files) that
provide an interactive visualization of the items clustered on a hexagonal grid.

This script depends on the DrL graph layout package, binaries for which must be
present in your PATH.

Re-uses sample code and documentation from 
<http://users.soe.ucsc.edu/~karplus/bme205/f12/Scaffold.html>
"""

import argparse, sys, os, itertools, math, numpy, subprocess, shutil, tempfile, re
import collections, multiprocessing, traceback, numpy, time
import scipy.stats, scipy.linalg
import os.path
import tsv

def parse_args(args):
    """
    Takes in the command-line arguments list (args), and returns a nice argparse
    result with fields for all the options.
    Borrows heavily from the argparse documentation examples:
    <http://docs.python.org/library/argparse.html>
    """
    
    # The command line arguments start with the program name, which we don't
    # want to treat as an argument for argparse. So we remove it.
    args = args[1:]
    
    # Construct the parser (which is stored in parser)
    # Module docstring lives in __doc__
    # See http://python-forum.com/pythonforum/viewtopic.php?f=3&t=36847
    # And a formatter class so our examples in the docstring look good. Isn't it
    # convenient how we already wrapped it to 80 characters?
    # See http://docs.python.org/library/argparse.html#formatter-class
    parser = argparse.ArgumentParser(description=__doc__, 
        formatter_class=argparse.RawDescriptionHelpFormatter)
    
    # Now add all the options to it
    # Options match the ctdHeatmap tool options as much as possible.
    parser.add_argument("--visualization", dest="old_dir", type=str,
        help="the pre-existing visulization file")
    parser.add_argument("--patient", type=str,
        help="the new data to visualize")
    parser.add_argument("--type", type=str,
        help="the data types of the raw data matrices")
    parser.add_argument("--html", "-H", type=str, 
        default="index.html",
        help="where to write HTML report")
    parser.add_argument("--directory", "-d", type=str, default=".",
        help="directory in which to create other output files")
        
    return parser.parse_args(args)

def process_raw_data(raw_data, old_html_dir, options):
    """
    This function receives the file containing raw genomic data that the user
    wants to map to the pre-existing visulization & the location of
    pre-existing visualization files. We will parse this new data file
    placing the rows in an order defined by the genes tab from the pre-existing
    visualization. This way we generate a mutable numpy matrix of raw patient
    data and have the genes in the required by the transform matrix,
    U^T, & S matrices.
    """
    # Create the file paths for the required files
    genes_file_loc = os.path.join(old_html_dir, "genes.tab")
    s_matrix_file_loc = os.path.join(old_html_dir, "S.tab")
    u_t_matrix_file_loc = os.path.join(old_html_dir, "U_T.tab")
    beta_matrix_file_loc = os.path.join(old_html_dir, "beta.tab")
    assignments_file_loc = os.path.join(old_html_dir, "assignments0.tab")

    # First open the genes file.
    genes_reader = tsv.TsvReader(open(genes_file_loc, 'r')) 

    # This holds an iterator over lines in that file
    genes_iterator = genes_reader.__iter__()

    # Extract data type of the pre-existing visualization & the list of genes
    old_data_type = genes_iterator.next()
    print ("Previous Data Type", old_data_type)

    # First see of the new data and the old data are of compatible data types
    new_data_type = options.type
    old_genes_list = []
    # If they are the same data type add the genes to a python list
    if old_data_type[0] == new_data_type:
        print ("Same Data Types")
        old_genes_list = genes_iterator.next()
        genes_reader.close()

        # First open the raw data file.
        raw_data_reader = tsv.TsvReader(open(raw_data, 'r')) 
        # This holds an iterator over lines in that file
        raw_data_iterator = raw_data_reader.__iter__()

        sample_names = raw_data_iterator.next()
        sample_names = sample_names[1:]
        num_samples = len(sample_names)
        new_genes_list = []
        for row in raw_data_iterator:
            new_gene = row[0]
            new_genes_list.append(new_gene)
        raw_data_reader.close() 

        # Get the number of new samples & number of old genes to create 
        # a new numpy data matrix
        print ("Number of New Samples:", num_samples)
        num_new_genes = len(new_genes_list)
        print ("Number of New genes:", num_new_genes)

        # Re-Initialize the data iterator
        # This holds an iterator over lines in that file
        raw_data_reader = tsv.TsvReader(open(raw_data, 'r')) 
        raw_data_iterator = raw_data_reader.__iter__()
        # Skip the first line which is simple a row of headers
        raw_data_iterator.next()
        
        # Next we have to dump all the valus from the file into a numpy matrix
        # The values will be unsorted. We will then have to sort the rows of the
        # numpy matrix according to the order prescribed by old_genes_list         
        raw_data_matrix_unsorted = numpy.zeros(shape=(num_new_genes, num_samples))
        for rindex, row in enumerate (raw_data_iterator):
            # Cut off the first value of each row. It is simply the gene name.
            only_values = row[1:]
            # Place the data from only_values into the appropriate row in
            # raw_data_matrix.
            for cindex, col in enumerate (only_values):
                 raw_data_matrix_unsorted [rindex][cindex] = only_values[cindex]

        # For every gene in old_genes_list search the new_genes_list for the
        # the appropriate index. Then use this index to find the values in 
        # the unsorted data matrix and copy them a new sorted matrix.
        # This new matrix will be used the compute the (x,y) coordinates
        # needed to map the new samples. 
        num_old_genes = len(old_genes_list)

        #Debugging
        num_no_data = 0

        raw_data_matrix_sorted = numpy.zeros(shape=(num_old_genes, num_samples))
        for rindex, gene in enumerate(old_genes_list):
             # Find the index of the desired gene in the new_genes_list
             # This index will corrrespond to the row in the raw_data_matrix_unsorted
             # that we want to extract and place in the raw_data_matrix_sorted
             try:
                 gene_index = new_genes_list.index(gene)
                 extracted_data_row = raw_data_matrix_unsorted[gene_index]
                 # Iterate over the extracted row to place the values in the appropriate row
                 # of the sorted data matrix.
                 for cindex, col in enumerate (extracted_data_row):
                     raw_data_matrix_sorted[rindex][cindex] = extracted_data_row[cindex]
             except ValueError:
                 num_no_data += 1
        print ("Number of genes with no data", num_no_data)

        # Open up S matrix, U^T, and Betas for x,y coordinate computation
        # First open the matrix file.
        s_reader = tsv.TsvReader(open(s_matrix_file_loc, 'r')) 
        u_t_reader = tsv.TsvReader(open(u_t_matrix_file_loc, 'r')) 
        beta_reader = tsv.TsvReader(open(beta_matrix_file_loc, 'r')) 
    
        # Next create iterators to traverse the files
        s_iterator = s_reader.__iter__()
        u_t_iterator = u_t_reader.__iter__()
        beta_iterator = beta_reader.__iter__()    
        
        # Create an array for s_values & create a diagonal matrix from it
        s_values = s_iterator.next()
        float_s_values = []
        for value in s_values:
            v = float(value)
            float_s_values.append(v)
        s_values = float_s_values

        print ("S_values", s_values)
        s_diag = numpy.diag(s_values)
        print (s_diag)

        # Create a numpy matrix for u_t (number of principal components * number of genes)
        u_t = numpy.zeros(shape=(len(s_values), num_old_genes))
        for rindex, row in enumerate (u_t_iterator):
            for cindex, col in enumerate (row):
                u_t[rindex][cindex] = float(row[cindex])

        # Create a numpy matrix for the betas (number of principal components * 2)
        betas = numpy.zeros(shape=(len(s_values), 2))
        for rindex, row in enumerate(beta_iterator):
            for cindex, col in enumerate (row):
                betas[rindex][cindex] = float(row[cindex])
        betas = numpy.transpose(betas)
 
        # Compute new coordinates       
        coords = betas * (numpy.asmatrix(s_diag) * numpy.asmatrix(u_t) * numpy.asmatrix(raw_data_matrix_sorted))
        print ("Coordinates")
        print (coords)

        coords = numpy.transpose(coords)
        # Add to existing "assignments.tab" file     
        assignments_writer = tsv.TsvWriter(open(assignments_file_loc, 'a'))       
        for rindex, sample in enumerate (sample_names):
            print ("Cindex", cindex)
            x = str(coords[rindex, 0])
            y = str(coords[rindex, 1])
            print (sample, x, y)
            assignments_writer.line(sample, x, y)

        assignments_writer.close()

    else:
        raise Exception ("Pre-existing Visualization employs ", old_data_type, 
        " data. Data to me mapped is of ", new_data_type, ". Data Types must be the same.")

    return True

def main(args):
    """
    Parses command line arguments, and makes visualization.
    "args" specifies the program arguments, with args[0] being the executable
    name. The return value should be used as the program's exit code.
    """
    # This holds the nicely-parsed options object
    options = parse_args(args) 
    print ("Created Options:", options)
    
    # First bit of stdout becomes annotation in Galaxy 
    # Make sure our output directory exists.
    if not os.path.exists(options.directory):
        # makedirs is the right thing to use here: recursive
        os.makedirs(options.directory)

    # Open the Provided HTML Directory. This contains the pre-existing
    # Hexagram Visualization. 
    old_html_dir = options.old_dir

    # Change the extension to get the actual directory
    dat_index = old_html_dir.index(".dat")
    old_html_dir = old_html_dir[:dat_index] + "_files"

    # Configure the old the html directory so that its files can be accessed
    # and modified.
    old_html_dir_elements = os.listdir(old_html_dir)
    old_html_dir = old_html_dir + '/'
    print (old_html_dir)

    process_raw_data(options.patient, old_html_dir, options)
    
    # Copy the files from the old html directory to the new one.
    for filename in old_html_dir_elements:
        file_loc = os.path.join(old_html_dir, filename)
        shutil.copy2(file_loc, options.directory)

    # Now copy the HTML file to our output file. It automatically knows to read
    # assignments.tab, and does its own TSV parsing
    tool_root = os.path.dirname(os.path.realpath(__file__))
    shutil.copy2(os.path.join(tool_root, "hexagram.html"), options.html)  
  
    print "Visualization generation complete!"
       
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
