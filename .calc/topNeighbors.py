#!/usr/bin/env python2.7
"""
topNeighbors.py: Find the top N neighbors of each node from the similarity files
and save this to the directory from which the tumor map pulls data.
"""
import os, sys, argparse, csv, operator, datetime, pprint, traceback

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__, 
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument("similarity", type=str, nargs='+',
        help="the unopened files of similarity matrices")
    parser.add_argument("--sourceDirectory", "-s", type=str, default=".",
        help="directory in which to find source data files")
    parser.add_argument("--directory", "-d", type=str, default=".",
        help="directory in which to create files as input to the tumor map")
    parser.add_argument("--top", "-t", type=str, default="6",
        help="number of neighbors to find for each node")
   
    return parser.parse_args(args)

def topNeighbors(similarity, directory, topIn):
    top = int(topIn)
    for i, file in enumerate(similarity.__iter__()):
        sims = []
        fIn = open(file, 'r')
        sims = list(csv.reader(fIn, delimiter='\t'))
        fIn.close()
    
        with open(os.path.join(directory, 'neighbors_' + str(i) + '.tab'), 'w') as fOut:
            fOut = csv.writer(fOut, delimiter='\t', lineterminator='\n')
            tops = [] # A place to store the top neighbors
            node0 = sims[0][0] # Save the first node name
            
            for j, sim in enumerate(sims.__iter__()):
                if sim[0] == node0:
                    if len(tops) < top:
                    
                        # Initialize the top neighbors
                        tops.append(sim)
                    else:
                    
                        # Update the top neighbors if this one is closer
                        tops = sorted(tops, key=lambda x: float(x[2]), reverse=True)
                        if sim[2] > tops[top-1][2]:
                            tops[top-1] = sim
                else:
                
                    # Write this node's top neighbors
                    fOut.writerow([node0] + map(lambda x: x[1], tops))
                    node0 = sim[0]
                    tops = []
            # Write the last node's top neighbors
            fOut.writerow([node0] + map(lambda x: x[1], tops))
    print timestamp(), 'Found top neighbors'

def topNeighbors_from_sparse(sparse, out_directory, topIn, i):
    top = int(topIn)
    #print sparse
    
    elem_dict = {}
    elems = []
    for line in sparse.split("\n"):
        if len(line) > 0:
            line_elems = line.split("\t")
            if not (line_elems[0] in elem_dict):
                elem_dict[line_elems[0]] = []
            elem_dict[line_elems[0]].append(line_elems[1])
            if not(line_elems[0] in elems):
                elems.append(line_elems[0])
    
    output = open(os.path.join(out_directory, 'neighbors_' + str(i) + '.tab'), 'w')
    for e in elems:
        if len(elem_dict[e]) < top:
            this_top = len(elem_dict[e])
        else:
            this_top = top
        print >> output, "\t".join(elem_dict[e][0:this_top])
    
    output.close()
    
    print timestamp(), 'Found top neighbors'

def main(args):
    print timestamp(), 'Finding top neighbors'
    sys.stdout.flush()
    options = parse_args(args)
    for i, file in enumerate(options.similarity.__iter__()):
        options.similarity[i] = options.sourceDirectory + '/' + options.similarity[i]
    return topNeighbors(options.similarity, options.directory, options.top)

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
         return_code = main(sys.argv)
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
