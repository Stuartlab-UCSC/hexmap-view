
import json
import pandas as pd
from cStringIO import StringIO

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
        rv['message'] = self.message
        return rv

# Log a message referencing the job ID if there is one
def log(level, message, app):
    # TODO we should report the job id here, maybe url

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

# Find the maps available
def availableMaps():
    # TODO: really go get all of the maps
    return [
        'CKCC/v3'
    ]
    
# Find the layouts available for this map
def availableLayouts(map):
    # TODO: really go get the layouts for this map
    return [
        'mRNA'
    ]
    
# Does this map exist?
def isMapExistant(mapId):
    return mapId in availableMaps()

# Does this layout exist for this map?
def isLayoutExistant(layout, map):
    if layout in availableLayouts(map):
        return True
    return False

# Retrieve the meta data for this map
def getMetaData(map):
    # TODO get real meta data
    metaJson = ' \
    { \
        "Nof1": { \
            "mRNA": { \
                "fullFeatureMatrix": "CKCC/v3/expression.tab", \
                "xyPreSquiggle": "CKCC/v3/assignments0.tab" \
            } \
        } \
    } \
    '
    return json.loads(metaJson)

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

def tabArrayToPandas(tabArray):
    '''
    Takes a tab delemited array and makes a pandas dataframe
    @param tabArray:
    @return: pandas dataframe
    '''
    return pd.read_csv(StringIO('\n'.join(tabArray)),sep='\t',index_col=0)
# Convert a list of TSV lines to a numpy 2d array
#def tsvListToNumpyArray(tsvList):
