
import json, types
from argparse import Namespace

# Define a success response class
class SuccessResp(Exception):

    def __init__(self, data, payload=None):
        Exception.__init__(self)
        self.data = data
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['data'] = self.data
        return rv

# Define an error response class 
class ErrorResp(Exception):
    status_code = 400 # default to 'invalid usage'

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        return rv

# Log a message to the server's console
def log(level, message, app):
    # TODO we should report the job id here, and maybe the url of the web API

    # Don't clutter up the testing output
    if app.config['TESTING']:
        return
    
    if level == 'info':
        app.logger.info(message)
    elif level == 'error':
        app.logger.error(message)
    elif level == 'warning':
        app.logger.warning(message)
    elif level == 'debug':
        app.logger.debug(message)

# Find the maps and layouts for a specific operation
def availableMapLayouts(operation):

    if operation == 'Nof1':
    
        # Scrape the data directories for meta.json files containing file paths
        # for a full feature matrix and xyPositions.
        # TODO: really go get these
        return {
            'CKCC/v3': [
                'mRNA'
            ]
        }
    else:
    
        # Not a supported operation
        return None
    
# Retrieve the meta data for this map
def getMetaData(map, ctx):
    # Note: A full path name is used for the fullFeatureMatrix so this file may
    # be located anywhere. A full path name is used for the xyPositions, rather
    # than using the standard name of ../view/<map>/xyPreSquiggle_1.tab so that
    # any xyPosition file could be associated with this map's layout. This would
    # be useful if a better method to overlay a new node is found rather than
    # using the centroid of the nearest neighbors pre-squiggle locations.

    # TODO get real meta data from the view/<map>/meta.json file
    meta =  {
        "layouts": {
            "mRNA": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/data/prod/featureSpace/CKCC/v3/expression.tab", \
                "xyPositions":
                    "/hive/groups/hexmap/data/prod/view/CKCC/v3/xyPreSquiggle_0.tab" \
            }
        }
    }
    
    return meta

# Convert a list of TSV lines to a python 2d array
def tsvListToPythonArray(tsvList):
    import csv
    
    tsvReader = csv.reader(tsvList, delimiter='\t')
    pyArray = []
    i = 0
    for row in tsvReader:
        pyArray[i] = []
        j = 0
        for cell in row:
            pyArray[i][j] = cell
            j += 1
        i += 1

    return pyArray

# Convert a list of TSV lines to a numpy 2d array
#def tsvListToNumpyArray(tsvList):

# Convert a list of TSV lines to a pandas 2d array
#def tsvListToPandasArray(tsvList):

# Validate a string parameter
def validateString(name, data, required=False):
    if required and name not in data:
        raise ErrorResp(name + ' parameter missing or malformed')
    if not isinstance(data[name], types.StringTypes):
        raise ErrorResp(name + ' parameter should be a string')

# Validate a map parameter
def validateMap(data, required):
    validateString('map', data, required)

# Validate a layout parameter
def validateLayout(data, required):
    validateString('layout', data, required)

# Validate an optional email parameter
def validateEmail(data):
    if 'email' in data and not isinstance(data['email'], list):
        raise ErrorResp('email parameter should be a list/array of strings')

# Validate an optional view server parameter
def validateViewServer(data):
    if 'viewServer' not in data:
        return
    validateString('viewServer', data)
    """
    # TODO send a request to data['viewServer'] + '/testViewerUrl'
    try:
        viewerResponse = TODO
    except:
        raise ErrorResp('viewServer parameter is not a valid URL')

    if viewerResponse.statusCode != 200:
        raise ErrorResp('viewServer parameter is not a valid view server URL')
    """
