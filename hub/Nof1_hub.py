
import os.path, json, types
from argparse import Namespace
from flask import Response
from hubUtil import ErrorResp, getMetaData, isLayoutExistant, isMapExistant, log
import Nof1

# TODO where to we configure our app similar to app.config?
FEATURE_SPACE_DIR = '/Users/swat/data/featureSpace'
VIEW_DIR = '/Users/swat/data/view'

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

def calc(dataIn, app):

    validateOverlayNodes(dataIn)
    
    # Find the Nof1 data files for this map and layout
    meta = getMetaData(map)
    files = meta['Nof1'][dataIn['layout']]
    
    # Create a namespace to simulate that returned by parseargs
    opts = Namespace(
        fullFeatureMatrixFile = os.path.join(
            FEATURE_SPACE_DIR, files['fullFeatureMatrix']),
        xyPreSquiggle = os.path.join(
            VIEW_DIR, files['xyPreSquiggle']),
        newNodes = dataIn['nodes'],
    )
    
    # Set any optional parms included
    if 'neighborCount' in dataIn:
        opts.neighborCount = dataIn['neighborCount']

    # Call the calc script
    # TODO spawn a process
    rc = Nof1.viaHub(opts)
    
    # TODO Handle any errors and success response
    #response = Response()
    #response.data = json.dumps(rc)
    #return response
