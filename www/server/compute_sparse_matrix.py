
'''
This script computes all-by-all similarities for a given tab seperated matrix file.

It either outputs it in FULL or SPARSE format, FULL is the complete tab sep N X N matrix of similarity,
SPARSE is a tab seperated edge file, listing the pairwise comparisons of the --top correlations for each sample.

Note: NaN's in the input matrix are replaced by 0. In cases where this is inappropriate the matrix input should
      have na's replaced with the users desired method.

#Yulia Newton
#python2.7 compute_sparse_matrix.py --in_file --in_file2 temp.tab --top 10 --metric correlation \
                                    --output_type sparse --out_file temp.out.tab --log log.tab --num_jobs 0
'''

import argparse, sys, numpy, multiprocessing, time,traceback
import sklearn.metrics.pairwise as sklp
import scipy.stats
import pandas as pd
from utils import truncateNP

VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming',
                 'jaccard','rogerstanimoto','spearman']
VALID_OUTPUT_TYPE = ['SPARSE','FULL','SPARSE_PERCENT']

def parse_args(args):

    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument("--in_file", type=str,
        help="input file name (matrix formatted genomic data)")
    parser.add_argument("--in_file2", type=str,default="",
        help="Second matrix file, used for n-of-1 placement")
    parser.add_argument("--top", type=int, default=6,
        help="number of top neighbors to use in DrL layout")
    parser.add_argument("--metric", type=str, default="correlation",
        help="valid metrics: spearman,canberra,cosine,euclidean,manhattan,chebyshev,correlation,hamming,jaccard,rogerstanimoto")
    parser.add_argument("--output_type",type=str, default="sparse",
        help="either sparse or full")
    parser.add_argument("--log",type=str, default="",
        help="if not specified or an empty value then no log file is created")
    parser.add_argument("--num_jobs",type=int, default=-1,
        help="number of CPUs to use for similarity computation")
    parser.add_argument("--out_file", type=str,
        help="output file name")
    parser.add_argument("--rows", action="store_true",
        help="will take row wise similarity instead of columns")

    return parser.parse_args(args)

def std_iszero(dt,log=sys.stdout):
    '''
    a check/warning the given matrix has rows or columns with standard deviation of 0
    @param dt:
    @return:
    '''
    rowstd = numpy.apply_along_axis(numpy.std,1,dt)
    colstd = numpy.apply_along_axis(numpy.std,0,dt)

    rowstdIs0 = numpy.argwhere(rowstd == 0).flatten()
    colstdIs0 = numpy.argwhere(colstd == 0).flatten()

    if log!=None and len(rowstdIs0):
        print >> log, "WARNING: rows " + str(rowstdIs0) + ' have standard deviation of 0'
    if log!=None and len(colstdIs0):
        print >> log, "WARNING: columns " + str(colstdIs0) + ' have standard deviation of 0'

    return bool(len(rowstdIs0) or len(colstdIs0))

def read_tabular(in_file,numeric_flag=True,log=sys.stdout):
    '''
    Reads a tabular matrix file and returns numpy matrix, col names, row names
    drops columns and rows that are full of nan
    @param in_file: name of tab seperated input file
    @param numeric_flag: if strings are found throws a value error
    @param log: where info chatter goes to
    @return: numpy matrix, list of column names, list of rownames
    '''

    df = pd.read_csv(in_file,sep='\t',index_col=0)
    #drop rows and columns that are full of na's
    df.dropna(axis=1,how='all',inplace=True)
    df.dropna(axis=0,how='all',inplace=True)
    #count the number of Nas so we can warn the user
    nas = df.isnull().sum().sum()
    df = df.fillna(0)
    #check and make sure the conversions all went smoothly
    colsHadStrings= numpy.argwhere(df.dtypes == object).flatten()

    if log != None and nas:
        print >> log, "WARNING: " + str(nas) + " Na's found in data matrix " + in_file + ". Set all to 0"

    if len(colsHadStrings) and numeric_flag:
            raise ValueError('Strings were found in input matrix, columns:' + str(colsHadStrings))

    col_header = df.columns.values.tolist()
    row_header = df.index.tolist()
    df = df.as_matrix()

    return df, col_header, row_header

def read_tabular_dep(input_file, numeric_flag):
    '''data = open(input_file, 'r')
    line = data.readline()
    line = line.strip().split("\t")
    col_headers = line[1:]
    data.close()

    matrix = numpy.loadtxt(input_file, skiprows=1, delimiter='\t', usecols=range(1,len(line)))
    #row_headers = numpy.loadtxt(input_file, skiprows=1, delimiter='\t', usecols=(0))
    row_headers = []
    return (matrix, col_headers, row_headers)'''

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

