#Yulia Newton
#python2.7 compute_sparse_matrix.py --in_file temp.tab --top 10 --metric correlation --output_type sparse --out_file temp.out.tab --log log.tab --num_jobs 0

import argparse, sys, operator, numpy, multiprocessing, sklearn, time
from sklearn import metrics
VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming','jaccard','rogerstanimoto']
VALID_OUTPUT_TYPE = ['SPARSE','FULL']

def parse_args(args):
	args = args[1:]
	parser = argparse.ArgumentParser(description=__doc__, 
		formatter_class=argparse.RawDescriptionHelpFormatter)

	parser.add_argument("--in_file", type=str,
		help="input file name (matrix formatted genomic data)")
	parser.add_argument("--top", type=int, default=6,
		help="number of top neighbors to use in DrL layout")
	parser.add_argument("--metric", type=str, default="correlation",
		help="valid metrics: canberra,cosine,euclidean,manhattan,chebyshev,correlation,hamming,jaccard,rogerstanimoto")
	parser.add_argument("--output_type",type=str, default="sparse",
		help="either sparse or full")
	parser.add_argument("--log",type=str, default="",
		help="if not specified or an empty value then no log file is created")
	parser.add_argument("--num_jobs",type=int, default=-1,
		help="number of CPUs to use for similarity computation")
	parser.add_argument("--out_file", type=str,
		help="output file name")		
   
	return parser.parse_args(args)    

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
	
def extract_similarities(dt, sample_labels, top, log):
	if not(log == None):
		print >> log, "Outputting sparse matrix..."
	curr_time = time.time()
	output = ""
	for i in range(len(dt)):
		sample_dict = dict(zip(sample_labels, dt[i]))
		del sample_dict[sample_labels[i]]	#remove self comparison
		for n_i in range(top):
			v=list(sample_dict.values())
			k=list(sample_dict.keys())
			m=v.index(max(v))
			output = output + "\n" + sample_labels[i]+"\t"+k[m]+"\t"+str(v[m])
			del sample_dict[k[m]]
			
	if not(log == None):
		print >> log, str(time.time() - curr_time) + " seconds"
	return(output)	

def compute_similarities(dt, sample_labels, metric_type, num_jobs, output_type, top, log):
	if not(log == None):
		print >> log, "Computing similarities..."
	curr_time = time.time()
	x_corr = sklearn.metrics.pairwise.pairwise_distances(X=dt, Y=None, metric=metric_type, n_jobs=num_jobs)
	x_corr = 1 - x_corr		#because computes the distance, need to convert to similarity
	print "Resulting similarity matrix: "+str(len(x_corr))+" x "+str(len(x_corr[0]))
	if not(log == None):
		print >> log, str(time.time() - curr_time) + " seconds"
		
	if not(log == None):
		print >> log, "Outputting "+output_type.lower()+" matrix..."
	curr_time = time.time()
	output = ""
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
			output = output + "\n" + sample_labels[i]+"\t"+"\t".join(value_str)
			
	if not(log == None):
		print >> log, str(time.time() - curr_time) + " seconds"
	return(output)
	
def main(args):
	start_time = time.time()

	sys.stdout.flush()
	opts = parse_args(args)
			
	#process input arguments:
	in_file = opts.in_file
	#metric_type = opts.metric.upper()
	metric_type = opts.metric.lower()
	output_type = opts.output_type.upper()
	top = int(opts.top)
	out_file = opts.out_file
	log_file = opts.log
	log = None
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
	if not(log == None):
		print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
		print >> log, "Using "+num_jobs_str+" CPUs"
		print >> log, "Reading in input..."
	curr_time = time.time()
	dt,sample_labels,feature_labels = read_tabular(in_file,True)
	#dt_t = [list(i) for i in zip(*dt)]	#rows are samples and columns are features now
	dt_t = numpy.transpose(dt)
	if not(log == None):
		print >> log, str(time.time() - curr_time) + " seconds"
	
	result = compute_similarities(dt_t, sample_labels, metric_type, num_jobs, output_type, top, log)
	output = open(out_file, 'w')
	print >> output, result
	output.close()
	
	#print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)
	if not(log == None):
		print >> log, "--- %s seconds ---" % (time.time() - start_time)
		log.close()
	
	return(0)	#if got to this point with no errors or exceptions then succeeded; there's probably a better way to go about this return

if __name__ == "__main__" :
	try:
		# Get the return code to return
		# Don't just exit with it because sys.exit works by exceptions.
		return_code = main(sys.argv)
	except:
		#traceback.print_exc()
		# Return a definite number and not some unspecified error code.
		return_code = 1
		
	sys.exit(return_code)
