# Perform the calculations for n-of-1 analysis


import os.path, json, types,sys
import numpy as np
import pandas as pd
import placeNode
import compute_sparse_matrix
import utils
import StringIO

def outputToDict(neighboorhood, xys, urls):
    '''
    This function takes the output from the newplacement call
      into the expected format
    @param neighboorhood: pandas df
    @param xys: pandas df
    @param urls: an array of URLs
    @return: dictionary to be turned into a JSON str
    '''
    #return dictionary to populate with results
    retDict = {"nodes":{}}

    #seperating the columns of the neighborhood df
    # for processing
    newNodes  = neighboorhood[neighboorhood.columns[0]]
    neighbors = neighboorhood[neighboorhood.columns[1]]
    scores    = neighboorhood[neighboorhood.columns[2]]
    #grab column names for indexing
    xcol = xys.columns[0]
    ycol = xys.columns[1]

    for i,node in enumerate(set(newNodes)):
        maskArr = np.array(newNodes == node)
        retDict['nodes'][node] = {}
        retDict['nodes'][node]['neighbors'] = dict(zip(neighbors.iloc[maskArr],
                                                       scores.iloc[maskArr]))
        #add urls to the return struct
        #retDict['nodes'][node]['url'] = urls[i]
        retDict['nodes'][node]['x'] = xys.loc[node,xcol]
        retDict['nodes'][node]['y'] = xys.loc[node,ycol]

    return retDict


def putDataIntoPythonStructs(featurePath,xyPath,nodesDict):
    '''
    takes in the filenames and nodes dictionary needed for placement calc
    @param featurePath:
    @param xyPath:
    @param tabSepArray:
    @return:
    '''
    return (compute_sparse_matrix.numpyToPandas(
            *compute_sparse_matrix.read_tabular(featurePath)
                                                ),
            utils.readXYs(xyPath),
            nodesToPandas(nodesDict)
          )

def nodesToPandas(pydict):
    '''
    input the json['nodes'] structure and outputs pandas df
    This looks crazy because we needed to read in the new node data
    in the same way as the original feature matrix.
    @param pydict: the dataIn['nodes'] structure,
                   currently a dict of dicts {columns -> {rows -> values}}
    @return: a pandas dataframe
    '''
    df = pd.DataFrame(pydict)
    s_buf = StringIO.StringIO()
    #dump pandas data frame into buffer
    df.to_csv(s_buf,sep='\t')
    s_buf.seek(0) 
    return compute_sparse_matrix.numpyToPandas(
            *compute_sparse_matrix.read_tabular(s_buf)
                                                )


def entryPointFromWebApi(opts):

    if not hasattr(opts, 'top'):
        opts.top = 6

    # the files are good because the web handler has already checked that they
    # exist. lets get the python structs
    referenceDF, xyDF, newNodesDF =\
         putDataIntoPythonStructs(opts.fullFeatureMatrix,
                                  opts.xyPositions,
                                  opts.newNodes)
    #call the nOf1 function
    neighboorhood, xys, urls = placeNode.placeNew(newNodesDF,referenceDF,
                                                  xyDF,opts.top,opts.mapId,
                                                  num_jobs=1)
    retDict = outputToDict(neighboorhood,xys,urls)
    return retDict


