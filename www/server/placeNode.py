#!/usr/bin/env python2.7
"""
This module is dedicated to placeing samples on an already existing map.


When called from main:
    all tab seperated input files are expected to have a column header and
    the 1st column as rownames
    output is currently 3 files, all with the base name specified by the
    --outputbase argument
        the three files are
            ouputbase_neighbors.tab: tab sep matrix with dimensions
            (number of new samples X --top)
            ouputbase_urls.list:  a list of urls seperated by lines
            (number of new samples X 1)
            ouputbase_xypositions.tab: tab sep matrix with dimensions
            (number of new samples X 2)
"""


import compute_sparse_matrix
import pandas as pd
import sys
import leesL
import argparse
import numpy as np

def parse_args():

    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument('-i1',"--refdata", type=str,
        help="path to reference data (tab sep matrix), "
             "i.e. data used to create 2d clustering")

    parser.add_argument('-i2',"--newNodes", type=str,
        help="path to new nodes data, tab sep matrix ",
                        default="str_attrs.tab")

    parser.add_argument('-p',"--xypositions", type=str,
        help="path to 2d clustering placement, tab sep matrix ",
                        )

    parser.add_argument('-o',"--outputbase", type=str,
                        help="output file name",
                        )

    parser.add_argument('-t',"--top", type=int,
                        help="the number of nearest neighbors to use",
                        default=6)

    parser.add_argument("--num_jobs", type=int,
                        help="number of processors to use in computation",
                        default=4
                        )
    parser.add_argument("--mapID", type=str,
                        help="name of the mapId needed for URL generation",
                        default="CKCC/v3"
                        )

    return parser.parse_args()

def placeNew(newNodesDF,referenceDF,xyDF,top,mapId,num_jobs=1):
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
        urls.append(getPlacementUrl(xys.loc[label],sampleId=label,mapID =mapId))

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

    newNodesDF,referenceDF = compute_sparse_matrix.common_rows(newNodesDF,
                                                               referenceDF)

    #chacnge pandas to nps, compute_similarities() expects numpy's
    refnp,sample_labels,feature_labels = \
        compute_sparse_matrix.pandasToNumpy(referenceDF)

    newnp,sample_labels2,feature_labels2 = \
        compute_sparse_matrix.pandasToNumpy(newNodesDF)

    #returns a data frame with first column as the new pivots, second column as the neighbor
    # and third column as the similairty score.
    neighborhoods = \
        compute_sparse_matrix.compute_similarities(refnp.transpose(),
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
        neighbors = \
            neighborhoods.loc[neighborhoods[pivCol] == sample, [neiCol]].values.flatten()
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
    url_ ="https://tumormap.ucsc.edu/?p=" + mapID + "&node=" + sampleId + \
                    "&x=" + str(x) +  "&y=" + str(y)
    return url_

def main():

    args = parse_args()
    #get filenames from args
    fin = args.refdata
    xyDF = args.xypositions
    newSamples = args.newNodes

    #needed parmaters
    mapId    = args.mapID
    top      = args.top
    num_jobs = args.num_jobs
    outbase  = args.outputbase

    #make the output file names from the given base name
    neiFile = outbase + '_neighbors.tab'
    xyFile = outbase + '_xypositions.tab'
    urlFile = outbase + '_urls.list'

    #read needed data in as pandas dataframe
    referenceDF = \
        compute_sparse_matrix.numpyToPandas(*compute_sparse_matrix.read_tabular(fin))

    newNodesDF  = \
        compute_sparse_matrix.numpyToPandas(*compute_sparse_matrix.read_tabular(newSamples))

    xyDF        = \
        leesL.readXYs(xyDF)

    #do computation
    neighboorhoods, xys, urls = placeNew(newNodesDF,referenceDF,
                                         xyDF,top,mapId,num_jobs)

    #write all output to files
    neighboorhoods.to_csv(neiFile,sep='\t',header=None,index=False)
    xys.to_csv(xyFile,sep='\t')
    np.array(urls).tofile(urlFile,sep='\n')

if __name__ == "__main__":
    sys.exit(main())