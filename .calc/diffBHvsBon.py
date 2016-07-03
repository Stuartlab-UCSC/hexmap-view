#!/usr/bin/env python2.7
"""
diffBHvsBon.py
This reports differences between the BenjaminiWhitney-FDR p-value correction
vs. the Bonferroni
"""

import sys, os, csv, traceback, glob

def diffBHvsBon():
    #basePath = '/Users/swat/data/mcrchopra/first/'
    #tmpBase = '/Users/swat/tmp/'
    tmpBase = '/cluster/home/swat/tmp/'
    basePath = '/cluster/home/swat/data/Pancan12/mar28/'
    
    # Build a list of layer names with index corresponding to the layers
    layers = glob.glob(basePath + 'layer_*.tab')
    layerIndex = ['empty' for x in range(len(layers))]
    filename = os.path.join(basePath, 'layers.tab')
    with open(filename, 'r') as fOut:
        fOut = csv.reader(fOut, delimiter='\t')
        
        for i, line in enumerate(fOut.__iter__()):
            # layer_2044.tab
            j = int(line[1][6:-4])
            layerIndex[j] = line[0]

    # Save each stats whose two p-value corrections are the same
    #searches =['statsL_*']
    searches =['stats_*', 'statsL_*']
    outFiles = [
        'stats_sameBHvsBon.tab',
        'statsL_sameBHvsBon.tab',
    ]
    i = 0;
    same = 0
    diff = 0
    for search in searches:
        search = basePath + search
        files = glob.glob(search)
        with open(tmpBase + outFiles[i], 'w') as fOut:
            fOut = csv.writer(fOut, delimiter='\t')
            #fOut.writerow(['#p-value correction', 'layer1', 'layer2'])
            for file in files:
                if search[-8:-2] != 'statsL':
                    layer1 = layerIndex[int(file[len(basePath) + 6:-4])]
                with open(file, 'r') as f:
                    f = csv.reader(f, delimiter='\t')
                    for i, line in enumerate(f.__iter__()):
                        # stats_*: TP63_expression altered 0.0003403091    0.0005671818    0.0005671818
                        if line[2] == line[3]:
                            same += 1
                            #fOut.writerow([line[3], layer1, line[0]])
                        else:
                            diff += 1
                            
            fOut.writerow(['same: ' + str(same) + ', diff: ' + str(diff)])
        i += 1
    return 0

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = diffBHvsBon()
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
