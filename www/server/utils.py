#!/usr/bin/env python2.7
"""
utils.py
Misc. utilities for the server python code
"""
import math, traceback
import numpy as np

def sigDigs(x, sig=7,debug=False):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")
        return

    if debug:
        print x, type(x)

    if math.isnan(x):
        return float('NaN')

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    
    # Then convert back to a float
    return float(format % x)

def truncate(f, n):
    '''
    Truncates/pads a float f to n decimal places without rounding
    taken from http://stackoverflow.com/questions/783897/truncating-floats-in-python
    @param f: the floating point number to be truncated
    @param n: the number of decimal places we wish to keep
    @return: a float f to n decimal places without rounding
    '''
    if np.isnan(f):
        return np.NAN

    s = '{}'.format(f)
    if 'e' in s or 'E' in s:
        return '{0:.{1}f}'.format(f, n)
    i, p, d = s.partition('.')
    return '.'.join([i, (d+'0'*n)[:n]])

#this makes the function truncate easily/efficiently applyable to every cell in an  numpy array
#http://stackoverflow.com/questions/7701429/efficient-evaluation-of-a-function-at-every-cell-of-a-numpy-array
truncateNP = np.vectorize(truncate,otypes=[np.float])
