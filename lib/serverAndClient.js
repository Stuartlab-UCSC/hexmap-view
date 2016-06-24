// serverAndClient.js
// globals for client and server

if (Meteor.isClient) {
    ctx = null; // The global client state
    layers = {}; // contains almost all information about attributes
    googlemap = null; // our main googlemap instance
    colormaps = {};
}

if (Meteor.isServer) {
    var process = Npm.require('process');
    Meteor.startup(function () {
        process.env.MAIL_URL = 'smtp://hexmap%40ucsc.edu:Juno6666@smtp.gmail.com:587';
    });
}

DEV = ''; // true on dev server, false if not
URL_BASE = '';
VIEW_DIR = ''; // Global directories
LAYOUT_INPUT_DIR = '';
FEATURE_SPACE_DIR = '';
TEST_DATA_DIR = '';
TEMP_DIR = '';

var url = Meteor.absoluteUrl();
var urlPort = Number(url.slice(url.lastIndexOf(':') + 1, -1));
var base = 'global_dirs_not_defined_';

if (urlPort === 3333) {

    // Swat's localhost development uses this port
    DEV = true;
    base = '/Users/swat/'; //this is where the data file is
    URL_BASE = 'localhost:3333'
} else if (urlPort === 8115) {
    // Duncan's hexmap server development uses this port
    DEV = false;
    base = '/cluster/home/dmccoll/start8115TM/'; //this is where the data dir is
    URL_BASE = 'http://tumormap.ucsc.edu:' + urlPort;
} else if (urlPort > 8080 && urlPort < 8443) {

    // Development
    DEV = true;
    base = '/cluster/home/swat/';
    URL_BASE = 'https://tumormap.ucsc.edu:' + (urlPort - 1);
} else if (urlPort === 2347) {
    // Duncan's localhost development uses this port
    DEV = false;
    base = '/home/duncan/'; //this is where the data dir is
    URL_BASE = 'localhost:2347';
} else {
    // Production
    DEV = false;
    base = '/data/';
    URL_BASE = 'https://tumormap.ucsc.edu';
}

VIEW_DIR = base + 'data/view/';
LAYOUT_INPUT_DIR = base + 'data/layoutInput/';
FEATURE_SPACE_DIR = base + 'data/featureSpace/';
TEST_DATA_DIR = base + 'dev/hexagram/tests/pyUnittest/testData/';
TEMP_DIR = '/tmp/';

// accessing remote collections
//var mongo_url = 'mongodb://127.0.0.1:27017/dev'
//var database = new MongoInternals.RemoteCollectionDriver(mongo_url);
//Bookmarks = new Mongo.Collection('bookmarks', { _driver: database });

Bookmarks = new Mongo.Collection('bookmarks');
ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');



/*
// Deny all client-side updates to user documents
Meteor.users.deny({
  update() { return true; }
});
*/