def read_tabular2(input_file, numeric_flag):	#YN 20160629, a faster (still TBD) version of the above function but doesn't do invalid value conversion
    with open(input_file,'r') as f:
        lines = [l.rstrip('\n').split('\t') for l in f]
    col_headers = lines[0][1:]
    row_headers = [l[0] for l in lines[1:]]
    if numeric_flag:
        dt = [map(float,l[1:]) for l in lines[1:]]
    else:
        dt = [l[1:] for l in lines[1:]]
    return (dt, col_headers, row_headers)

def numpyToPandas(mat,col_list,row_list):
    return pd.DataFrame(mat,index=row_list,columns=col_list)

def pandasToNumpy(df):
    '''
    does conversion of a pandas data frame to type returned by read_tabular
    @param df: pandas data frame
    @return: numpy.array, column list, row list
    '''

    mat = df.as_matrix()
    col_list = df.columns.values.tolist()
    row_list = df.index.tolist()

    return mat, col_list, row_list

def common_rows(p1, p2,fractionReq=.5):
    '''
    takes two pandas data frames and reduces them to have the same rows in the same order
    @param p1: a pandas dataframe
    @param p2: a pandas dataframe
    @param fractionReq: a ValueError will be thrown if this fraction of rows
                        is not kept
    @return: tuple of pandas dataframes reduced to have the same rows in same order
    '''
    p1rows = set(p1.index)
    p2rows = set(p2.index)
    rowsInCommon = p1rows.intersection(p2rows)

    if len(rowsInCommon) < (fractionReq * max(len(p1rows),len(p2rows))):
        raise ValueError, "Less than " + str(fractionReq * 100) + " %" \
                          " of features shared in row reduction operation."

    p1 = p1.loc[rowsInCommon]
    p2 = p2.loc[rowsInCommon]
    return p1,p2

def percentile_sparsify(simdf,top):
    '''
    returns a sparsified version of simdf in edge format, keeping only the
    highest top * simdf.shape[0] edges in the matrix
    @param simdf: a simlarity matrix (or otherwise)
    @param top: used to determine cutoff, top * number of columns in simdf values will be kept
    @return: edge format dataframe: column 1 is the row name, column 2 is the col name,
             and column 3 is the value of simdf[row name, col name]
    '''
    output = pd.DataFrame()


    ncols = len(simdf.index)
    #automatically determine percentile cutoff
    cutoff = 100 - 100*( (float(top)*ncols) / ncols**2)
    #set all diagonal values to 0, so they are not included in percentile
    simdf.values[[numpy.arange(ncols)]*2] = 0

    cut = numpy.percentile(simdf.values, cutoff)

    for row_name in simdf.index:
        row = simdf.loc[row_name][numpy.array(simdf.loc[row_name] > cut)]

        #the index is now the column name of the original similairty matrix
        for col_name in row.index:
            output = output.append(pd.Series([row_name,col_name,row.loc[col_name]]), ignore_index=True)

    return output

def extract_similarities(dt, sample_labels, top, log=None,sample_labels2=[],percentile_cut=False):
    '''
    sparsity operation to reduce a matrix to the 'top' highest numbers for each row
    @param dt: numpy matrix to be sparsified
    @param sample_labels: the column names of dt
    @param top: integer number of nearest neighbors to grab
    @param log: write filestream, where to send info chatter
    @return: a dataframe of the matrix 'dt' sparsified by taking the 'top' neighbors - edgefile format
    '''

    #boolean flag letting us know if it was calculated from two matrices or
    # an all by all
    allbyall = not bool(len(sample_labels2))
    if not(log == None):
        print >> log, "Condensing full similarity matrix to edgefile..."

    curr_time = time.time()
    #container for edge format
    output = pd.DataFrame()

    try:
        #'percentile cut' is a different sparsity operation.
        # instead of taking the top X for all nodes, we will take similiarities meeting a
        # threshold. The threshold is determined by keeping the same amount of edges as if
        # you have performed top 6. e.g. if you have 100 samples and did top 6 you would have
        # 600 edges, if you did percentile_cut with --top 6, you would also have 600 edges, but
        # the number of edges per node would be variable.
        if percentile_cut:
            #has to be a little awkward because we aren't using dataframes.
            #essentially these cases out how we will convert numpy struct to pandas depending on
            # if the rows and column names are the same.
            if len(sample_labels2):
                output = percentile_sparsify(numpyToPandas(dt,sample_labels,sample_labels2),top)
            else:
                output = percentile_sparsify(numpyToPandas(dt,sample_labels,sample_labels),top)

        #this is the normal top X sparsify operation
        else:
            for i in range(len(dt)):
                sample_dict = dict(zip(sample_labels, dt[i]))

                if allbyall: #remove self comparison
                    del sample_dict[sample_labels[i]]

                for n_i in range(top):
                    v=list(sample_dict.values())
                    k=list(sample_dict.keys())
                    m=v.index(max(v))
                    #interatively build a dataframe with the neighbors
                    if len(sample_labels2):
                        output = output.append(pd.Series([sample_labels2[i],k[m],v[m]]),ignore_index=True)
                    else:
                        output = output.append(pd.Series([sample_labels[i],k[m],v[m]]),ignore_index=True)
                    del sample_dict[k[m]]

    except ValueError as e:
        #if the exception was thrown because of faulty use of max()
        if str(e) == "max() arg is an empty sequence":
            raise ValueError, "top argument larger than amount of " \
                              "comparisons"
        else: #pass the exception along as is...
            raise

    return output

