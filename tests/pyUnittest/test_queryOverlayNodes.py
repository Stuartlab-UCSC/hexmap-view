#!/usr/bin/env python2.7

# This tests javascript, using python's easer calls to shell commands
# from here than from mocha

import sys, os, subprocess, json, tempfile, pprint
import string
import unittest

class Test_queryOverlayNodes(unittest.TestCase):

    unittest.TestCase.appInstallDir = '/Users/swat/dev/hexagram'
    unittest.TestCase.port = "localhost:4444"
    unittest.TestCase.curlUrl = unittest.TestCase.port + "/query/overlayNodes"
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
    
    def expectedResults(s):
        return '{"Sample-1":{"neighbors":["TCGA-N7-A4Y5-01","TCGA-4J-AA1J-01","TCGA-KS-A4IB-01","TCGA-DQ-7589-01","TCGA-HT-7686-01","TCGA-AJ-A3EM-01"],"x":200.5,"y":226.5},"Sample-2":{"neighbors":["TCGA-4J-AA1J-01","TCGA-N7-A4Y5-01","TCGA-KS-A4IB-01","TCGA-LH-A9QB-06","TCGA-DQ-7589-01","TCGA-DW-7836-01"],"x":252.5,"y":241.5}}';
    """
    def test_methodCheck(s):
        opts = ['-X', 'GET', '-v']
        rc = s.doCurl(opts)
        #print 'code:', rc['code'], 'data:', rc['data']
        s.assertTrue(rc['code'] == '405')
        s.assertTrue(rc['data']== '"Only the POST method is understood here"')
    
    def test_contentTypeCheck(s):
        opts = ['-H', 'Content-Type:apjson', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        #print 'code:', rc['code'], 'data:', rc['data']
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"Only content-type of application/json is understood here"')
    
    def test_jsonCheck(s):
        data = '{data: oh boy, data!}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"Malformed JSON data given"')
    """
    def test_mapIncludedCheck(s):
        data = '{"test": "test"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        print 'code:', rc['code'], 'data:', rc['data']
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== '"Map missing or malformed"')
    """
    def test_layoutIncludedCheck(s):
        data = '{"map": "junk"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== '"Layout missing or malformed"')
    
    def test_nodesIncludedCheck(s):
        data = '{"map": "junk", "layout": "someLayout"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data']== '"Nodes missing or malformed"')
    
    def test_layoutsIsObjectCheck(s):
        data = '{"map": "junk", "layout": "junk", "nodes": "someString"}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"Nodes type should be an object"')
    
    def test_mapValueCheck(s):
        data = '{"map": "junk", "layout": "junk", "nodes": {}}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"The only frozen map available is CKCC/v1"')
    
    def test_layoutsValueCheck(s):
        data = '{"map": "CKCC/v1", "layout": "junk", "nodes": {}}'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '400')
        s.assertTrue(rc['data'] == '"The only map layout available is mRNA"')
    
    def test_bookmarkStub(s):
        data = '{"TESTbookmarkStub": "yes", "map": "CKCC/v1", "layout": "mRNA", "nodes": {}}'
        resData = '{"bookmark":"http://' + unittest.TestCase.port + '/?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"}\n'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '200')
        s.assertTrue(rc['data'] == resData)
    
    def test_pythonCallStub(s):
        data = '{"TESTpythonCallStub": "yes", "map": "CKCC/v1", "layout": "mRNA", "nodes": {"node1": {"gene1": "1", "gene2": "2"}, "node2": {"gene1": "3", "gene2": "4"}}}'
        resData = '{"TESTpythonCallStub":"success"}\n';
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        
        #print "rc['code']:", rc['code']
        #print "rc['data']:", rc['data']

        s.assertTrue(rc['code'] == '200')
        s.assertTrue(rc['data'] == resData)
    
    def test_pythonCallGoodData(s):
        data = '{"TESTpythonCallGoodData": "yes", "map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.5424", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}'
        resData = s.expectedResults() + '\n'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        s.assertTrue(rc['code'] == '200')
        s.assertTrue(rc['data'] == resData)
    
    def test_pythonCallGoodDataBookmark(s):
        data = '{"TESTpythonCallGoodDataBookmark": "yes", "map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.5424", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}'
        book1 = '/?&p=CKCC.v1&node=Sample-1&x=200.5&y=226.5'
        book2 = '/?&p=CKCC.v1&node=Sample-2&x=252.5&y=241.5'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        
        #print "rc['code']:", rc['code']
        #print "rc['data']:", rc['data']

        s.assertTrue(rc['code'] == '200')
        s.assertTrue(string.find(rc['data'], book1) > -1)
        s.assertTrue(string.find(rc['data'], book2) > -1)


    #  TODO: requires real data in CKCC/v1
    def test_pythonCallNoFiles(s):
        # This test relies on data files being in their production directories,
        # so may not work if the production data changes for CKCC/v1.
        data = '{"map": "CKCC/v1", "nodes": {"Sample-2": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.5424", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "5.9940", "AC007272.3": "0"}, "Sample-1": {"CTD-2588J6.1": "0", "RP11-433M22.1": "0", "CTD-2588J6.2": "0", "CPHL1P": "0", "RP3-415N12.1": "0", "RP11-181G12.4": "0.5264", "RP11-433M22.2": "0", "SSXP10": "0", "RP11-16E12.2": "2.3112", "PSMA2P3": "0", "CTD-2367A17.1": "0", "RP11-181G12.2": "6.3579", "AC007272.3": "0"}}, "layout": "mRNA"}'
        book1 = '/?&p=CKCC.v1&node=Sample-1&x=200.5&y=226.5'
        book2 = '/?&p=CKCC.v1&node=Sample-2&x=252.5&y=241.5'
        opts = ['-d', data, '-H', 'Content-Type:application/json', '-X', 'POST', '-v']
        rc = s.doCurl(opts)
        
        #print "rc['code']:", rc['code']
        #print "rc['data']:", rc['data']

        s.assertTrue(rc['code'] == '200')
        s.assertTrue(string.find(rc['data'], book1) > -1)
        s.assertTrue(string.find(rc['data'], book2) > -1)
    
    def test_pythonCallViaBash(s):
        resultsFile = 'overlayNodesResults.json'
        resData = s.expectedResults()
        command = [
            'overlayNodes.sh',
            s.appInstallDir,
            s.tempDir,
            resultsFile
        ]
        subprocess.check_call(command);

        # Compare expected to actual results after normalizing to the most compact json
        with open(s.tempDir + '/' + resultsFile, 'r') as f:
            data = json.dumps(json.load(f), sort_keys=True, separators=(',', ':'))
            resData2 = json.dumps(json.loads(resData), sort_keys=True, separators=(',', ':'))
        s.assertTrue(data == resData2)
    """
if __name__ == '__main__':
    unittest.main()
