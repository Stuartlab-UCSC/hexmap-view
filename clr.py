#Yulia Newton
#python2.7 clr.py --in_file temp.tab --output_type full --top 10 --out_file temp.out.tab

VALID_OUTPUT_TYPE = ['SPARSE','FULL']

import optparse, sys, os
import operator
import numpy
#import sklearn
#from sklearn import metrics
import time

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
			init_matrix.append(features)
			
		line_num += 1
	
	if numeric_flag:
		matrix = [map(float,x) for x in init_matrix]
	else:
		matrix = init_matrix
	return (matrix, col_headers, row_headers)
	
def main():
	start_time = time.time()
	
	parser = optparse.OptionParser()
	parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
	parser.add_option("--top", dest="top", action="store", default="", help="")
	parser.add_option("--output_type", dest="output_type", action="store", default="", help="")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	opts, args = parser.parse_args()

	#process input arguments:
	in_file = opts.in_file
	output_type = opts.output_type.upper()
	top = int(opts.top)
	out_file = opts.out_file
	
	if not(output_type in VALID_OUTPUT_TYPE):
		print >> sys.stderr, "ERROR: invalid output type"
		sys.exit(1)		

	#read the matrix:
	print >> sys.stderr, "Reading in input..."
	dt,col_labels,row_labels = read_tabular(in_file,True)
	dt_t = numpy.transpose(dt)
	
	row_means = [numpy.mean(i) for i in dt]
	row_sd = [numpy.std(i,ddof=1) for i in dt]
	col_means = [numpy.mean(i) for i in dt_t]
	col_sd = [numpy.std(i,ddof=1) for i in dt_t]
	
	result = []
	for row_ind in range(len(dt)):
		row = dt[row_ind]
		new_row = []
		for col_ind in range(len(row)):
			val = row[col_ind]
			#(value - mean)/sd
			z_row = (val - row_means[row_ind])/row_sd[row_ind]
			z_col = (val - col_means[col_ind])/col_sd[col_ind]
			new_row.append((z_row+z_col)/2)
		result.append(new_row)
	
	print >> sys.stderr, "Outputting "+output_type.lower()+" matrix..."
	output = open(out_file, 'w')
	if output_type == "SPARSE":
		for i in range(len(result)):
			sample_dict = dict(zip(col_labels, result[i]))
			del sample_dict[col_labels[i]]	#remove self comparison
			for n_i in range(top):
				v=list(sample_dict.values())
				k=list(sample_dict.keys())
				m=v.index(max(v))
				print >> output, col_labels[i]+"\t"+k[m]+"\t"+str(v[m])
				del sample_dict[k[m]]
	elif output_type == "FULL":
		print >> output, "ID\t"+"\t".join(col_labels)
		for i in range(len(result)):
			value_str = [str(x) for x in result[i]]
			print >> output, row_labels[i]+"\t"+"\t".join(value_str)
			
	output.close()

	print >> sys.stderr, "--- %s seconds ---" % (time.time() - start_time)

main()
