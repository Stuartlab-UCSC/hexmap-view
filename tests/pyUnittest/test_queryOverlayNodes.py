#!/usr/bin/env python2.7

# This does not test any python code, but it is easier to test shell commands
# from here than from mocha

import sys, os, subprocess, tempfile
import unittest

class TestQueryOverlayNodes(unittest.TestCase):

    unittest.TestCase.curlUrl = "localhost:3000/query/overlayNodes"

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
            curl = ['curl', '-s'] + opts + [s.curlUrl]
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

    def test_mapIncludedCheck(s):
        data = '{"test": "test"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== 'Map missing or malformed')

    def test_layoutIncludedCheck(s):
        data = '{"map": "CKCCv1"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== 'Layouts missing or malformed')

    def test_layoutsIsObjectCheck(s):
        data = '{"map": "CKCCv1", "layouts": "junk"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == 'Layouts type should be an object')

    def test_mapValueCheck(s):
        data = '{"map": "junk", "layouts": {"junk": "junk"}}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == 'The only frozen map available is ' + "CKCCv1")

    def test_layoutsValueCheck(s):
        data = '{"map": "CKCCv1", "layouts": {"junk": "junk"}}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == 'The only map layout available is ' + "mRNA")

    def test_valid(s):
        data = '{"map": "CKCCv1", "layouts": {"mRNA": "junk"}}'
        resData = '{"bookmark":"http://localhost:3000/?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"}\n'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        #print 'data: ##', rc['data'], '##'
        #print 'code: ##', rc['code'], '##'
        s.assertTrue(rc['code'] == '200')
        s.assertTrue(rc['data'] == resData)

if __name__ == '__main__':
    unittest.main()
