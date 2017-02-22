
import os.path, json, types,sys
from argparse import Namespace
from flask import Response
from hubUtil import ErrorResp, getMetaData, isLayoutExistant, isMapExistant, log, tabArrayToPandas
import numpy as np

import newplacement
import compute_sparse_matrix
import leesL

# TODO where to we configure our app similar to app.config?
FEATURE_SPACE_DIR = '/home/duncan/dtmp_data/data/featureSpace'
VIEW_DIR = '/home/duncan/dtmp_data/data/view/'

# Validate an overlayNodes query
def validateOverlayNodes(dataIn):
    if 'map' not in dataIn:
        raise ErrorResp('Map parameter missing or malformed')

    if 'layout' not in dataIn:
        raise ErrorResp('Layout parameter missing or malformed')

    if 'nodes' not in dataIn:
        raise ErrorResp('Nodes parameter missing or malformed')

    if not isinstance(dataIn['nodes'], types.DictType):
        raise ErrorResp('Nodes parameter should result in a python dict')

    if not isMapExistant(dataIn['map']):
        raise ErrorResp('Map does not exist: ' + dataIn['map'])

    if not isLayoutExistant(dataIn['layout'], dataIn['map']):
        raise ErrorResp('Layout does not exist: ' + dataIn['layout'])

def outputToJson(neighboorhood, xys, urls):
    '''

    @param neighboorhood:
    @param xys:
    @param urls:
    @return:
    '''
    #a dictionary to populate with results
    retDict = {"nodes":{}}

    #seperating the columns of the neighborhood df
    # for processing
    newNodes  = neighboorhood[neighboorhood.columns[0]]
    neighbors = neighboorhood[neighboorhood.columns[1]]
    scores    = neighboorhood[neighboorhood.columns[2]]

    xcol = xys.columns[0]
    ycol = xys.columns[1]

    for i,node in enumerate(set(newNodes)):
        maskArr = np.array(newNodes == node)
        retDict['nodes'][node] = {}
        retDict['nodes'][node]['neighbors'] = dict(zip(neighbors.iloc[maskArr],scores.iloc[maskArr]))
        retDict['nodes'][node]['url'] = urls[i]
        retDict['nodes'][node]['x'] = xys.loc[node,xcol]
        retDict['nodes'][node]['y'] = xys.loc[node,ycol]

    return retDict

def calc(dataIn,app):

    validateOverlayNodes(dataIn)
    
    # Find the Nof1 data files for this map and layout
    meta = getMetaData(dataIn['map'])
    files = meta['Nof1'][dataIn['layout']]

    #file paths to the needed reference files
    ref_filepath = os.path.join(FEATURE_SPACE_DIR, files['fullFeatureMatrix'])
    xy_filepath  = os.path.join(VIEW_DIR, files['xyPreSquiggle'])

    #python data structures needed by function
    newNodesDF = tabArrayToPandas(dataIn['nodes'])
    referenceDF = compute_sparse_matrix.numpyToPandas(*compute_sparse_matrix.read_tabular(ref_filepath))
    xyDF        = leesL.readXYs(xy_filepath,preOrPost='pre')

    # Set optional parms
    if 'neighborCount' in dataIn:
        top = dataIn['neighborCount']
    else:
        top = 6

    try:
        neighboorhood, xys, urls = newplacement.placeNew(newNodesDF,referenceDF,xyDF,top,num_jobs=1)
        jdict = outputToJson(neighboorhood,xys,urls)
        response = Response()
        response.data = json.dumps(rc)
        return response

    except:
        '''
        Do what we want with the error, throw a meaningful exception that the server knows how to respond to
        '''
        # TODO Handle errors and success response
        response = Response()
        response.data = "there was an error with the thingy"
        return response



