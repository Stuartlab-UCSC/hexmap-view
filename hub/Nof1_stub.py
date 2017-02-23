
import os.path, json, types, requests
from argparse import Namespace
from flask import Response
from hubUtil import ErrorResp, getMetaData, availableMapLayouts
from hubUtil import validateMap, validateLayout, validateEmail, \
    validateViewServer

def whateverRoutine(opts):

    #print 'opts.newNodes', opts.newNodes
    
    if 'testError' in opts.newNodes:
        return {
            'error': 'Some error message or stack trace'
        }
    elif 'testSuccess' in opts.newNodes:
        return {
           'someSuccess': 'someSuccess'
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

