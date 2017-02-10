#!/usr/bin/env python2.7
"""
NOTE THAT THIS WAS NOT COMPLETED BUT MAY BE OF USE SOMEDAYZZ
"""
"""
build_pre_coded_attrs.py

Usage: build_pre_coded_attrs.py <coded-attribute-filename> <colormap-filename>

Build a source attribute file given a coded attribute file and a colormap. 
Useful when you've lost the original source attribute file containing strings.
The output is a file with the same name given in the command line with 'strings'
appended.
"""

import sys, argparse, csv, traceback, pprint

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("codedAttrs", type=str,
        help="coded attribute file name")
    parser.add_argument("colormap", type=str, help="colormap file name")
    a = parser.parse_args(args)
    return a

def main(opt):

    # Load the colormap
    colormap = {}
    with open(opt.colormap, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        for row in fin:
            attr = row[0]
            cats = []
            index = None
            cat = None
            for col in row[1:]:
                if index is None:
                    index = col
                elif cat is None:
                    cat = col
                else:
                    # Skip the color code and add the category to the list of
                    # categories for this attribute
                    cats.append(cat)
                    index = cat = None
            colormap[attr] = cats
    
    print 'colormap:', pprint.pprint(colormap, indent=4)

    # Write out the stringed attr file as we read the coded attr file
    with open(opt.codedAttrs, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        with open(opt.codedAttrs + 'stringed', 'w') as fout:
            fout = csv.writer(fout, delimiter='\t')
            for i, row in enumerate(fin.__iter__()):
                if i == 0:
                    
                    # write the header line
                    fields = row
                    print 'fields:', fields
                    fout.writerow(fields)
            
                else:
                
                    # initialize the out row with the node ID
                    outRow = [row[0]]
                    
                    for j, col in enumerate(row[1:].__iter__()):
                        print 'col:', col
                        if fields[j] in colormap:
                            print 'col:', col
                            print 'fields[j]:', fields[j]

                            #print colormap[fields(j)]:', colormap[fields(j)]
                            #str = colormap[fields[j]][col]
                            #print 'str:', str
                            #outRow.append[str]
                        #else:
                            #outRow.append(col)

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

