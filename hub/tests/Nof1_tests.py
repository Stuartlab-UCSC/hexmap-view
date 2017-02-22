import os
import hub
import unittest
import tempfile
import json

class Nof1TestCase(unittest.TestCase):

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
        s.assertTrue(data['error'] == 'parameter missing or malformed: nodes ')

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
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['error'] ==
            'email parameter should be a list/array of strings')

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
                map='CKCC/v3',
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
        s.assertTrue(data['error'] ==
            'Layout does not have background data: someLayout')
    """
    def test_passing_all_validations(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map = 'CKCC/v3',
                layout = 'mRNA',
                nodes = dict(
                    someNode='someValue',
                ),
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        s.assertTrue(data['data'] == 'Success!')
    """
    """
    def test_bookmark_creation(s):

    def test_bookmark_works(s):

    def test_good(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data = json.dumps({
                map: "CKCC/v1",
                layout: "mRNA",
                email: [
                    "swat@soe.ucsc.edu",
               ],
               viewServer: viewServer,
               neighborCount: 8,
               nodes: {
                   mySample1: {
                       ALK: "0.897645",
                       TP53: "0.904140",
                       POGZ: "0.792754",
                   },
                   mySample2: {
                       ALK: "0.897645",
                       TP53: "0.904140",
                       POGZ: "0.792754",
                   },
               },
            }
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        #print 'rv:', str(rv)
        #print 'rv.status_code:', rv.status_code
        #print 'rv.data:', rv.data
        #print 'data:', data
        #print "data['error']:", data["message"]
        s.assertTrue(rv.status_code == 200)
    """
    
if __name__ == '__main__':
    unittest.main()
