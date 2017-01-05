#!/usr/bin/env python2.7

#Yulia Newton
#small addition of option --rows by duncan mccoll, --rows Y does rowwise 
# similarity instead of column wise
#python2.7 compute_sparse_matrix.py --in_file temp.tab --top 10 --metric correlation --output_type sparse --out_file temp.out.tab

import optparse, sys, os
import operator
import numpy
import sklearn
from sklearn import metrics
import collections as collect
import pandas as pd
#import scipy
import scipy.stats
import time
#import pandas
#from pandas import DataFrame
#VALID_METRICS = ['PEARSON', 'SPEARMAN', 'KENDALL']
#VALID_METRICS = ['euclidean', 'l2', 'l1', 'manhattan', 'cityblock','braycurtis', 'canberra', 'chebyshev', 
#'correlation','cosine', 'dice', 'hamming', 'jaccard', 'kulsinski','mahalanobis', 'matching', 'minkowski', 
#'rogerstanimoto','russellrao', 'seuclidean', 'sokalmichener','sokalsneath', 'sqeuclidean', 'yule', "wminkowski"]


def make_unique(list):
    '''function adds a number to each nonunique element, 
       forcing them to be unique

       takes in a list, and outputs a unique list
    '''

    countD = collect.Counter()
    uniqueList = []
    for ent in list:
        if countD[ent]:
            uniqueList.append(ent+'.' + str(countD[ent]))
        else:
            uniqueList.append(ent)

        countD[ent]+=1

    return(uniqueList)

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
			init_matrix.append(features)
			
		line_num += 1
	
	if numeric_flag:
		matrix = [map(float,x) for x in init_matrix]
	else:
		matrix = init_matrix
	return (matrix, make_unique(col_headers),make_unique(row_headers))
	
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
        VALID_METRICS = ['canberra','cosine','euclidean','manhattan','chebyshev','correlation','hamming','jaccard','rogerstanimoto','spearman']
        VALID_OUTPUT_TYPE = ['SPARSE','FULL']
	start_time = time.time()
	
	parser = optparse.OptionParser()
	parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
	parser.add_option("--top", dest="top", action="store", default=6, help="")
	parser.add_option("--metric", dest="metric", action="store", default="", help="")
	parser.add_option("--output_type", dest="output_type", action="store", default="", help="either FULL or SPARSE")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	parser.add_option("--rows", dest="rows", action="store", default="n", help="manipulate to rowise similaritys with --rows Y")
	parser.add_option("--n_jobs", dest="n_jobs", action="store", default=1, help="paralellize with scipy")
	opts, args = parser.parse_args()

	#process input arguments:
	in_file = opts.in_file
	#metric_type = opts.metric.upper()
	metric_type = opts.metric.lower()
	output_type = opts.output_type.upper()
	top = int(opts.top)
	out_file = opts.out_file
        n_jobs = int(opts.n_jobs)
	
	if not(metric_type in VALID_METRICS):
		print >> sys.stderr, "ERROR: invalid metric"
		sys.exit(1)
		
	if not(output_type in VALID_OUTPUT_TYPE):
		print >> sys.stderr, "ERROR: invalid output type"
		sys.exit(1)		

	#read the matrix and store in a dictionary:
	print >> sys.stderr, "Reading in input..."
	dt,sample_labels,feature_labels = read_tabular(in_file,True)
	#dt_t = [list(i) for i in zip(*dt)]	#rows are samples and columns are features now
        #option added by duncan
        if opts.rows ==  'Y':
            tmp = sample_labels
            sample_labels = feature_labels
            feature_labels = tmp
            dt_t = dt

        else:
            dt_t = numpy.transpose(dt)
        
	#hack to do spearman correlation
        if ('spearman' == metric_type):
            print('rank transform for spearman being computed')
            #set metric type to pearson
	    metric_type = 'correlation'
            dt_t = pd.DataFrame(dt_t)
            #column wise rank transform and then pearson is spearman 
            dt_t = dt_t.apply(scipy.stats.rankdata,axis=0)
            dt_t = numpy.array(dt_t) 

	print >> sys.stderr, "Computing similarities..."
	x_corr = sklearn.metrics.pairwise.pairwise_distances(X=dt_t, Y=None, metric=metric_type, n_jobs=n_jobs)
	x_corr = 1 - x_corr		#because computes the distance, need to convert to similarity
	
	#print >> sys.stderr, str(len(x_corr))+" x "+str(len(x_corr[0]))
	
	print >> sys.stderr, "Outputting "+output_type.lower()+" matrix..."
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
	
	'''print >> sys.stderr, "Outputting sparse matrix..."
	output = open(out_file, 'w')
	for i in range(len(x_corr)):
		print >> sys.stderr, i
		sample_dict = dict(zip(sample_labels, x_corr[i]))
		del sample_dict[sample_labels[i]]	#remove self comparison
		sorted_neighbors= sorted(sample_dict.items(), key=operator.itemgetter(1),reverse=True)
		for n_i in range(0,top):
			n = sorted_neighbors[n_i]
			print >> output, sample_labels[i]+"\t"+n[0]+"\t"+str(n[1])
			print >> sys.stderr, "\t"+str(n_i)			
	output.close()'''
		
	'''print >> sys.stderr, "Computing similrities..."
	x = numpy.array(dt, numpy.float)
	x_df = pandas.DataFrame(data=x, index=None, columns=None, dtype=None, copy=False)	
	if metric_type == "PEARSON":
		x_corr = x_df.corr(method='pearson', min_periods=1)
	elif metric_type == "SPEARMAN":
		x_corr = x_df.corr(method='spearman', min_periods=1)
	elif metric_type == "KENDALL":
		x_corr = x_df.corr(method='kendall', min_periods=1)
		
	print >> sys.stderr, "Outputting sparse matrix..."
	output = open(out_file, 'w')
	for i in range(len(x_corr)):
		sample_dict = dict(zip(sample_labels, x_corr[i]))
		del sample_dict[sample_labels[i]]	#remove self comparison
		sorted_neighbors= sorted(sample_dict.items(), key=operator.itemgetter(1),reverse=True)
		neighbor_count = 1
		for n in sorted_neighbors:
			print >> output, sample_labels[i]+"\t"+n[0]+"\t"+str(n[1])
			neighbor_count += 1
			if neighbor_count > top:
				exit
	output.close()'''
		
	''' Some old code # 1:
	dt_corr = numpy.corrcoef(dt, y=None, rowvar=1, bias=0, ddof=None)
	'''
	
	''' Some old code # 2:	
	#compute similarity neighbourhoods:
	print >> sys.stderr, "Computing similrities..."
	sample_cmpr = {}	#dictionary of samples, each sample contains the top X neighbor samples
	for i in range(len(dt_t)):	#go through every row/sample
		sample1_dt = dt_t[i]
		sample1 = sample_labels[i]
		
		if not(sample1 in sample_cmpr):
			sample_cmpr[sample1] = {}
		
		for j in range(i,len(dt_t)):	#nested loop through all the samples (pair-wise)
			if j > i:	#avoid self comparison and computing twice
				print >> sys.stderr, "("+str(i)+", "+str(j)+")"
				
				sample2_dt = dt_t[j]
				sample2 = sample_labels[j]
				
				if not(sample2 in sample_cmpr):
					sample_cmpr[sample2] = {}
				
				#if sample1 in sample_cmpr[sample2]:		#already has been computed
				#	metric = sample_cmpr[sample2][sample1]
				#else:
				metric = sample_compare(sample1_dt,sample2_dt,metric_type)
				
				if len(sample_cmpr[sample1]) < top:	#keep top X neighbors, if less than X then just add this one
					sample_cmpr[sample1][sample2] = metric
				else:	#already have the top X neighbors; is this neighbor closer than one of the stored ones?
					sorted_sample1 = sorted(sample_cmpr[sample1].items(), key=operator.itemgetter(1))
					if metric > sorted_sample1[0][1]:	#replace the smallest neighbor with this one
						sample_to_remove = sorted_sample1[0][0]
						sample_cmpr[sample1][sample2] = metric
						del sample_cmpr[sample1][sample_to_remove]
						
				if len(sample_cmpr[sample2]) < top:	#keep top X neighbors, if less than X then just add this one
					sample_cmpr[sample2][sample1] = metric
				else:	#already have the top X neighbors; is this neighbor closer than one of the stored ones?
					sorted_sample2 = sorted(sample_cmpr[sample2].items(), key=operator.itemgetter(1))
					if metric > sorted_sample2[0][1]:	#replace the smallest neighbor with this one
						sample_to_remove = sorted_sample2[0][0]
						sample_cmpr[sample2][sample1] = metric
						del sample_cmpr[sample2][sample_to_remove]					

	#output sparse matrix:
	output = open(out_file, 'w')
	print >> sys.stderr, "Outputting sparse matrix..."
	for s in sample_cmpr.keys():
		s_neighbors = sample_cmpr[s]
		sorted_neighbors= sorted(s_neighbors.items(), key=operator.itemgetter(1),reverse=True)
		for n in sorted_neighbors:
			print >> output, s+"\t"+n[0]+"\t"+str(n[1])

	output.close()
	'''
	
	print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)

main()