def compute_similarities(dt, sample_labels, metric_type, num_jobs, output_type, top, log,dt2=numpy.array([]),sample_labels2=[]):
    '''
    :param dt: a numpy's two dimensional array holding the read in matrix data
    :param sample_labels: the names of the columns in order parallel to 'dt'
    :param metric_type: the metric used to calculate similarities (see global VALID_METRICS)
    :param num_jobs:  an int number of jobs to parallelize the similairty calculations
    :param output_type: either 'FULL' or 'SPARSE', specifying a all-by-all output or a top n
                        nearest neighbor output
    :param top: when using 'SPARSE' output, the number of nearest neighbors to output in the edge file
    :param log: the file descriptor pointed to where you want the chatter to go to, may be omitted
    :param dt2: a second, optional two dimensional numpy.array, if used similarities between dt and dt2 returned.
    :return: returns a pandas dataframe
    '''

    #chatter to log file if one is given
    if not(log == None):
        print >> log, "Computing similarities..."

    curr_time = time.time()

    #work around to provide spearman correlation to sklearn pairwise implementation
    # spearman is a rank transformed pearson ('correlation') metric
    if metric_type == 'spearman':
        if not(log == None):
            print >> log, 'rank transform for spearman being computed'
        #column wise rank transform
        dt = numpy.apply_along_axis(scipy.stats.rankdata,1,dt)
        #do the other matrix if necessary
        if len(dt2):
            dt2 = numpy.apply_along_axis(scipy.stats.rankdata,1,dt2)
        #set metric type to pearson
        metric_type = 'correlation'
        if not(log == None):
            print >> log, 'rank transform complete'

    #calculate pairwise similarities,
    if len(dt2):   #if you have a second matrix then slightly different input
        x_corr = 1 - sklp.pairwise_distances(X=dt, Y=dt2, metric=metric_type, n_jobs=num_jobs)
    else:
        x_corr = 1 - sklp.pairwise_distances(X=dt, Y=None, metric=metric_type, n_jobs=num_jobs)

    #this function gets rid of the last decimal place of all the calculated similarities.
    # its use is an effort to make results reproducible on different machines, which may
    # handle floats differently.
    # In essence, this function represents our distrust in the last decimal of the floating point
    # representation.
    x_corr = truncateNP(x_corr,11)

    if not(log == None):
        print >> log, "Resulting similarity matrix: "+str(len(x_corr))+" x "+str(len(x_corr[0]))
        print >> log, str(time.time() - curr_time) + " seconds"
        print >> log, "Outputting "+output_type.lower()+" matrix..."

    curr_time = time.time()

    #the string which holds all of the output in format specified

    #fills a dataframe in sparse format
    if output_type == "SPARSE":
        if len(dt2):
            output = extract_similarities(x_corr.transpose(), sample_labels, top, log,sample_labels2)
        else:
            output = extract_similarities(x_corr, sample_labels, top, log=log)

    #new method implemented for feature maps
    elif output_type == "SPARSE_PERCENT":
        if len(dt2):
            output = extract_similarities(x_corr.transpose(), sample_labels, top, log, sample_labels2,
                                          percentile_cut=True)
        else:
            output = extract_similarities(x_corr, sample_labels, top, log=log,
                                          percentile_cut=True)

    #turn the similarity matrix into a dataframe
    elif output_type == "FULL":
        if len(dt2):
            output = pd.DataFrame(x_corr,index = sample_labels,columns=sample_labels2)
        else:
            output = pd.DataFrame(x_corr,index = sample_labels,columns=sample_labels)

        output.index.name = 'sample'

    if not(log == None):
        print >> log, str(time.time() - curr_time) + " seconds"

    return output

