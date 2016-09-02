#Yulia Newton
#python2.7 compute_sparse_matrix.two_matrices.py --in_file1 temp.tab --in_file2 temp2.tab --top 10 --metric correlation --output_type full --out_file temp.out.tab --log log.tab --num_jobs 0

import optparse, sys, os
import operator
import numpy
import sklearn
from sklearn import metrics
import time
import multiprocessing
VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming','jaccard','rogerstanimoto']
VALID_OUTPUT_TYPE = ['SPARSE','FULL']

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
	
def read_tabular2(input_file, numeric_flag):
	with open(input_file,'r') as f:
		lines = [l.rstrip('\n').split('\t') for l in f]

	col_headers = lines[0][1:]
	row_headers = [l[0] for l in lines[1:]]
	if numeric_flag:
		dt = [map(float,l[1:]) for l in lines[1:]]
	else:
		dt = [l[1:] for l in lines[1:]]

	return (dt, col_headers, row_headers)
	
def sample_compare(x,y,metric_type):
	if metric_type == "SPEARMAN":
		return(scipy.stats.spearmanr(x, y)[0])
	elif metric_type == "PEARSON":
		return(scipy.stats.pearson(x, y)[0])
	elif metric_type == "KENDALL":
		return(scipy.stats.kendalltau(x, y)[0])
	else:
		print >> sys.stderr, "ERROR: Invalid metric type specified."

def main():
	start_time = time.time()
	
	parser = optparse.OptionParser()
	parser.add_option("--in_file1", dest="in_file1", action="store", default="", help="")
	parser.add_option("--in_file2", dest="in_file2", action="store", default="", help="")
	parser.add_option("--top", dest="top", action="store", default="", help="")
	parser.add_option("--metric", dest="metric", action="store", default="", help="")
	parser.add_option("--output_type", dest="output_type", action="store", default="", help="")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	parser.add_option("--log", dest="log", action="store", default="", help="")
	parser.add_option("--num_jobs", dest="num_jobs", action="store", default="0", help="http://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.pairwise_distances.html")	
	opts, args = parser.parse_args()

	#process input arguments:
	in_file1 = opts.in_file1
	in_file2 = opts.in_file2
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

	#read the matrices:
	if len(log_file) > 0:
		print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
		print >> log, "Using "+num_jobs_str+" CPUs\n"
		print >> log, "Reading in input 1 ..."
	curr_time = time.time()
	#dt1,sample_labels1,feature_labels1 = read_tabular(in_file1,True)
	dt1,sample_labels1,feature_labels1 = read_tabular(in_file1,True)
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"	

	if len(log_file) > 0:
		print >> log, "Reading in input 2 ..."
	curr_time = time.time()	
	#dt2,sample_labels2,feature_labels2 = read_tabular(in_file2,True)
	dt2,sample_labels2,feature_labels2 = read_tabular(in_file2,True)
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
	x_corr = sklearn.metrics.pairwise.pairwise_distances(X=dt_t1, Y=dt_t2, metric=metric_type, n_jobs=num_jobs)
	x_corr = 1 - x_corr		#because computes the distance, need to convert to similarity
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"	

	if len(log_file) > 0:
		print >> log, "Outputting "+output_type.lower()+" matrix..."
	curr_time = time.time()	
	output = open(out_file, 'w')
	if output_type == "SPARSE":
		for i in range(len(x_corr)):
			sample_dict = dict(zip(sample_labels2, x_corr[i]))
			for n_i in range(top):
				v=list(sample_dict.values())
				k=list(sample_dict.keys())
				m=v.index(max(v))
				print >> output, sample_labels1[i]+"\t"+k[m]+"\t"+str(v[m])
				del sample_dict[k[m]]
	elif output_type == "FULL":
		print >> output, "sample\t"+"\t".join(sample_labels2)
		for i in range(len(x_corr)):
			value_str = [str(x) for x in x_corr[i]]
			print >> output, sample_labels1[i]+"\t"+"\t".join(value_str)

	output.close()
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
		
	if len(log_file) > 0:
		print >> log, "--- %s seconds ---" % (time.time() - start_time)
		log.close()
main()
