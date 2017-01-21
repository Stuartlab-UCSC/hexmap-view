#!/usr/bin/env python2.7

# This tests http

import sys, os, glob, subprocess, json, tempfile, pprint
from os import path
import string
import unittest
import util

from rootDir import getRootDir

rootDir = getRootDir()
inDir = path.join(rootDir + 'tests/pyUnittest/createMapIn/')
outDir = path.join(rootDir + 'tests/pyUnittest/httpOut/')

class TestHttp(unittest.TestCase):

    singleUrlPrefix = "localhost:3333"

    unittest.TestCase.singleUrl = singleUrlPrefix + "/calc/layout"

    def cleanDataOut(s, dataOut):
        data = dataOut
    
        # if this is an error message ...
        if dataOut[0] != '{':
            data = dataOut.replace('\n', '')
            
        return data
        
    def findStatusCode(s, verbose):
        i = verbose.find('< HTTP/1.1')
        return verbose[i+11:i+14]
        
    def checkLog(s, filename):
        with open(filename, 'r') as f:
            log = f.read()
        if log.find('Visualization generation complete!') > -1:
            return True
        else:
            return False
        
    def doCurl(s, opts):
        o, outfile = tempfile.mkstemp()
        e, errfile = tempfile.mkstemp()
        url = s.singleUrl
        with open(outfile, 'w') as o:
            e = open(errfile, 'w')
            curl = ['curl', '-s', '-k'] + opts + [url]
            #print 'curl:\n', curl, '\n\n'
# curl -s -k -d '{"map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.5424", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}' -H Content-Type:application/json -X POST -v localhost:3333/query/overlayNodes
            subprocess.check_call(curl, stdout=o, stderr=e);
            e.close()
        with open(outfile, 'r') as o:
            e = open(errfile, 'r')
            data = s.cleanDataOut(o.read());
            code = s.findStatusCode(e.read());
            e.close()
        os.remove(outfile)
        os.remove(errfile)
        return {'data': data, 'code': code}
   
    def test_methodCheckLocal(s):
        opts = ['-X', 'GET', '-v']
        rc = s.doCurl(opts, False)
        s.assertTrue(rc['code'] == '405')
        s.assertTrue(rc['data'] == '"Only the POST method is understood here"')

    def test_contentTypeCheckLocal(s):
        opts = ['-H', 'Content-Type:apjson', '-X', 'POST', '-v']
        rc = s.doCurl(opts, False)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"Only content-type of application/json is understood here"')
    
    def test_jsonCheckLocal(s):
        data = '{data: oh boy, data!}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts, False)
        #print 'rc: code, data', rc['code'],rc['data']
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"Malformed JSON data given"')
    
    def test_pythonCallGoodDataLocal(s):
        util.removeOldOutFiles(outDir)
        data = '[ ' + \
            '"--coordinates", "' + path.join(inDir, "example_features_xy.tab") + '", ' + \
            '"--names", "layout", ' + \
            '"--directory", "' + outDir + '", ' + \
            '"--role", "swat_soe.ucsc.edu", ' + \
            '"--include-singletons", ' + \
            '"--no_density_stats", ' + \
            '"--no_layout_independent_stats", ' + \
            '"--no_layout_aware_stats" ]'
        curl_opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(curl_opts, False)
        #print 'code, data:', rc['code'], rc['data']
        s.assertTrue(rc['code'] == '200')
    
    def test_createMap_sparse(s):
        util.removeOldOutFiles(outDir)
        data = '[ ' + \
            '"--similarity", "' + path.join(inDir, "TGCT_IlluminaHiSeq_RNASeqV2.vs_self.top6.tab") + '", ' + \
            '"--names", "mRNA", ' + \
            '"--scores", "' + path.join(inDir, "clin.tumormap.tab") + '", ' + \
            '"--colormaps", "' + path.join(inDir, "clin.colormaps.final.tab") + '", ' + \
            '"--directory", "' + outDir + '", ' + \
            '"--include-singletons", ' + \
            '"--first_attribute", "' + "KIT_mutated" + '",' \
            '"--no_density_stats", ' + \
            '"--no_layout_independent_stats", ' + \
            '"--no_layout_aware_stats" ]'
        
        curl_opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(curl_opts, False)
        #print 'code, data:', rc['code'], rc['data']
        s.assertTrue(rc['code'] == '200')
        success = s.checkLog(outDir + 'log')
        s.assertTrue(success, True)

if __name__ == '__main__':
    unittest.main()
