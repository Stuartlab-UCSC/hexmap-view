#!/usr/bin/env python2.7
"""
replace_NA_attribute_values_with_null.py

Example: replace_NA_attribute_values_with_null.py meta.cleaned.tab meta_no_NA.tab

In an attribute file, replace all 'n/a', and 'na', case-insensitive, with nulls
and write the results to another file.
"""

import sys, argparse, csv, traceback

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input_file", type=str, help="input file")
    parser.add_argument("output_file", type=str, help="output file")
    a = parser.parse_args(args)
    return a

def get_xlate(row):
    i = 1
    code = 0
    xlate = []
    while True:
        try:
            j = int(row[i])
            str = row[i+1]
            xlate.insert(j, str)
            i += 3
        except:
            break;

    return xlate

def main(opt):

    print 'processing:', opt.input_file
    
    with open(opt.input_file, 'rU') as fin:
        with open(opt.output_file, 'w') as fout:
            fin = csv.reader(fin, delimiter='\t')
            fout = csv.writer(fout, delimiter='\t')
            
            first = True
            
            for row in fin:
            
                if first:
                
                    # write the header as is
                    fout.writerow(row)
                    first = False
                    continue
                
                outRow = []
                for value in row:
                    val = value.strip()
                    val = val.lower()
                    if val == 'na' or val == 'n/a':
                        value = ''
                    outRow.append(value)
                    
                fout.writerow(outRow)

    print 'done'

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

