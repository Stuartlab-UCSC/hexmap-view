#! /usr/bin/env python2.7

# Example:
#./create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab
#python2.7 create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab

import sys, os, optparse, colorsys, math, itertools
import numpy as np
from decimal import *


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

def color_gen(num):	#http://www.8bitrobot.com/media/uploads/2011/09/colorgen.txt
	# Build list of points on a line (0 to 255) to use as color 'ticks'
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
	return colors

def main():
	parser = optparse.OptionParser()
	parser.add_option("--in_attributes", dest="in_attributes", action="store", default="", help="")
	parser.add_option("--out_file", dest="out_file", action="store", default="", help="")
	opts, args = parser.parse_args()
	
	#process input arguments:
	in_attributes = opts.in_attributes
	out_file = opts.out_file

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
		
		cols = []
		#cols = get_spaced_colors(len(a_vals)+1)
		cols = color_gen(len(a_vals)+1)
		cols = cols[1:]	#first color returned is always black, just removing it for right now, might utilize later
		#print a
		#print a_vals
		#print cols
		
		colormaps_line = a
		a_vals = list(a_vals)
		for a_v_i in range(len(a_vals)):
			#a_v_c = cols[a_v_i]
			#a_v_c_hex = '#%02x%02x%02x' % a_v_c	#this trick is from http://stackoverflow.com/questions/3380726/converting-a-rgb-color-tuple-to-a-six-digit-code-in-python
			
			a_v_c_hex = cols[a_v_i]
			a_v_v = a_vals[a_v_i]
			colormaps_line = colormaps_line  + "\t" + str(a_v_i) + "\t" + a_v_v + "\t#" + a_v_c_hex.upper()
			
		print >> output, colormaps_line
		
	output.close()
	
main()
