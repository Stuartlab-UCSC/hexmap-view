#Yulia Newton
#python2.7 compute_layout.py --in_file gemomic.tab --method tsne --out_file temp.out.tab

import optparse, sys
import operator
import numpy
import multiprocessing
import sklearn
from sklearn import metrics
from sklearn import decomposition
from sklearn import manifold
from sklearn.decomposition import PCA
from sklearn.decomposition import FastICA
from sklearn.manifold import TSNE
from sklearn.manifold import Isomap
from sklearn.manifold import MDS
from sklearn.manifold import SpectralEmbedding
import time
VALID_METHODS = ['tsne', 'pca', 'isomap', 'mds', 'spectralembedding', 'ica']
N_NEIGHBORS = 6

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
	
def computePCA(dt, sample_labels):
	pca = sklearn.decomposition.PCA(n_components=2)
	pca.fit(dt)
	model = pca.transform(dt)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def computetSNE(dt, sample_labels):
	pca = sklearn.decomposition.PCA(n_components=11)
	dt_pca = pca.fit_transform(numpy.array(dt))
	model = sklearn.manifold.TSNE(n_components=2, random_state=0,n_iter=1000,perplexity=30)
	numpy.set_printoptions(suppress=True)
	model = model.fit_transform(dt_pca)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def computeisomap(dt, sample_labels, n=6):
	model = sklearn.manifold.Isomap(n, 2).fit_transform(dt)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def computeMDS(dt, sample_labels):
	mds = sklearn.manifold.MDS(2, max_iter=100, n_init=1)
	model = mds.fit_transform(dt)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def computeSpectralEmbedding(dt, sample_labels, n=6):
	se = sklearn.manifold.SpectralEmbedding(n_components=2, n_neighbors=n)
	model = se.fit_transform(dt)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def computeICA(dt, sample_labels):
	ica = sklearn.decomposition.FastICA(n_components=2)
	model = ica.fit_transform(dt)
	return(dict(zip(sample_labels, [tuple(val) for val in model])))

def PCA(dt):
	pca = sklearn.decomposition.PCA(n_components=2)
	pca.fit(dt)
	return(pca.transform(dt))
	
def tSNE(dt):
	pca = sklearn.decomposition.PCA(n_components=50)
	dt_pca = pca.fit_transform(numpy.array(dt))
	model = sklearn.manifold.TSNE(n_components=2, random_state=0,n_iter=1000)
	numpy.set_printoptions(suppress=True)
	return(model.fit_transform(dt_pca))

def tSNE2(dt):
	model = sklearn.manifold.TSNE(n_components=2, random_state=0)
	numpy.set_printoptions(suppress=True)
	return(model.fit_transform(dt))
	
def tSNE3(dt):
	pca = sklearn.decomposition.PCA(n_components=11)
	dt_pca = pca.fit_transform(numpy.array(dt))
	model = sklearn.manifold.TSNE(n_components=2, random_state=0,n_iter=1000,perplexity=30)
	numpy.set_printoptions(suppress=True)
	return(model.fit_transform(dt_pca))	

def isomap(dt):
	return(sklearn.manifold.Isomap(N_NEIGHBORS, 2).fit_transform(dt))

def MDS(dt):
	mds = sklearn.manifold.MDS(2, max_iter=100, n_init=1)
	return(mds.fit_transform(dt))

def SpectralEmbedding(dt):
	se = sklearn.manifold.SpectralEmbedding(n_components=2, n_neighbors=N_NEIGHBORS)
	return(se.fit_transform(dt))

def ICA(dt):
	ica = sklearn.decomposition.FastICA(n_components=2)
	return(ica.fit_transform(dt))

def main():
	start_time = time.time()
	
	parser = optparse.OptionParser()
	parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
	parser.add_option("--method", dest="method", action="store", default="", help="")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	parser.add_option("--log", dest="log", action="store", default="", help="")
	opts, args = parser.parse_args()
	
	#process input arguments:
	in_file = opts.in_file
	method = opts.method.lower()
	out_file = opts.out_file
	log_file = opts.log
	if len(log_file) > 0:
		log = open(log_file, 'w')
	
	if not(method in VALID_METHODS):
		print >> sys.stderr, "ERROR: invalid method is specified"
		sys.exit(1)
		
	#read the matrix and store in a dictionary:
	if len(log_file) > 0:
		print >> log, "Number of CPUs is "+str(multiprocessing.cpu_count())
		print >> log, "Using "+num_jobs_str+" CPUs"
		print >> log, "Reading in input..."
	curr_time = time.time()
	try:
		dt,sample_labels,feature_labels = read_tabular(in_file,True)
	except:
		print >> sys.stderr, "ERROR: error reading input; possibly due to invalid values"
		sys.exit(1)
	#dt_t = [list(i) for i in zip(*dt)]	#rows are samples and columns are features now
	dt_t = numpy.transpose(dt)
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
		
	if len(log_file) > 0:
		print >> log, "Computing layout..."
	curr_time = time.time()

	if method == "pca":
		coord = PCA(dt_t)
	elif method == "tsne":
		coord = tSNE3(dt_t)
	elif method == "isomap":
		coord = isomap(dt_t)
	elif method == "mds":
		coord = MDS(dt_t)
	elif method == "spectralembedding":
		coord = SpectralEmbedding(dt_t)
	elif method == "ica":
		coord = ICA(dt_t)
	else:
		print >> sys.stderr, "ERROR: something went wrong, invalid method."
		sys.exit(1)
		
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
	
	if len(log_file) > 0:
		print >> log, "Outputting layout coordinates..."
	curr_time = time.time()
	
	#print coord[1:10]
	#sys.exit(0)
	output = open(out_file, 'w')
	print >> output, "ID\tx\ty"
	for s_i in range(len(sample_labels)):
		print >> output, sample_labels[s_i]+"\t"+str(coord[s_i][0])+"\t"+str(coord[s_i][1])
	output.close()
	if len(log_file) > 0:
		print >> log, str(time.time() - curr_time) + " seconds"
	
	#print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)
	if len(log_file) > 0:
		print >> log, "--- %s seconds ---" % (time.time() - start_time)
		log.close()

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
