
import json
from flask import Flask, request, jsonify, current_app
import config
import hubUtil
from hubUtil import SuccessResp, ErrorResp, log
import Nof1_hub

app = Flask(__name__)
app.config.from_object('config.DevelopmentSwatConfig')
#app.config.from_object('config.ProductionKolossusConfig')

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
def handle_invalid_usage(success):
    response = jsonify(success.to_dict())
    response.status_code = 200
    #log('debug', 'response: ' + str(response), current_app)
    return response

# Register the error handler
@app.errorhandler(ErrorResp)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    ##log('error', 'Request failed with: ' + str(self.status_code) + ': ' + \
     #   rv['message'], current_app)

    log('error', 'Request failed with: ' + str(response.status_code) + ': ' + \
        str(response), current_app)
    return response

"""
# Handle the file routes by filename
@app.route('/file/<string:filename>/<path:map>', methods=['POST', 'GET'])
def queryFile(filename, map):
"""

# Handle the query routes
@app.route('/query/<string:operation>', methods=['POST'])
def queryRoute(operation):

    log('info', 'Received query operation: ' + operation, current_app)
    dataIn = validatePost()

    if operation == 'overlayNodes':
        Nof1_hub.calc(dataIn, app)
        
    else:
        raise ErrorResp('URL not found', 404)

    log('info', 'Success with query operation: ' + operation, current_app)

    raise SuccessResp('Success!')

# Handle the test root
@app.route('/test', methods=['POST', 'GET'])
def testRoute():

    app.logger.debug('testRoute current_app: ' + str(current_app))

    raise ErrorResp('just testing')


