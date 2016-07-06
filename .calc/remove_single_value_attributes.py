#!/usr/bin/env python2.7
"""
remove_single_value_attributes.py

Example:  remove_single_value_attributes.py meta.tab metaWithVals.tab

In an attributes file, remove any attribute columns where all the values
are identical.
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

    # Look for more than one value for each attribute
    keep = [] # this holds column indices that have more than one value
    with open(opt.inputFile, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        row = fin.next()  # the header
        last = fin.next()  # this holds the last value of each attribute
        #for i, row in enumerate(fin.__iter__()):
        for i, row in enumerate(fin.__iter__()):
            for j, val in enumerate(row):
                if j not in keep and row[j] != last[j]:
                    keep.append(j)

    print 'Writing', len(keep), 'out of', len(last), 'attributes which had more than one value.'
        
    # Write out the columns we want to keep
    with open(opt.inputFile, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        with open(opt.outputFile, 'w') as fout:
            fout = csv.writer(fout, delimiter='\t')
            for i, row in enumerate(fin.__iter__()):
                orow = []
                for j in keep:
                    orow.append(row[j])
                fout.writerow(orow)

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

