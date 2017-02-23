
import os.path, json, types, requests
from argparse import Namespace
from flask import Response
from hubUtil import SuccessResp, ErrorResp, getMetaData, availableMapLayouts
from hubUtil import validateMap, validateLayout, validateEmail, \
    validateViewServer
import Nof1_stub

def validateParameters(data):

    # Validate an overlayNodes query

    # Basic checks on required parameters
    validateMap(data, True)
    validateLayout(data, True)
    if 'nodes' not in data:
        raise ErrorResp('nodes parameter missing or malformed')
    if not isinstance(data['nodes'], dict):
        raise ErrorResp('nodes parameter should be a dictionary')
    if len(data['nodes'].keys()) < 1:
        raise ErrorResp('there are no nodes in the nodes dictionary')
    
    # Basic checks on optional parameters
    validateEmail(data)
    validateViewServer(data)
    if 'neighborCount' in data and \
        (not isinstance(data['neighborCount'], int) or \
        data['neighborCount'] < 1):
        raise ErrorResp('neighborCount parameter should be a positive integer')

    # Check that map and layout are available for n-of-1 analysis
    mapLayouts = availableMapLayouts('Nof1')
    if not data['map'] in mapLayouts:
        raise ErrorResp(
            'Map does not have any layouts with background data: ' +
            data['map'])
    if not data['layout'] in mapLayouts[data['map']]:
        raise ErrorResp('Layout does not have background data: ' +
            data['layout'])

def createBookmark(state, viewServer):

    # Ask the view server to create a bookmark of this client state
    bResult = requests.post(viewServer + '/query/createBookmark',
        headers = { 'Content-type': 'application/json' },
        data = json.dumps(state)
    )
    bData = json.loads(bResult.text)
    if bResult.status_code == 200:
        return bData
    else:
        ErrorResp(bData)

def calcComplete(result, ctx):

    # The calculation has completed, so create bookmarks and send email
    
    dataIn = ctx['dataIn']

    if 'error' in result:
        raise ErrorResp(result['error'])

    # Be sure we have a view server
    if not 'viewServer' in dataIn:
        dataIn['viewServer'] = ctx['viewServerDefault']

    # Format the result as client state in preparation to create a bookmark
    if 'firstAttribute' in ctx['meta']:
        firstAttr = ctx['meta']['firstAttribute']
    else:
        firstAttr = None
    state = {
        'page': 'mapPage',
        'project': dataIn['map'] + '/',
        'layout': dataIn['layout'],
        'shortlist': [firstAttr],
        'first_layer': [firstAttr],
        'overlayNodes': {},
        'dynamic_attrs': {},
    }

    # Populate state for each node
    for node in result['nodes']:
        nData = result['nodes'][node]
        state['overlayNodes'][node] = { 'x': nData['x'], 'y': nData['y'] }
        attr = node + ': ' + dataIn['layout'] + ': neighbors'
        state['shortlist'].append(attr)
        state['dynamic_attrs'][attr] = {
            'dynamic': True,
            'datatype': 'continuous',
            'data': {},
        }
        for neighbor in nData['neighbors']:
            state['dynamic_attrs'][attr]['data'][neighbor] = \
                nData['neighbors'][neighbor]

        # If individual Urls were requested, create a bookmark for this node
        if 'individualUrls' in dataIn and dataIn['individualUrls']:
            bData = createBookmark(state, dataIn['viewServer'])
            result['nodes'][node]['url'] = \
                dataIn['viewServer'] + '/?bookmark=' + bData['bookmark']

            # Clear the node data to get ready for the next node
            state['overlayNodes'] = {}
            state['dynamic_attrs'] = {}
        
    # If individual urls were not requested, create one bookmark containing all
    # nodes and return that url for each node
    if not 'individualUrls' in dataIn or not dataIn['individualUrls']:
        bData = createBookmark(state, dataIn['viewServer'])
        for node in result['nodes']:
            result['nodes'][node]['url'] = \
                dataIn['viewServer'] + '/?bookmark=' + bData['bookmark']

    # TODO: Send completion Email

    raise SuccessResp(result)


def calc(dataIn, ctx, app):

    # The entry point from the hub URL routing

    validateParameters(dataIn)
    
    # Find the Nof1 data files for this map and layout
    meta = getMetaData(map, ctx)
    files = meta['layouts'][dataIn['layout']]
    
    # Check to see if the data files exist
    # TODO: test both of these checks
    """
    if not os.path.exists(files['fullFeatureMatrix']):
        raise ErrorResp('full feature matrix file not found: ' +
            files['fullFeatureMatrix'])
    if not os.path.exists(files['xyPositions']):
        raise ErrorResp('xy positions file not found: ' +
            files['xyPositions'])
    """
    
    # Put the options to be passed to the calc script in a Namespace object,
    # the same object returned by argparse.parse_args().
    opts = Namespace(
        fullFeatureMatrix = files['fullFeatureMatrix'],
        xyPositions = files['xyPositions'],
        newNodes = dataIn['nodes'],
    )
    
    # Set any optional parms, letting the calc script set defaults.
    if 'neighborCount' in dataIn:
        opts.neighborCount = dataIn['neighborCount']
    
    if 'testStub' in dataIn:
        result = Nof1_stub.whateverRoutine(opts)
        
    else:
    
        # Call the calc script.
        # TODO spawn a process
        # result = Nof1.whateverRoutine(opts)
        pass

    ctx['dataIn'] = dataIn
    ctx['meta'] = meta
    calcComplete(result, ctx)
