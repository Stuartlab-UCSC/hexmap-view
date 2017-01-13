#!/usr/bin/env python2.7
#Yulia Newton
#python2.7 compute_pivot_vs_background.py --in_pivot temp.json --in_meta meta.json --out_file out.tab --log log.tab --num_jobs 0 --neighborhood_size 6

import optparse, sys, os
import operator
import numpy
import sklearn
from sklearn import metrics
import time
import json
import multiprocessing
import warnings
import traceback

VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming','jaccard','rogerstanimoto']

def parse_args(args):
    parser = optparse.OptionParser()
    parser.add_option("--in_pivot", dest="in_pivot", action="store", default="", help="")
    parser.add_option("--in_meta", dest="in_meta", action="store", default="", help="")
    parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
    parser.add_option("--log", dest="log", action="store", default="", help="")
    parser.add_option("--num_jobs", dest="num_jobs", action="store", default="0", help="http://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.pairwise_distances.html")    
    parser.add_option("--neighborhood_size", dest="neighborhood_size", action="store", default="6", help="")
    opts, args = parser.parse_args()
    return (opts);

""" Unused
def read_tabular(input_file, numeric_flag):
    data = open(input_file, 'r')
    init_matrix = []
    col_headers = []
    row_headers = []
    line_num = 1
    for line in data:
        line_elems = line.strip().split("\t")
        if line_num == 1:
            col_headers = line_elems[1:]
        else:
            row_headers.append(line_elems[0])
            features = line_elems[1:]
            features = [x if x != "NA" else "0" for x in features]
            features = [x if len(x) != 0 else "0" for x in features]
            features = [x if x != "0.0000" else "0" for x in features]
            init_matrix.append(features)
            
        line_num += 1
    data.close()
    
    if numeric_flag:
        #matrix = [map(float,x) for x in init_matrix]
        matrix = [[float(y) for y in x] for x in init_matrix]
    else:
        matrix = init_matrix
    
    return (matrix, col_headers, row_headers)
"""

def read_tabular2(input_file, numeric_flag):
    with open(input_file,'r') as f:
        lines = [l.rstrip('\n').split('\t') for l in f]
        
    col_headers = lines[0][1:]
    row_headers = [l[0] for l in lines[1:]]
    if numeric_flag:
        #dt = [map(float,l[1:]) for l in lines[1:]]
        dt = [[float(y) for y in x[1:]] for x in lines[1:]]
    else:
        dt = [l[1:] for l in lines[1:]]
    
    return (dt, col_headers, row_headers)
    
def load_pivot_data(data, numeric_flag, opts):

    data = byteify(data)
    map = data["map"]
    layout = data["layout"]
    dt = data["nodes"]
    col_headers = dt.keys()
    row_headers = dt[col_headers[0]].keys()
    init_matrix = [list(dt[sample].values()) for sample in col_headers]
    
    if numeric_flag:
        matrix = [[float(y) for y in x] for x in init_matrix]
    else:
        matrix = init_matrix
    
    result = [list(i) for i in zip(*matrix)]
    #result = numpy.transpose(matrix)
    return (result, col_headers, row_headers, map, layout)

