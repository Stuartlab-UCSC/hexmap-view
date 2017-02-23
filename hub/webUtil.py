
import json, types
from argparse import Namespace

class SuccessResp(Exception):

    # Define a success response class

    def __init__(self, data):
        Exception.__init__(self)
        self.data = data

    def to_dict(self):
        return self.data

class ErrorResp(Exception):

    # Define an error response class

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

def log(level, message, app):

    # Log a message to the server's console

    # TODO we should report the job id here, and maybe the url of the web API

    # Don't clutter up the testing output
    # TODO but this only prints this routine's line #, rather than the caller's
    # info, useless. Can we modify the logger to leave out the routine & line
    # number and decorators?
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

def availableMapLayouts(operation):

    # Find the maps and layouts for a specific operation

    if operation == 'Nof1':
    
        # TODO: really go get these
        # by scraping the data directories for meta.json files containing file
        # paths for a full feature matrix, xyPositions and firstAttribute.
        return {
            'Pancan12/SampleMap': [
                'mRNA',
                'miRNA',
                'RPPA',
                'Methylation',
                'SCNV',
                'Mutations',
                'PARADIGM (inferred)',
            ],
        }
    else:
    
        # Not a supported operation
        return None
    
def getMetaData(map, ctx):
    
    # Retrieve the meta data for this map
    
    # TODO get real meta data from the view/<map>/meta.json file
    meta =  {
        "firstAttribute": "Tissue",
        "layouts": {
            "mRNA": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.mRNA.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments0.tab",
            },
            "miRNA": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.miRNA.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments1.tab",
            },
            "RPPA": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.RPPA.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments2.tab",
            },
            "Methylation": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.methylation27.autosomal.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments3.tab",
            },
            "SCNV": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.SCNV.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments4.tab",
            },
            "Mutations": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.mutations.hc.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments5.tab",
            },
            "PARADIGM (inferred)": {
                "fullFeatureMatrix":
                    "/hive/groups/hexmap/prod/data/featureSpace/Pancan12/2017_02_21/layout.paradigm.tsv",
                "xyPositions":
                    "/hive/groups/hexmap/prod/data/view/Pancan12/SampleMap/assignments6.tab",
            }
        }
    }
    
    return meta

def validateString(name, data, required=False):
    if required and name not in data:
        raise ErrorResp(name + ' parameter missing or malformed')
    if not isinstance(data[name], types.StringTypes):
        raise ErrorResp(name + ' parameter should be a string')

def validateMap(data, required):
    validateString('map', data, required)

def validateLayout(data, required):
    validateString('layout', data, required)

def validateEmail(data):
    if 'email' in data and not isinstance(data['email'], list):
        raise ErrorResp('email parameter should be a list/array of strings')

def validateViewServer(data):
    if 'viewServer' not in data:
        return
    validateString('viewServer', data)
