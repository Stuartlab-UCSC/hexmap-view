#!/usr/bin/env python2.7
"""
utils.py
Misc. utilities for the server python code
"""
import math, traceback

def sigDigs(x, sig=7):

    if sig < 1:
        raise ValueError("number of significant digits must be >= 1")
        return

    if math.isnan(x):
        return float('NaN')

    # Use %e format to get the n most significant digits, as a string.
    format = "%." + str(sig-1) + "e"
    
    # Then convert back to a float
    return float(format % x)
