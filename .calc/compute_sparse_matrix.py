#Yulia Newton
#python2.7 compute_sparse_matrix.py --in_file temp.tab --top 10 --metric correlation --output_type sparse --out_file temp.out.tab --log log.tab --num_jobs 0

import optparse, sys #, os
import operator
import numpy
import multiprocessing
import sklearn
from sklearn import metrics
#import scipy
#from scipy import stats
import time
#import pandas
#from pandas import DataFrame
#VALID_METRICS = ['PEARSON', 'SPEARMAN', 'KENDALL']
VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming','jaccard','rogerstanimoto']
VALID_OUTPUT_TYPE = ['SPARSE','FULL']
#VALID_METRICS = ['euclidean', 'l2', 'l1', 'manhattan', 'cityblock','braycurtis', 'canberra', 'chebyshev', 
#'correlation','cosine', 'dice', 'hamming', 'jaccard', 'kulsinski','mahalanobis', 'matching', 'minkowski', 
#'rogerstanimoto','russellrao', 'seuclidean', 'sokalmichener','sokalsneath', 'sqeuclidean', 'yule', "wminkowski"]

def read_tabular(input_file, numeric_flag):
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
	
def main():
	start_time = time.time()
	
	parser = optparse.OptionParser()
	parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
	parser.add_option("--top", dest="top", action="store", default="", help="")
	parser.add_option("--metric", dest="metric", action="store", default="", help="")
	parser.add_option("--output_type", dest="output_type", action="store", default="", help="")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	parser.add_option("--log", dest="log", action="store", default="", help="")
	parser.add_option("--num_jobs", dest="num_jobs", action="store", default="0", help="http://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.pairwise_distances.html")
	opts, args = parser.parse_args()
	
	#process input arguments:
	in_file = opts.in_file
	#metric_type = opts.metric.upper()
	metric_type = opts.metric.lower()
	output_type = opts.output_type.upper()
	top = int(opts.top)
	out_file = opts.out_file
	log_file = opts.log
	if len(log_file) > 0:
		log = open(log_file, 'w')
	try:
		num_jobs = int(opts.num_jobs)
	except:
		print >> sys.stderr, "ERROR: num_jobs must be an integer."
	if num_jobs == 0:
		num_jobs = multiprocessing.cpu_count() / 2
		num_jobs_str = str(num_jobs)
	elif num_jobs < 0:
		num_jobs_str = str(multiprocessing.cpu_count() + num_jobs)
	else:
		num_jobs_str = str(num_jobs)
	
	if not(metric_type in VALID_METRICS):
		print >> sys.stderr, "ERROR: invalid metric"
		sys.exit(1)
		
	if not(output_type in VALID_OUTPUT_TYPE):
		print >> sys.stderr, "ERROR: invalid output type"
		sys.exit(1)		

	#read the matrix and store in a dictionary:
	#print >> sys.stderr, "Reading in input..."
	if len(log_file) > 0:
		print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
		print >> log, "Using "+num_jobs_str+" CPUs"
		print >> log, "Reading in input..."
	curr_time = time.time()
	dt,sample_labels,feature_labels = read_tabular(in_file,True)
	#dt_t = [list(i) for i in zip(*dt)]	#rows are samples and columns are features now
	dt_t = numpy.transpose(dt)
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
	
	#print >> sys.stderr, "Computing similarities..."
	if len(log_file) > 0:
		print >> log, "Computing similarities..."
	curr_time = time.time()
	x_corr = sklearn.metrics.pairwise.pairwise_distances(X=dt_t, Y=None, metric=metric_type, n_jobs=num_jobs)
	x_corr = 1 - x_corr		#because computes the distance, need to convert to similarity
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
	
	#print >> sys.stderr, str(len(x_corr))+" x "+str(len(x_corr[0]))
	
	#print >> sys.stderr, "Outputting "+output_type.lower()+" matrix..."
	if len(log_file) > 0:
		print >> log, "Outputting "+output_type.lower()+" matrix..."
	curr_time = time.time()
	output = open(out_file, 'w')
	if output_type == "SPARSE":
		for i in range(len(x_corr)):
			#print >> sys.stderr, i
			sample_dict = dict(zip(sample_labels, x_corr[i]))
			del sample_dict[sample_labels[i]]	#remove self comparison
			#sorted_neighbors = [(value, key) for key, value in sample_dict.items()]
			for n_i in range(top):
				v=list(sample_dict.values())
				k=list(sample_dict.keys())
				m=v.index(max(v))
				#print >> sys.stderr, m
				print >> output, sample_labels[i]+"\t"+k[m]+"\t"+str(v[m])
				del sample_dict[k[m]]
	elif output_type == "FULL":
		print >> output, "sample\t"+"\t".join(sample_labels)
		for i in range(len(x_corr)):
			value_str = [str(x) for x in x_corr[i]]
			print >> output, sample_labels[i]+"\t"+"\t".join(value_str)
			
	output.close()
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
	
	#print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)
	if len(log_file) > 0:
		print >> log, "--- %s seconds ---" % (time.time() - start_time)
		log.close()

main()
