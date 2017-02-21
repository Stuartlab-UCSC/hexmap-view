
import os.path, json, types
from argparse import Namespace
from flask import Response
from hubUtil import ErrorResp, log, getMetaData, availableMapLayouts
from hubUtil import validateMap, validateLayout, validateEmail, \
    validateViewServer
import Nof1

# Validate an overlayNodes query
def validateNof1(data):

    # Do some basic checks on required parameters
    validateMap(data, True)
    validateLayout(data, True)
    if 'nodes' not in data:
        raise ErrorResp('nodes parameter missing or malformed')
    if not isinstance(data['nodes'], dict):
        raise ErrorResp('nodes parameter should be a dictionary')
        
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

# The entry point from the hub URL routing
def calc(dataIn, ctx):

    validateNof1(dataIn)
    
    # Find the Nof1 data files for this map and layout
    meta = getMetaData(map, ctx)
    files = meta['layouts'][dataIn['layout']]
    
    # Check to see if the data files exist
    # TODO: test both of these checks
    if not os.path.exists(files['fullFeatureMatrix']):
        raise ErrorResp('full feature matrix file not found: ' +
            files['fullFeatureMatrix'])

    if not os.path.exists(files['xyPositions']):
        raise ErrorResp('xy positions file not found: ' +
            files['xyPositions'])

    # Put the options to be passed to the calc script in a Namespace object,the
    # same object returned by argparse.parse_args().
    opts = Namespace(
        fullFeatureMatrix = files['fullFeatureMatrix'],
        xyPositions = files['xyPositions'],
        newNodes = dataIn['nodes'],
    )
    
    # Set any optional parms included, letting
    # defaults be set by the calc script.
    if 'neighborCount' in dataIn:
        opts.neighborCount = dataIn['neighborCount']

    # Call the calc script
    # TODO spawn a process
    rc = Nof1.whateverRoutine(opts)
    
    # TODO Handle errors and success response,
    # generate URLs
    #
    #response = Response()
    #response.data = json.dumps(rc)
    #return response
