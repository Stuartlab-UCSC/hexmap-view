#!/usr/bin/env python2.7
"""
remove_empty_lines.py

Example: remove_empty_lines meta.tab meta_no_empty_lines.tab

Removes empty lines in any file, returning a file without empty lines
"""

import sys, argparse, csv, traceback

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("inputFile", type=str, help="input file")
    parser.add_argument("outputFile", type=str, help="output file")
    a = parser.parse_args(args)
    return a

def main(opt):

    print 'processing:', opt.inputFile, '...'

    # Initialize the starting values for future compares
    with open(opt.inputFile, 'rU') as fin:
        with open(opt.outputFile, 'w') as fout:
            for row in fin:
                if len(row) > 1:
                    fout.write(row)

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

