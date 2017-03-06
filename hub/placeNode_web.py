
# placeNode_web.py
# For the placeNode calculation this handles:
#   - validation of received input
#   - mapping between mapID and layout to data file locations
#   - http response and code

import os.path, json, types, requests, traceback
from argparse import Namespace
from flask import Response
from webUtil import SuccessResp, ErrorResp, getMetaData, log, \
    availableMapLayouts, validateMap, validateLayout, validateEmail, \
    validateViewServer
import placeNode_calc

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

def createBookmark(state, viewServer, app):

    # Create a bookmark

    # Ask the view server to create a bookmark of this client state
    # TODO fix the request to the view server
    try:
        bResult = requests.post(viewServer + '/query/createBookmark',
            headers = { 'Content-type': 'application/json' },
            data = json.dumps(state)
        )
    except:
        raise ErrorResp('Unknown error connecting to view server: ' +
            viewServer)

    bData = json.loads(bResult.text)
    if bResult.status_code == 200:
        return bData
    else:
        raise ErrorResp(bData)

def calcComplete(result, ctx, app):

    # The calculation has completed, so create bookmarks and send email
    
    dataIn = ctx['dataIn']

    #log('debug', 'calcComplete: result: ' + str(result), app)
    
    if 'error' in result:
        raise ErrorResp(result['error'])

    # Be sure we have a view server
    if not 'viewServer' in dataIn:
        dataIn['viewServer'] = ctx['viewerUrl']

    # TODO find the firstAttribute in Layer_Data_Types.tab
    if 'firstAttribute' in ctx['meta']:
        firstAttr = ctx['meta']['firstAttribute']
    else:
        firstAttr = None

    # TODO find the layoutIndex from layouts.tab
    layoutIndex = 0
    if dataIn['map'] == 'Pancan12/SampleMap':
        layouts = [
            'mRNA',
            'miRNA',
            'RPPA',
            'Methylation',
            'SCNV',
            'Mutations',
            'PARADIGM (inferred)',
        ]
        layoutIndex = layouts.index(dataIn['layout'])

    # Format the result as client state in preparation to create a bookmark
    state = {
        'page': 'mapPage',
        'project': dataIn['map'] + '/',
        'layoutIndex': layoutIndex,
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
            bData = createBookmark(state, dataIn['viewServer'], app)
            result['nodes'][node]['url'] = \
                dataIn['viewServer'] + '/?bookmark=' + bData['bookmark']

            # Clear the node data to get ready for the next node
            state['overlayNodes'] = {}
            state['dynamic_attrs'] = {}
        
    # If individual urls were not requested, create one bookmark containing all
    # nodes and return that url for each node
    if not 'individualUrls' in dataIn or not dataIn['individualUrls']:
        bData = createBookmark(state, dataIn['viewServer'], app)
        for node in result['nodes']:
            result['nodes'][node]['url'] = \
                dataIn['viewServer'] + '/?bookmark=' + bData['bookmark']

    # TODO: Send completion Email
    """
    # a javascript routine:
    // Send email to interested parties
    var subject = 'tumor map results: ',
        msg = 'Tumor Map results are ready to view at:\n\n';
    
    _.each(emailUrls, function (node, nodeName) {
        msg += nodeName + ' : ' + node + '\n';
        subject += node + '  ';
    });
        
    if ('email' in dataIn) {
        sendMail(dataIn.email, subject, msg);
        msg += '\nAlso sent to: ' + dataIn.email;
    } else {
        msg += '\nNo emails included in request';
    }
    sendMail(ADMIN_EMAIL, subject, msg);
    """

    return result

def calcTestStub(opts):

    #print 'opts.newNodes', opts.newNodes
    
    if 'testError' in opts.newNodes:
        return {
            'error': 'Some error message or stack trace'
        }
    elif len(opts.newNodes) == 1:
        return {'nodes': {
            'newNode1': {
                'x': 73,
                'y': 91,
                'neighbors': {
                    'TCGA-BP-4790': 0.352,
                    'TCGA-AK-3458': 0.742,
                }
            },
        }}
    elif len(opts.newNodes) > 1:
        return {'nodes': {
            'newNode1': {
                'x': 73,
                'y': 91,
                'neighbors': {
                    'TCGA-BP-4790': 0.352,
                    'TCGA-AK-3458': 0.742,
                }
            },
            'newNode2': {
                'x': 53,
                'y': 47,
                'neighbors': {
                    'neighbor1': 0.567,
                    'neighbor2': 0.853,
                }
            },
        }}
    else:
        return { 'error': 'unknown test' }

def calc(dataIn, ctx, app):

    # The entry point from the hub URL routing

    validateParameters(dataIn)

    # Find the Nof1 data files for this map and layout
    meta = getMetaData(dataIn['map'], ctx, app)
    
    files = meta['layouts'][dataIn['layout']]
    
    if not 'testStub' in dataIn:
    
        # Check to see if the data files exist
        # TODO: test both of these checks
        if not os.path.exists(files['fullFeatureMatrix']):
            raise ErrorResp('full feature matrix file not found: ' +
                files['fullFeatureMatrix'], 500)
        if not os.path.exists(files['xyPositions']):
            raise ErrorResp('xy positions file not found: ' +
                files['xyPositions'], 500)
    
    # Put the options to be passed to the calc script in a Namespace object,
    # the same object returned by argparse.parse_args().
    opts = Namespace(
        fullFeatureMatrix = files['fullFeatureMatrix'],
        xyPositions = files['xyPositions'],
        newNodes = dataIn['nodes'],
        mapId = dataIn['map']
    )
    
    # Set any optional parms, letting the calc script set defaults.
    if 'neighborCount' in dataIn:
        opts.top = dataIn['neighborCount']

    #log('debug', 'opts: ' + str(opts), app);

    if 'testStub' in dataIn:
        result = calcTestStub(opts)
        
    else:

        # Call the calc script.
        try:
            result = placeNode_calc.entryPointFromWebApi(opts)
        except:
            raise ErrorResp(traceback.format_exc(), 500)

    ctx['dataIn'] = dataIn
    ctx['meta'] = meta
    return calcComplete(result, ctx, app)