def byteify(input):
    if isinstance(input, dict):
        return {byteify(key): byteify(value)
            for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input

def main(opts):
    start_time = time.time()

    #process input arguments:
    pivot_data = opts.pivot_data
    meta = opts.meta
    positions = opts.positions
    log_file = opts.log
    try:
        out_file = opts.out_file
    except AttributeError:
        out_file = ''
    if len(log_file) > 0:
        log = open(log_file, 'w')
    try:
        num_jobs = int(opts.num_jobs)
    except:
        print >> sys.stderr, "ERROR: num_jobs must be an integer."
        sys.exit(1)
    if num_jobs == 0:
        num_jobs = multiprocessing.cpu_count() / 2
        num_jobs_str = str(num_jobs)
    elif num_jobs < 0:
        num_jobs_str = str(multiprocessing.cpu_count() + num_jobs)
    else:
        num_jobs_str = str(num_jobs)
    try:
        neighborhood_size = int(opts.neighborhood_size)
    except:
        print >> sys.stderr, "ERROR: neighborhood_size must be an integer."
        sys.exit(1)
    if neighborhood_size < 2:
        print >> sys.stderr, "ERROR: neighborhood_size must be >= 2."
    
    #read the matrices:
    if len(log_file) > 0:
        print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
        print >> log, "Using "+num_jobs_str+" CPUs\n"
        print >> log, "Reading in pivot input ..."
    curr_time = time.time()
    dt1,sample_labels1,feature_labels1,map,layout = load_pivot_data(pivot_data,True,opts)
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"

    #figure out which genomic file to run here as a background (read in the meta json)
    if len(log_file) > 0:
        print >> log, "Reading in meta data ..."
    curr_time = time.time()

    if not(meta["map"] == map):
        print >> sys.stderr, "ERROR: meta data file does not match the requested map. meta[map]:", meta[map], "data[map]:", map
        sys.exit(1)
    in_file2 = meta["layouts"][layout]["featureSpaceFile"]
    metric_type = meta["layouts"][layout]["metric"]
    if not(metric_type in VALID_METRICS):
        print >> sys.stderr, "ERROR: invalid metric specified in meta file"
        sys.exit(1)    
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"
        
    if len(log_file) > 0:
        print >> log, "Reading in background input ..."
    curr_time = time.time()    
    #dt2,sample_labels2,feature_labels2 = read_tabular(in_file2,True)
    dt2,sample_labels2,feature_labels2 = read_tabular2(in_file2,True)
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"
        
    #setup common feature space:
    if len(log_file) > 0:
        print >> log, "Computing common feature space ..."
    curr_time = time.time()    
    common_labels = set(feature_labels1).intersection(set(feature_labels2))
    if len(common_labels) == 0:
        print >> sys.stderr, "ERROR: no features in common between the inputs"
        sys.exit(1)
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"
    
    if len(log_file) > 0:
        print >> log, "Reducing data to common feature space ..."
    curr_time = time.time()    
    dt1_temp = []
    new_feature_labels1 = []
    for f_i in range(len(feature_labels1)):
        if feature_labels1[f_i] in common_labels:
            dt1_temp.append(dt1[f_i])
            new_feature_labels1.append(feature_labels1[f_i])
    dt2_temp = []
    new_feature_labels2 = []
    for f_i in range(len(feature_labels2)):
        if feature_labels2[f_i] in common_labels:
            dt2_temp.append(dt2[f_i])
            new_feature_labels2.append(feature_labels2[f_i])
    
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"        
    
    if len(log_file) > 0:
        print >> log, "Reordering feature space to common order ..."
    curr_time = time.time()    
    #reorder the features with the correct feature order:
    new_dt1_temp = []
    new_dt2_temp = []
    for l in common_labels:
        #first input matrix:
        l_i = new_feature_labels1.index(l)
        new_dt1_temp.append(dt1_temp[l_i])
        #second input matrix:
        l_i = new_feature_labels2.index(l)
        new_dt2_temp.append(dt2_temp[l_i])        
    
    dt_t1 = numpy.transpose(new_dt1_temp)
    dt_t2 = numpy.transpose(new_dt2_temp)
    
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"    
    
    if len(log_file) > 0:
        print >> log, "Computing similarities..."
    curr_time = time.time()
    warnings.filterwarnings("ignore", category=RuntimeWarning)
    x_corr = sklearn.metrics.pairwise.pairwise_distances(X=dt_t1, Y=dt_t2, metric=metric_type, n_jobs=num_jobs)
    x_corr = 1 - x_corr        #because computes the distance, need to convert to similarity
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"    
    
    if len(log_file) > 0:
        print >> log, "Computing local neighborhood (size = "+str(neighborhood_size)
    curr_time = time.time()
    results = {}
    for i in range(len(x_corr)):
        sample_dict = dict(zip(sample_labels2, x_corr[i]))
        results[sample_labels1[i]] = {}
        results[sample_labels1[i]]['neighbors'] = []
        neighborhood_metrics = []
        for n_i in range(neighborhood_size):
            v=list(sample_dict.values())
            k=list(sample_dict.keys())
            m=v.index(max(v))
            results[sample_labels1[i]]['neighbors'].append(k[m])
            neighborhood_metrics.append(v[m])
            del sample_dict[k[m]]
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"
        
    if len(log_file) > 0:
        print >> log, "Computing (x,y) positions"
    curr_time = time.time()

    for k in results:
        neighbors = results[k]['neighbors']
        x_pos = []
        y_pos = []        
        for n in neighbors:
            if n in positions.keys():
                x_pos.append(positions[n]["x"])
                y_pos.append(positions[n]["y"])
            else:
                print >> sys.stderr, "WARNING: some of the neighbors do not have (x,y) location in the map."

        centroid_x = numpy.median(x_pos)
        centroid_y = numpy.median(y_pos)
        results[k]['x'] = centroid_x
        results[k]['y'] = centroid_y
    
    if len(log_file) > 0:
        print >> log, "Outputting in json format"
    curr_time = time.time()
    if len(log_file) > 0:
        print >> log, str(time.time() - curr_time) + " seconds"
        
    if len(log_file) > 0:
        print >> log, "--- %s seconds ---" % (time.time() - start_time)
        log.close()
    if out_file == '':
        return results
    else:
        with open(out_file, 'w') as fp:
            json.dump(results, fp, sort_keys = True, indent = 4, ensure_ascii=False)
        return 0

def loadData(opts):

    # This retrieves data from files for any data that is not included in the
    # parameters passed. This isolates the main routine from data retrieval so
    # the server can store the data anywhere without bothering the main routine.
    # TODO: This logic should eventually be moved out of this file because we
    # don't want the python utilities to have to deal with data retrieval.
    
    # Load the n-of-1 node data if a file name is provided in the parameters.
    # Otherwise we assume opts.pivot_data is already loaded.
    if hasattr(opts, 'in_pivot'):
        with open(opts.in_pivot) as f:
            opts.pivot_data = json.load(f)
        del opts.in_pivot

    # Load the metadata if a file name is provided in the parameters.
    # Otherwise we assume opts.meta is already loaded
    if hasattr(opts, 'in_meta'):
        with open(opts.in_meta) as f:
            opts.meta = json.load(f)
        del opts.in_meta

    # Load the xy positions from the file name in the metadata,
    # if the positions are not provided in the parameters
    if not hasattr(opts, 'positions'):
        layout = opts.pivot_data["layout"]
        file = opts.meta["layouts"][layout]["postSquiggleFile"]
        input = open(file, 'r')
        opts.positions = {}
        for line in input:
            line_elems = line.strip().split("\t")
            opts.positions[line_elems[0]] = {}
            opts.positions[line_elems[0]]["x"] = float(line_elems[1])
            opts.positions[line_elems[0]]["y"] = float(line_elems[2])
        input.close()

    return main(opts)

def fromNodejs(optsIn):

    # This is the entrance when calling from nodejs rather than from the
    # command line.
    class Struct:
        def __init__(self, **entries):
            self.__dict__.update(entries)

    opts = Struct(**optsIn)
    return loadData(opts)

if __name__ == "__main__" :
    try:
        # We are being called via the command line
        return_code = loadData(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)
