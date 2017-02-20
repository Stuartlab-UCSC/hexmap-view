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
                password='password'
            )
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['message'] == 'Content-Type must be application/json')

    def test_data_not_json(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=dict(
                map='someMapId'
            )
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['message'] == 'Post content is invalid JSON')
    
    def test_no_map(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                someData='someData'
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['message'] == 'Map parameter missing or malformed')

    def test_no_layout(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='someMap'
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 400)
        s.assertTrue(data['message'] == 'Layout parameter missing or malformed')

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
        s.assertTrue(data['message'] == 'Nodes parameter missing or malformed')

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
        s.assertTrue(data['message'] ==
            'Nodes parameter should result in a python dict')

    def test_map_exists(s):
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
        s.assertTrue(data['message'] == 'Map does not exist: someMap')

    def test_layout_exists(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map='CKCC/v3',
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
        s.assertTrue(data['message'] == 'Layout does not exist: someLayout')

    def test_passing_all_validations(s):
        rv = s.app.post('/query/overlayNodes',
            content_type='application/json',
            data=json.dumps(dict(
                map = 'CKCC/v3',
                layout = 'mRNA',
                nodes = dict(
                    someNode='someValue',
                )
            ))
        )
        try:
            data = json.loads(rv.data)
        except:
            s.assertTrue('', 'no json data in response')
        s.assertTrue(rv.status_code == 200)
        s.assertTrue(data['data'] == 'Success!')
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
        #print "data['message']:", data["message"]
        s.assertTrue(rv.status_code == 200)
        """
    
if __name__ == '__main__':
    unittest.main()
