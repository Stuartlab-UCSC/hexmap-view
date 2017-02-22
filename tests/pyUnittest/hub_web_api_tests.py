import os
import hub
import unittest
import tempfile

class hubTestCase(unittest.TestCase):

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

    def test_404_root(s):
        rv = s.app.get('/')
        s.assertTrue(rv.status_code == 404)
        #assert b'No entries here so far' in rv.data

    def test_404_query(s):
        rv = s.app.get('/query')
        """
        print 'rv:', str(rv)
        print 'rv.status_code:', str(rv.status_code)
        print 'rv.status:', str(rv.status)
        print 'rv.data:', str(rv.data)
        """
        s.assertTrue(rv.status_code == 404)
        #assert b'No entries here so far' in rv.data

if __name__ == '__main__':
    unittest.main()
