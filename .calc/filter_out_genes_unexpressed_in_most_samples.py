#Yulia Newton
#python2.7 filter_out_genes_unexpressed_in_most_samples.py --in_file input.tab --proportion_unexpressed 0.8 --out_file test.tab

import optparse, sys, os, glob
parser = optparse.OptionParser()
parser.add_option("--in_file", dest="in_file", action="store", default="", help="")
parser.add_option("--proportion_unexpressed", dest="proportion_unexpressed", action="store", default="", help="")
parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
opts, args = parser.parse_args()

#process input arguments:
in_file = opts.in_file
try:
	proportion_unexpressed = float(opts.proportion_unexpressed)
except:
	print >> sys.stderr, "ERROR: --proportion_unexpressed must be a float (below 1)."
	sys.exit(1)
if proportion_unexpressed > 1.0:
	print >> sys.stderr, "ERROR: --proportion_unexpressed must in interval [0,1]."
	sys.exit(1)
out_file_name = opts.out_file

line_count = 1
input = open(in_file, 'r')
output = open(out_file_name, 'w')
for line in input:
	line = line.replace("\n", "")
	if line_count == 1:
		print >> output, line
	else:
		line = line.split("\t")
		line_header = line[0]
		line_elems = line[1:]
		line_float = [float(x) for x in line_elems]
		line_zeros = [i for i in line_float if i == 0.0]
		proportion = float(len(line_zeros)) / float(len(line_float))
		if proportion < proportion_unexpressed:
			print >> output, line_header + "\t" + "\t".join(line_elems)
		
	line_count += 1
input.close()
output.close()
