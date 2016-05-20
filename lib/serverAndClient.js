
URL_PORT = 0; // Global url port number for client and server

var url = Meteor.absoluteUrl();
URL_PORT = Number(url.slice(url.lastIndexOf(':') + 1, -1));
ctx = null; // The client state

if (Meteor.server) {

    // Global directories
    VIEW_DIR = '';
    LAYOUT_INPUT_DIR = '';
    FEATURE_SPACE_DIR = '';
    TEST_DATA_DIR = '';
    TEMP_DIR = '';
    
    var base = 'global_dirs_not_defined_';
    
    if (URL_PORT === 3333) {

        // Swat's localhost development uses this port
        base = '/Users/swat/';
    } else if (URL_PORT > 8080 && URL_PORT < 8443) {

        // Development on hexmap.sdsc.edu
        base = '/cluster/home/swat/';
    } else {

        // Production
        base = '/data/';
    }
    VIEW_DIR = base + 'data/view/';
    LAYOUT_INPUT_DIR = base + 'data/layoutInput/';
    FEATURE_SPACE_DIR = base + 'data/featureSpace/';
    TEST_DATA_DIR = base + 'dev/hexagram/tests/pyUnittest/testData/';
    TEMP_DIR = base + 'tmp/';
}

// accessing remote collections
//var mongo_url = 'mongodb://127.0.0.1:27017/dev'
//var database = new MongoInternals.RemoteCollectionDriver(mongo_url);
//Bookmarks = new Mongo.Collection('bookmarks', { _driver: database });

Bookmarks = new Mongo.Collection('bookmarks');

/*
// Deny all client-side updates to user documents
Meteor.users.deny({
  update() { return true; }
});
*/
