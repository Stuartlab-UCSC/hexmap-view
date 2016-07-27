#Yulia Newton
#python2.7 convert_annotation_to_tumormap_mapping.py --in_colormap clin_all.datafreeze.tumormap.colormaps.tab --in_attributes clin_all.datafreeze.heatmaps.tab --filter_attributes_flag TRUE --output temp7.tab

import optparse, sys, os, glob
from itertools import imap
import itertools

def parse_args(args):
	args = args[1:]
	parser = argparse.ArgumentParser(description=__doc__, 
		formatter_class=argparse.RawDescriptionHelpFormatter)

	parser.add_argument("--in_colormap", type=str,
		help="colormaps file")
	parser.add_argument("--in_attributes", type=int, default=6,
		help="attributes file to convert to the colormaps mappings")
	parser.add_argument("--filter_attributes_flag",type=str, default="False",
		help="filter out attributes for which the mapping is not present in the colormaps file (valid values: True, T, False, F)")
	parser.add_argument("--output", type=str,
		help="output file name")		
   
	return parser.parse_args(args)	

def convert_attributes_colormaps_mapping(in_colormap, in_attributes, filter_attributes_flag, output):
	#go through annotation file and get the annotations:
	attribute_dict = {}
	colormap = open(in_colormap, 'r')
	for line in colormap:
		line_elems = line.strip().split("\t")
		attribute_dict[line_elems[0]] = {}
	
		mapping_elems = line_elems[1:]
		mapping_numeric = mapping_elems[::3]
		mapping_elems = mapping_elems[1:]
		mapping_labels = mapping_elems[::3]
	
		if not(len(mapping_numeric) == len(mapping_labels)):
			print >> sys.stderr, "ERROR: invlaid mapping on line "+line_elems[0]
			sys.exit(1)
	
		for i in range(len(mapping_numeric)):
			attribute_dict[line_elems[0]][mapping_labels[i]] = mapping_numeric[i]

	colormap.close()

	attributes = open(in_attributes, 'r')
	out_file = open(output, 'w')
	line_num = 0
	attribute_names = []
	attribute_indices = []
	check_attribute_values = {}
	for line in attributes:
		line_elems = line.strip().split("\t")
		if line_num == 0:
			attribute_names = line_elems[1:]
			if filter_attributes_flag == False:
				attribute_indices = range(len(attribute_names))
				output_attribute_names = attribute_names
				for a in attribute_names:
					check_attribute_values[a] = set()
			else:
				new_attribute_names = []
				new_attribute_indices = []
				ind = 0
				for a in attribute_names:
					if a in attribute_dict:
						new_attribute_names.append(a)
						new_attribute_indices.append(ind)
						check_attribute_values[a] = set()
					ind += 1
				output_attribute_names = new_attribute_names
				attribute_indices = new_attribute_indices
		
			print >> out_file, line_elems[0]+"\t"+"\t".join(output_attribute_names)
		else:
			output_values = []
			for e_i in range(len(line_elems[1:])):
				a = attribute_names[e_i]
				if e_i in attribute_indices:
					if a in attribute_dict:
						e_v = line_elems[e_i+1]

						if e_v == "NA":
							if e_v in attribute_dict[a]:
								e_v_i = attribute_dict[a][e_v]
							else:
								e_v_i = ""
						elif len(e_v) == 0:
							e_v_i = ""
						else:
							if not(e_v in attribute_dict[a]) and (len(e_v) > 0) and not(e_v == "NA"):
								print >> sys.stderr, "ERROR: attribute "+a+" contains a value that has no mapping: "+e_v
								sys.exit(1)
											
							e_v_i = attribute_dict[a][e_v]
					else:
						e_v_i = line_elems[e_i+1]
				
					check_attribute_values[a].add(line_elems[e_i+1])
					output_values.append(e_v_i)
		
			print >> out_file, line_elems[0]+"\t"+"\t".join(output_values)
	
		line_num += 1
	
	out_file.close()
	attributes.close()

	for a in attribute_dict.keys():
		a_vals = attribute_dict[a].keys()
		if a in check_attribute_values:
			a_vals_check = check_attribute_values[a]
			for v in a_vals:
				if not(v in a_vals_check):
					print >> sys.stderr, v +" value of "+a+" attribute in colormaps is not present in the data"

def main(args):	
	sys.stdout.flush()
	opts = parse_args(args)
		
	#process input arguments:
	in_colormap = opts.in_colormap
	in_attributes = opts.in_attributes
	filter_attributes_str = opts.filter_attributes_flag.upper()
	filter_attributes_flag = False
	if filter_attributes_str == "TRUE" or filter_attributes_str == "T":
		filter_attributes_flag = True
	else:
		if not(filter_attributes_str == "FALSE" or filter_attributes_str == "F"):
			raise Exception("ERROR: filter_attributes_flag must be TRUE or FALSE")
	output = opts.output
	
	convert_attributes_colormaps_mapping(in_colormap, in_attributes, filter_attributes_flag, output)

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
