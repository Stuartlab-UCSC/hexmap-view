#!/usr/bin/env python2.7

# This tests javascript, using python's easer calls to shell commands
# from here than from mocha

import sys, os, subprocess, json, tempfile, pprint
import string
import unittest

class TestCreateMap(unittest.TestCase):

    unittest.TestCase.appInstallDir = '/Users/swat/dev/hexagram'
    unittest.TestCase.port = "localhost:3333"
    unittest.TestCase.curlUrl = unittest.TestCase.port + "/calc/layout"
    unittest.TestCase.tempDir = '/tmp'

    def cleanDataOut(s, dataOut):
        data = dataOut
    
        # if this is an error message ...
        if dataOut[0] != '{':
            data = dataOut.replace('\n', '')
            
        return data
        
    def findStatusCode(s, verbose):
        i = verbose.find('< HTTP/1.1')
        return verbose[i+11:i+14]
        
    def doCurl(s, opts):
        o, outfile = tempfile.mkstemp()
        e, errfile = tempfile.mkstemp()
        with open(outfile, 'w') as o:
            e = open(errfile, 'w')
            curl = ['curl', '-s', '-k'] + opts + [s.curlUrl]
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
    
    def test_methodCheck(s):
        opts = ['-X', 'GET', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '405')
        s.assertTrue(rc['data']== 'Only the POST method is understood here')

    def test_contentTypeCheck(s):
        opts = ['-H', 'Content-Type:apjson', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == 'Only content-type of application/json is understood here')

    def test_jsonCheck(s):
        data = '{data: oh boy, data!}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == 'Malformed JSON data given')
    
    
    """
    # TODO no checks on data yet
    def test_optsIncludedCheck(s):
        data = '{"test": "test"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== 'Create Map function parameters missing or malformed')
    """


    def test_pythonCallGoodData(s):
        data = '[ "--names", "layout", "--directory", "/Users/swat/data/view/swat_soe.ucsc.edu/", "--role", "swat_soe.ucsc.edu", "--include-singletons", "--no-density-stats", "--no-layout-independent-stats", "--no-layout-aware-stats",  "--coordinates", "/Users/swat/data/featureSpace/swat_soe.ucsc.edu/features.tab" ]'
        curl_opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(curl_opts)
        print 'rc', rc
        s.assertTrue(rc['code'] == '200')
    
if __name__ == '__main__':
    unittest.main()
