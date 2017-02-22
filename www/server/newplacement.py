#!/usr/bin/env python2.7
"""
This module is dedicated to placeing samples on an already existing map.
Currently this functionality can not be called from main
"""


import compute_sparse_matrix
import pandas as pd
import sys
import leesL
import argparse

def parse_args(args):
    '''
    THIS ISN"T FULLY IMPLEMENTED
    @param args:
    @return:
    '''
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    # swat: We should be able to add 'required=True' to some args so the parser
    # will tell the user when they are left out. --directory should be required
    # since scripts get confused with relative paths sometimes.
    fins = []
    parser.add_argument('-i',"--codedAttrs", type=str,nargs='+',
                        help="Input: attributes/meta data tsv files separated by space",metavar=fins)

    parser.add_argument('-o',"--strAttrs", type=str,
        help="name of output file, defaults to str_attrs.tab",
                        default="str_attrs.tab")

    parser.add_argument('-c',"--colormaps", type=str,
                        help="path to a previously generated colormapping file",
                        )

    return parser.parse_args(args)

def placeNew(newNodesDF,referenceDF,xyDF,top,num_jobs=1):
    '''

    @return:
    '''
    #grab the sample names
    sample_labels = newNodesDF.columns
    #compute neighborhood for each sample
    neighborhoods = getNeighbors(newNodesDF,referenceDF,top,num_jobs)
    #compute new x-y positions
    xys = getNewPostions(neighborhoods,xyDF)

    #stich together the URLs for each sample
    urls = []
    for label in sample_labels:
        urls.append(getPlacementUrl(xys.loc[label],sampleId=label,mapID='CKCC/v3'))

    return neighborhoods,xys,urls

def getNeighbors(newNodesDF,referenceDF,top,num_jobs=1):
    '''
    returns newNodes similairty with nodes on previous map,
            the xy positions for those new nodes

    given a set of nodes not currently on the map1
    @param newNodesDF:
    @param referenceDF:
    @param attrDF:
    @param xyDF:
    @param top:
    @return:
    '''

    newNodesDF,referenceDF = compute_sparse_matrix.common_rows(newNodesDF,referenceDF)

    #chacnge pandas to nps, compute_similarities() expects numpy's
    refnp,sample_labels,feature_labels = compute_sparse_matrix.pandasToNumpy(referenceDF)
    newnp,sample_labels2,feature_labels2 = compute_sparse_matrix.pandasToNumpy(newNodesDF)
    #returns a data frame with first column as the new pivots, second column as the neighbor
    # and third column as the similairty score.
    neighborhoods = compute_sparse_matrix.compute_similarities(refnp.transpose(),
                                                           sample_labels,
                                                           "spearman",
                                                           num_jobs,
                                                           "SPARSE",
                                                           top,
                                                           log=None,
                                                           dt2=newnp.transpose(),
                                                           sample_labels2=sample_labels2)
    return neighborhoods

def getNewPostions(neighborhoods,xyDF):

    #grab the accessor of the 'x' and 'y' columns
    # this way we aren't tied down to the column names,
    # assumes pivots are in the first column
    pivCol = neighborhoods.columns[0]
    neiCol = neighborhoods.columns[1]

    #get the new nodes ids
    sample_labels = set(neighborhoods[pivCol])
    #data frame to hold the x-y positions of the new nodes
    xyRet = pd.DataFrame(index=sample_labels,columns=['x','y'])

    #go through and find the median of all the points for placement.
    for sample in sample_labels:
        #grab the nearest neighbors.
        neighbors = neighborhoods.loc[neighborhoods[pivCol] == sample, [neiCol]].values.flatten()
        #add the x-y position to the dataframe
        xyRet.loc[sample] =  xyDF.loc[neighbors].median(axis=0).values

    return xyRet

def getPlacementUrl(xy,sampleId='',mapID='CKCC/v3'):
    '''
    returns the URL for which to view the new sample on a map.
    @param xy:
    @param sampleId:
    @param mapID:
    @return:
    '''
    x=xy[0]
    y=xy[1]
    url_ ="https://tumormap.ucsc.edu/?p=CKCC/v3&node=" + sampleId + \
                    "&x=" + str(x) +  "&y=" + str(y)
    return url_

def main(args):
    '''
    This isn't implemented yet
    @param args:
    @return:
    '''

    args = parse_args(args)
    fin = args.fin
    xyDF = args.xys
    newSamples = args.newsamples
    top = args.top
    num_jobs = args.num_jobs

    '''
    fin = '/home/duncan/dtmp_data/data/v3/data0.tab'
    xyDF = '/home/duncan/dtmp_data/data/v3/assignments0.tab'
    newSamples = '/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/in/layout/nOf1Vector.tab'
    '''
    #read them in as pandas dataframe
    referenceDF = compute_sparse_matrix.numpyToPandas(*compute_sparse_matrix.read_tabular(fin))
    newNodesDF  = compute_sparse_matrix.numpyToPandas(*compute_sparse_matrix.read_tabular(newSamples))
    xyDF        = leesL.readXYs(xyDF,header=False)
    #do the computation
    neighboorhoods, xys, urls = placeNew(newNodesDF,referenceDF,xyDF,top,num_jobs=1)

    #now what are we doing with these when called from main?
    print 'the main function is not implemented completely'
    sys.exit(1)