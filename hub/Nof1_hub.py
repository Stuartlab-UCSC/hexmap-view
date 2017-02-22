
import os.path, json, types,sys
from flask import Response
from hubUtil import *
import numpy as np

import newplacement
import compute_sparse_matrix
import leesL

# TODO where to we configure our app similar to app.config?
# these are now in the meta.jsons which we aren't reading yet???
FEATURE_SPACE_DIR = ''
VIEW_DIR = ''

# Validate an overlayNodes query
def validateNof1(data):

    # Do some basic checks on required parameters
    validateMap(data, True)
    validateLayout(data, True)
    if 'nodes' not in data:
        raise ErrorResp('nodes parameter missing or malformed')
    if not isinstance(data['nodes'], dict):
        raise ErrorResp('nodes parameter should be a dictionary')
    if len(data['nodes'].keys()) < 1:
        raise ErrorResp('there are no nodes in the nodes dictionary')
    
    # TODO if we make nodes a tsv list...
    #if not isinstance(data['nodes'], list):
    #    raise ErrorResp('nodes parameter should be a list/array')

    # Do some basic checks on optional parameters
    validateEmail(data)
    validateViewServer(data)
    if 'neighborCount' in data and \
        (not isinstance(data['neighborCount'], int) or \
        data['neighborCount'] < 1):
        raise ErrorResp('neighborCount parameter should be a positive integer')

    # Check for valid map and layout
    mapLayouts = availableMapLayouts('Nof1')
    if not data['map'] in mapLayouts:
        raise ErrorResp(
            'Map does not have any layouts with background data: ' +
            data['map'])
    if not data['layout'] in mapLayouts[data['map']]:
        raise ErrorResp('Layout does not have background data: ' +
            data['layout'])

def outputToJson(neighboorhood, xys, urls):
    '''
    This function takes the output from the newplacement call
     and puts it into the expected format
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
        retDict['nodes'][node]['neighbors'] = dict(zip(neighbors.iloc[maskArr],scores.iloc[maskArr]))
        retDict['nodes'][node]['url'] = urls[i]
        retDict['nodes'][node]['x'] = xys.loc[node,xcol]
        retDict['nodes'][node]['y'] = xys.loc[node,ycol]

    return retDict

def putDataIntoPythonStructs(featurePath,xyPath,tabSepArray):
    '''
    takes in the filenames and tab seperated array and puts in structures needed
     for placement calc
    @param featurePath:
    @param xyPath:
    @param tabSepArray:
    @return:
    '''
    return (compute_sparse_matrix.numpyToPandas(
                 *compute_sparse_matrix.read_tabular(featurePath)
                                                 ),
             leesL.readXYs(xyPath,preOrPost='pre'),
             tabArrayToPandas(tabSepArray)
             )

# The entry point from the hub URL routing
def calc(dataIn, ctx):


    validateNof1(dataIn)
    
    # Find the Nof1 data files for this map and layout

    meta = getMetaData(dataIn['map'],ctx)
    files = meta['Nof1'][dataIn['layout']]

    # Check to see if the data files exist
    # TODO: test both of these checks
    if not os.path.exists(files['fullFeatureMatrix']):
        raise ErrorResp('full feature matrix file not found: ' +
            files['fullFeatureMatrix'])

    elif not os.path.exists(files['xyPositions']):
        raise ErrorResp('xy positions file not found: ' +
            files['xyPositions'])

    else: #the files are good lets get the python structs
        referenceDF, xyDF, newNodesDF =\
             putDataIntoPythonStructs(files['fullFeatureMatrix'],
                                      files['xyPreSquiggle'],
                                      dataIn['nodes'])

    # Set any optional parms included, letting the calc script set defaults.
    if 'neighborCount' in dataIn:
        top = dataIn['neighborCount']
    else:
        top = 6

    #call the nOf1 function
    try:
        neighboorhood, xys, urls = newplacement.placeNew(newNodesDF,referenceDF,xyDF,top,num_jobs=1)
        jdict = outputToJson(neighboorhood,xys,urls)
        response = Response()
        response.data = json.dumps(jdict)
        return response

    except:
        '''
        Do what we want with the error, throw a meaningful exception that the server knows how to respond to
        '''
        # TODO Handle errors and success response
        raise ErrorResp("There was an error during nOf1")
