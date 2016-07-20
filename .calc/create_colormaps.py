#! /usr/bin/env python2.7

# Example:
#./create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab
#python2.7 create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab

import sys, os, optparse, colorsys, math, itertools
import numpy as np
from decimal import *
import re

def parse_args(args):
	args = args[1:]
	parser = argparse.ArgumentParser(description=__doc__, 
		formatter_class=argparse.RawDescriptionHelpFormatter)

	parser.add_argument("--in_attributes", type=str,
		help="attributes table file")
	parser.add_argument("--out_file", type=str,
		help="output file name")		
   
	return parser.parse_args(args)	

def get_spaced_colors(n):	#appropriated someone else's implementation from the StockOverflow (need to place the URL here)
	max_value = 16581375 #255**3
	interval = int(max_value / n)
	colors = [hex(I)[2:].zfill(6) for I in range(0, max_value, interval)]
	return [(int(i[:2], 16), int(i[2:4], 16), int(i[4:], 16)) for i in colors]

def MidSort(lst):	#http://www.8bitrobot.com/media/uploads/2011/09/colorgen.txt
	if len(lst) <= 1:
		return lst
	i = int(len(lst)/2)
	ret = [lst.pop(i)]
	left = MidSort(lst[0:i])
	right = MidSort(lst[i:])
	interleaved = [item for items in itertools.izip_longest(left, right)
	for item in items if item != None]
	ret.extend(interleaved)
	return ret

def color_brew_8_1(num):
	# http://colorbrewer2.org Qualitative, 9-class Set1, minus the grey
	cols = [
		'e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00', '#ffff33', 'a65628', 'f781bf'
	]
	return cols[:num]

def color_brew_11_3(num):
	# http://colorbrewer2.org Qualitative, 12-class Set3, minus the grey
	cols = [
		'8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462', 'b3de69', 'fccde5', 'bc80bd', 'ccebc5', 'ffed6f'
	]
	return cols[:num]

def color_gen(numIn, method):	#http://www.8bitrobot.com/media/uploads/2011/09/colorgen.txt

	if method == '11_3' and numIn < 12:
		return color_brew_11_3(numIn)
	elif method == '8_1' and numIn < 8:
		return color_brew_8_1(numIn)

	# Build list of points on a line (0 to 255) to use as color 'ticks'
	num = numIn + 1
	max = 255
	segs = int(num**(Decimal("1.0")/3))
	step = int(max/segs)
	p = [(i*step) for i in xrange(1,segs)]
	points = [0,max]
	points.extend(MidSort(p))

	# Not efficient!!! Iterate over higher valued 'ticks' first (the points
	#   at the front of the list) to vary all colors and not focus on one channel.
	colors = ["%02X%02X%02X" % (points[0], points[0], points[0])]
	range = 0
	total = 1
	while total < num and range < len(points):
		range += 1
		for c0 in xrange(range):
			for c1 in xrange(range):
				for c2 in xrange(range):
					if total >= num:
						break
					c = "%02X%02X%02X" % (points[c0], points[c1], points[c2])
					if c not in colors:
						colors.append(c)
						total += 1
	return colors[1:]

def create_colormaps_file(in_attributes, out_file):
	#read input file (tabular attributes file):
	input = open(in_attributes, "r")
	line_num = 1
	attributes = []
	values = []
	for line in input:
		line = line.replace("\n","")	#don't want to strip in case some attribute values are empty at the end of the line
		line = line.split("\t")
		if line_num == 1:	#header line
			attributes = line[1:]
		else:
			values.append(line[1:])
		
		line_num += 1
	input.close()
	
	values_t = [list(v) for v in zip(*values)]
	
	output = open(out_file, 'w')
	for a_i in range(len(attributes)):
		a = attributes[a_i]
		a_vals = set(values_t[a_i])
		
		if '' in a_vals:
			a_vals.remove('')
		if 'NA' in a_vals:
			a_vals.remove('NA')
		
		#figure out the type of the variable and only create mapping for categorical variables:
		#if all(type(x)==int or type(x)==float or type(x)==long for x in a_vals):	#variable is continuous
		if len(a_vals) == 2 and all((x == "1" or x == "0") for x in a_vals):	#variable is binary
			print a +" attribute is treated as binary"
		elif all(re.match( '^[-+]?(([0-9]+([.][0-9]*)?)|(([0-9]*[.])?[0-9]+))$', x) for x in a_vals):
			print a + " attribute is treated as continuous"
		else:	#convert
			#cols = get_spaced_colors(len(a_vals)+1)
			cols = color_gen(len(a_vals), 'orig')
			colormaps_line = a
			a_vals = list(a_vals)
			for a_v_i in range(len(a_vals)):
				#a_v_c = cols[a_v_i]
				#a_v_c_hex = '#%02x%02x%02x' % a_v_c	#this trick is from http://stackoverflow.com/questions/3380726/converting-a-rgb-color-tuple-to-a-six-digit-code-in-python
			
				a_v_c_hex = cols[a_v_i]
				a_v_v = a_vals[a_v_i]
				colormaps_line = colormaps_line  + "\t" + str(a_v_i) + "\t" + a_v_v + "\t#" + a_v_c_hex.upper()
			
		print >> output, colormaps_line

def cat_files(inputs, out_file):	#concatenate multiple colormaps files
	input_files = inputs.split(";")
	output = open(out_file, "w")
	for f in input_files:
		input = open(f, "r")
		for line in input:
			output.write(line)
			#print >> output, line.strip()
		input.close()
	output.close()

def main(args):
	sys.stdout.flush()
	opts = parse_args(args)
	
	#process input arguments:
	in_attributes = opts.in_attributes
	out_file = opts.out_file

	create_colormaps_file(in_attributes, out_file)
		
	output.close()

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
