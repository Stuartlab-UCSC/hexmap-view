import os, json, tempfile
import unittest
import hub

class Nof1TestCase(unittest.TestCase):

    # This server must be running for these tests.
    viewServer = 'http://localhost:3333'

    def setUp(self):
        #self.db_fd, hub.app.config['DATABASE'] = tempfile.mkstemp()
        hub.app.config['TESTING'] = True
        self.app = hub.app.test_client()
        #with hub.app.app_context():
        #    hub.init_db()

    def tearDown(self):
        pass
        #os.close(self.db_fd)
        #os.unlink(hub.app.config['DATABASE'])

    def test_get_not_allowed(s):
        rv = s.app.get('/query/overlayNodes')
        s.assertTrue(rv.status_code == 405)

    def test_content_type_not_json(s):
        rv = s.app.post('/query/overlayNodes',
            #content_type='application/json',
            data=dict(
                username='username',
                password='password',
            )
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] == 'Content-Type must be application/json')

    def test_invalid_json(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=dict(
                map='someMapId',
            )
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] == 'Post content is invalid JSON')
    
    def test_no_map(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                someData='someData',
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        #print "data['error']", data['error']
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] == 'map parameter missing or malformed')
    
    def test_map_not_string(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map=1,
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'map parameter should be a string')
    
    def test_no_layout(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] == 'layout parameter missing or malformed')

    def test_layout_not_string(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout=1,
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'layout parameter should be a string')
    
    def test_no_nodes(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout'
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] == 'nodes parameter missing or malformed')

    def test_nodes_not_python_dict(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes='someNodes'
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'nodes parameter should be a dictionary')

    def test_node_count_of_one_or_more(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes = dict(
                ),
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'there are no nodes in the nodes dictionary')

    def test_email_not_python_list(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes = dict(
                    someNode='someValue',
                ),
                email=1,
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        #print 'rv.status_code:', rv.status_code
        #print 'data:', data
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'email parameter should be a string or list/array of strings')

    def test_viewServer_not_string(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes = dict(
                    someNode='someValue',
                ),
                email=['someone@somewhere'],
                viewServer=1,
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        #print "data['error']", data['error']
        s.assertTrue(data['error'] ==
            'viewServer parameter should be a string')

    def test_neighborCount_not_integer(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes = dict(
                    someNode='someValue',
                ),
                email=['someone@somewhere'],
                viewServer='https:tumormap.ucsc.edu',
                neighborCount='a',
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        #print "data['error']", data['error']
        s.assertTrue(data['error'] ==
            'neighborCount parameter should be a positive integer')
    
    def test_map_has_background_data(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap',
                layout='someLayout',
                nodes = dict(
                    someNode='someValue',
                )
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'Map does not have any layouts with background data: someMap')

    def test_layout_has_background_data(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='someLayout',
                nodes = dict(
                    someNode='someValue',
                ),
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        #print "data['error']", data['error']
        s.assertTrue(data['error'] ==
            'Layout does not have background data: someLayout')
            
    def test_some_calc_error(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                nodes = dict(
                    testError='something',
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        #print "data['error']", data['error']
        s.assertTrue(data['error'] == 'Some error message or stack trace')

    def test_single_node_no_individual_urls(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        # print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode1'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)
    
    def test_single_node_individual_urls_false(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                individualUrls=False,
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        # print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode1'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)

    def test_single_node_individual_urls_true(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                individualUrls=True,
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        # print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode1'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)

    def test_multi_nodes_no_individual_urls(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                    newNode2= {
                        'TP53': 0.42,
                        'ALK': 0.36,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        #print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('newNode2' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode2'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)
        # urls for all nodes should be the same
        s.assertTrue(data['nodes']['newNode1']['url'] == \
            data['nodes']['newNode2']['url'])
            
    def test_multi_nodes_individual_urls_false(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                individualUrls=False,
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                    newNode2= {
                        'TP53': 0.42,
                        'ALK': 0.36,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        # print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('newNode2' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode2'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)
        # urls for all nodes should be the same
        s.assertTrue(data['nodes']['newNode1']['url'] == \
            data['nodes']['newNode2']['url'])

    def test_multi_nodes_individual_urls_true(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='Pancan12/SampleMap',
                layout='mRNA',
                individualUrls=True,
                nodes = dict(
                    newNode1= {
                        'TP53': 0.54,
                        'ALK': 0.32,
                    },
                    newNode2= {
                        'TP53': 0.42,
                        'ALK': 0.36,
                    },
                ),
                testStub=True
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        # print "data", data
        s.assertTrue('newNode1' in data['nodes'])
        s.assertTrue('newNode2' in data['nodes'])
        s.assertTrue('x' in data['nodes']['newNode1'])
        s.assertTrue(data['nodes']['newNode1']['x'] == 73)
        s.assertTrue('neighbors' in data['nodes']['newNode2'])
        s.assertTrue('TCGA-BP-4790' in data['nodes']['newNode1']['neighbors'])
        s.assertTrue(data['nodes']['newNode1']['neighbors']['TCGA-BP-4790'] == \
            0.352)
        bookmarkParm = '/?bookmark='
        sLen = len(s.viewServer) + len(bookmarkParm)
        s.assertTrue(data['nodes']['newNode1']['url'][:sLen] == \
            s.viewServer + bookmarkParm)
        # urls for all nodes should be differnet
        s.assertTrue(data['nodes']['newNode1']['url'] != \
            data['nodes']['newNode2']['url'])
    
if __name__ == '__main__':
    unittest.main()
