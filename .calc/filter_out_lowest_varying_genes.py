#Yulia Newton
#python2.7 filter_out_lowest_varying_genes.py --in_file input.tab --filter_level .2 --out_file test.tab

import optparse, sys, os, glob, numpy, operator, math
parser = optparse.OptionParser()
parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
parser.add_option("--filter_level", dest="filter_level", action="store", default="", help="")
parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
opts, args = parser.parse_args()

#process input arguments:
in_file = opts.in_file
try:
	filter_level = float(opts.filter_level)
except:
	print >> sys.stderr, "ERROR: --filter_level must be a float (below 1)."
	sys.exit(1)
if filter_level > 1.0:
	print >> sys.stderr, "ERROR: --filter_level must in interval [0,1]."
	sys.exit(1)
out_file_name = opts.out_file

print >> sys.stderr, "Reading in input..."
line_count = 1
variance = []
genes = []
input = open(in_file, 'r')
for line in input:
	line = line.replace("\n", "")
	if line_count > 1:
		line = line.split("\t")
		genes.append(line[0])
		line_float = [float(x) for x in line[1:]]
		variance.append(numpy.std(numpy.array(line_float)))
		
	line_count += 1

input.close()

print >> sys.stderr, "Sorting on variance..."
#sort variance
cut_proportion = int(math.ceil(len(variance) * filter_level))
var_dict = dict(zip(genes, variance))
#sorted_var_dict = sorted(var_dict.items(), key=operator.itemgetter(1))
sorted_tuples = sorted(var_dict.items(), key=lambda x:x[1])
sorted_tuples_filtered = sorted_tuples[cut_proportion:]
sorted_var_dict = dict((x, y) for x, y in sorted_tuples_filtered)
valid_genes = sorted_var_dict.keys()

print >> sys.stderr, "Outputting filtered data..."
line_count = 1
input = open(in_file, 'r')
output = open(out_file_name, 'w')
for line in input:
	line = line.replace("\n", "")
	if line_count == 1:
		print >> output, line
	else:
		line_elems = line.split("\t")
		if line_elems[0] in valid_genes:
			print >> output, line
		
	line_count += 1
input.close()
output.close()
