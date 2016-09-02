#!/usr/bin/env python2.7
"""
gather_attribute_values.py

Example:  gather_attribute_values.py directory Binary

Gather the values of attributes of a particular data type
"""

import sys, argparse, csv, traceback

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dir", type=str, help="the view data directory")
    parser.add_argument("--data_type", type=str, help="binary/categorical/float")
    a = parser.parse_args(args)
    
    return a

def main(opt):

    # Find the list of attributes of the given data type
    with open(opt.dir + '/Layer_Data_Types.tab', 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        for row in fin:
            if row[0].lower() == opt.data_type.lower():
                attrs = row[1:]

    # Initialize our big array and others
    rowLen = len(attrs) + 1
    nodes = ['']
    ai = 0 # attr index for columns of big array
    ni = 1 # node index for rows of big array
    vals = [['id'] + attrs] # big array

    # Find the filename for this attribute and read that file
    with open(opt.dir + '/layers.tab', 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        for row in fin:
        
            if row[0] in attrs:

                print 'ai of total:', ai, 'of', rowLen
            
                # We want this attribute's values, so open it's layer file
                ai += 1 # attr index for columns of big array
                
                with open(opt.dir + '/' + row[1], 'rU') as lay:
                    ffin = csv.reader(lay, delimiter='\t')
                    for nodeVal in ffin:
                        try:
                            ni = nodes.index(nodeVal[0])
                        
                        except ValueError:
                        
                            # initialize this node's row
                            ni = len(vals)
                            vals.append(['' for i in range(rowLen)])
                            vals[ni][0] = nodeVal[0]  # the node name
                            nodes.append(nodeVal[0])
                        
                        vals[ni][ai] = nodeVal[1]

    # Write out the big array
    with open('./attrVals.tab', 'w') as fOut:
        fOut = csv.writer(fOut, delimiter='\t')
        for row in vals:
            fOut.writerow(row)

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

