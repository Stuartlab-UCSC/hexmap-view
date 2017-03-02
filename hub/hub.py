
# hub.py
#
import json, traceback
from flask import Flask, request, jsonify, current_app
from flask_cors import CORS, cross_origin

import config
import webUtil
from webUtil import SuccessResp, ErrorResp, log
import placeNode_web

app = Flask(__name__)

# Make cross-origin AJAX possible
CORS(app)

# TODO use env vars for this installation-specific config
app.config.from_object('config.Development')
#app.config.from_object('config.Production')

# TODO: can ctx be stashed in flask's app.config object?
# If not, clean up config.py to just dev & prod.
# Or should ctx be stashed in the request object?
ctx = {
    'viewServerDefault': 'http://localhost:3333'
    #'viewServerDefault': 'https://tumormap.ucsc.edu'
}

# Validate a post
def validatePost():
    if request.headers['Content-Type'] != 'application/json':
        raise ErrorResp('Content-Type must be application/json')
    try:
        dataIn = request.get_json()
    except:
        raise ErrorResp('Post content is invalid JSON')
    return dataIn

# Register the success handler
@app.errorhandler(SuccessResp)
def successResponse(success):
    response = jsonify(success.to_dict())
    response.status_code = 200
    #log('info', 'response: ' + str(response), current_app)
    return response

# Register the error handler
@app.errorhandler(ErrorResp)
def errorResponse(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    data = json.loads(response.data)
    if 'error' in data:
        msg = data['error']
    else:
        msg = 'unknown error'
    log('error', 'Request failed with: ' + str(response.status_code) + ': ' + \
        str(response) + " " + msg, current_app)
    return response

"""
# Handle file request routes by view file name
@app.route('/file/<string:filename>/<path:map>', methods=['POST', 'GET'])
def queryFile(filename, map):
"""

# Handle query/<operation> routes
@app.route('/query/<string:operation>', methods=['POST'])
def queryRoute(operation):

    log('info', 'Received query operation: ' + operation, current_app)
    dataIn = validatePost()

    if operation == 'overlayNodes':
        result = placeNode_web.calc(dataIn, ctx, current_app)
        
    else:
        raise ErrorResp('URL not found', 404)

    log('info', 'Success with query operation: ' + operation, current_app)
    raise SuccessResp(result)

# Handle the route to test
@app.route('/test', methods=['POST', 'GET'])
def testRoute():

    app.logger.debug('testRoute current_app: ' + str(current_app))

    raise SuccessResp('just testing')