def compute_similarities_old(dt, sample_labels, metric_type, num_jobs, output_type, top, log):
    '''
    This function was erroring with an index error (on output to string) of unknown cause for some inputs.
    '''
    if not(log == None):
        print >> log, "Computing similarities..."
    curr_time = time.time()
    x_corr = sklp.pairwise_distances(X=dt, Y=None, metric=metric_type, n_jobs=num_jobs)
    x_corr = 1 - x_corr		#because computes the distance, need to convert to similarity
    print "Resulting similarity matrix: "+str(len(x_corr))+" x "+str(len(x_corr[0]))
    if not(log == None):
        print >> log, str(time.time() - curr_time) + " seconds"
    if not(log == None):
        print >> log, "Outputting "+output_type.lower()+" matrix..."
    curr_time = time.time()
    output = ""
    print output_type
    if output_type == "SPARSE":
        for i in range(len(x_corr)):
            sample_dict = dict(zip(sample_labels, x_corr[i]))
            del sample_dict[sample_labels[i]]	#remove self comparison
            for n_i in range(top):
                v=list(sample_dict.values())
                k=list(sample_dict.keys())
                m=v.index(max(v))
                output = output + "\n" + sample_labels[i]+"\t"+k[m]+"\t"+str(v[m])
                del sample_dict[k[m]]
    elif output_type == "FULL":
        output = "sample\t"+"\t".join(sample_labels)
        for i in range(len(x_corr)):
            value_str = [str(x) for x in x_corr[i]]
            output = output + sample_labels[i]+"\t"+"\t".join(value_str) + "\n"
    if not(log == None):
        print >> log, str(time.time() - curr_time) + " seconds"
    return(output)

def main(args):

    start_time = time.time()

    sys.stdout.flush()
    opts = parse_args(args)

    #process input arguments:
    in_file = opts.in_file
    in_file2 = opts.in_file2
    metric_type = opts.metric.lower()
    output_type = opts.output_type.upper()
    top = opts.top
    num_jobs = opts.num_jobs
    out_file = opts.out_file
    log_file = opts.log
    rowwise = opts.rows

    #sets the log file appropriatly for chatter
    if len(log_file) > 0:
        log = open(log_file, 'w')
    else:
        log = None

    #cheat values to variable number of processors
    if num_jobs == 0:
        num_jobs = multiprocessing.cpu_count() / 2
        num_jobs_str = str(num_jobs)
    elif num_jobs < 0:
        num_jobs_str = str(multiprocessing.cpu_count() + num_jobs)
    else:
        num_jobs_str = str(num_jobs)
    #

    #check input
    if not(metric_type in VALID_METRICS):
        print >> sys.stderr, "ERROR: invalid metric"
        sys.exit(1)

    if not(output_type in VALID_OUTPUT_TYPE):
        print >> sys.stderr, "ERROR: invalid output type"
        sys.exit(1)
    #

    if not(log == None):
        print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
        print >> log, "Using "+num_jobs_str+" CPUs"
        print >> log, "Reading in input..."

    curr_time = time.time()
    dt,sample_labels,feature_labels = read_tabular(in_file,True)

    std_iszero(dt,log)

    if rowwise:
        sample_labels, feature_labels = feature_labels, sample_labels
    else:
        dt = numpy.transpose(dt)


    #if we are doing a second input (n-of-1 like)
    if len(in_file2):
        dt2,sample_labels2,feature_labels2 = read_tabular(in_file2,True)
        #switch types so that reducing rows is easier
        dt = numpyToPandas(dt.transpose(),sample_labels,feature_labels)
        dt2 = numpyToPandas(dt2,sample_labels2,feature_labels2)
        #reduce to common rows
        dt,dt2 = common_rows(dt,dt2)
        #switch back to numpy datatype
        dt,sample_labels,feature_labels = pandasToNumpy(dt)
        dt2,sample_labels2,feature_labels2 = pandasToNumpy(dt2)

        if rowwise:
            sample_labels, feature_labels = feature_labels, sample_labels
            sample_labels2, feature_labels2 = feature_labels2, sample_labels2
        else:
            dt =dt.transpose()
            dt2=dt2.transpose()

    else: #set them empty so compute_sim* ignores them.
        dt2=numpy.array([])
        sample_labels2=[]

    if not(log == None):
        print >> log, str(time.time() - curr_time) + " seconds"

    result = compute_similarities(dt, sample_labels, metric_type, num_jobs, output_type, top, log,dt2,sample_labels2)

    #with the sparse out put we need to ignore column and rownames
    if 'SPARSE' in output_type:
        result.to_csv(out_file,index=None,header=False,sep='\t')
    elif output_type == 'FULL':
        result.to_csv(out_file,sep='\t')

    #print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)
    if not(log == None):
        print >> log, "--- %s seconds ---" % (time.time() - start_time)
        log.close()

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(sys.argv[1:])
    except:
        traceback.print_exc()
        return_code = 1

    sys.exit(return_code)
