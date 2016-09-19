#!/usr/bin/env python2.7
"""
extract_node_subset.py: extract a subset of nodes from any data file.
The file may be genomic or attribute data and a file with a list of nodes
must be supplied. an example:

python2.7 extract_node_subset.py --node_axis x --ID_file nodes.tab --in_file <input.file> -- out_file <output.file>

"""
import sys, argparse, traceback, csv

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    
    parser.add_argument("--node_axis", "-a", type=str, help="'x' for nodes across top, 'y' otherwise")
    parser.add_argument("--ID_file", "-n", type=str, help="file of node IDs to be extracted, one per line")
    parser.add_argument("--in_file", "-i", type=str, help="input data file")
    parser.add_argument("--out_file", "-o", type=str, help="output data file")

    a = parser.parse_args(args)
    return a

def extractColumns(opt, nodes):

    # Find all node IDs in the file
    with open(opt.in_file, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        allNodes = fin.next()[1:];

    # Build a list of column indices that we want to extract
    keep = []
    for i, node in enumerate(allNodes):
        if node in nodes:
            keep.append(i)

    # Write out the columns we want to keep
    with open(opt.in_file, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        with open(opt.out_file, 'w') as fout:
            fout = csv.writer(fout, delimiter='\t')
            for i, row in enumerate(fin.__iter__()):
                orow = [row[0]]
                for j in keep:
                    orow.append(row[j])
                fout.writerow(orow)

    return 0;

def extractRows(opt, nodes):
    
    # Write out the rows we want to keep
    with open(opt.in_file, 'rU') as fin:
        fin = csv.reader(fin, delimiter='\t')
        with open(opt.out_file, 'w') as fout:
            fout = csv.writer(fout, delimiter='\t')
            for i, row in enumerate(fin.__iter__()):
                if i == 0:
                    fout.writerow(row)
                elif row[0] in nodes:
                    fout.writerow(row)

    return 0;

def extractNodeSubset(opt):

    # load the nodes
    nodes = []
    with open(opt.ID_file, 'rU') as fin:
        for row in fin:
            if len(row) > 1:
                nodes.append(row[:-1])

    if opt.node_axis == 'x':
        extractColumns(opt, nodes)
    else:
        extractRows(opt, nodes)

    return 0


if __name__ == "__main__" :
    try:
         return_code = extractNodeSubset(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
        
    sys.exit(return_code)
