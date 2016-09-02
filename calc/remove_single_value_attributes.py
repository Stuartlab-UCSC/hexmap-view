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

    print 'processing:', opt.inputFile

    # Initialize the starting values for future compares
    try:
        ffin = open(opt.inputFile, 'rU')
    except:
        print 'no input file:', opt.inputFile
        return 0
        
    fin = csv.reader(ffin, delimiter='\t')
    row = fin.next()  # the header
    
    #last = fin.next()  # this holds the last value of each attribute

    try:
        last = fin.next()  # this holds the last value of each attribute
    except:
        print 'no data so nothing to remove for:', opt.inputFile
        return 0
    
    
    # Build a list of columns we want to keep, storing their column index
    keep = []
    for i, row in enumerate(fin.__iter__()):
        for j, val in enumerate(row):
            try:
                if j not in keep and (j >= len(last) or row[j] != last[j]):
                    keep.append(j)
            except:
                print 'j:', j
                print 'val:', val
                print 'last:', last
                print 'row:', row
        
    ffin.close()

    #print 'Writing', len(keep), 'out of', len(last), 'attributes which had more than one value.'

    # Write only the columns we want to keep
    with open(opt.inputFile, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        
        with open(opt.outputFile, 'w') as fout:
            fout = csv.writer(fout, delimiter='\t')
            
            for i, row in enumerate(fin.__iter__()):
                orow = []
                for j in keep:
                    if j < len(row):
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

