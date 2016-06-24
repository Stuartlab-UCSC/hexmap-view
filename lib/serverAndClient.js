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
// Some global settings available to server and client.
URL_BASE = Meteor.settings.public.URL_BASE;
VIEW_DIR = Meteor.settings.public.VIEW_DIR;
LAYOUT_INPUT_DIR = Meteor.settings.public.LAYOUT_INPUT_DIR;
FEATURE_SPACE_DIR = Meteor.settings.public.FEATURE_SPACE_DIR;
ADMIN_EMAIL = Meteor.settings.public.ADMIN_EMAIL;
if (Meteor.settings.public.DEV === 'yes') { // strict JSON doesn't support booleans
    DEV = true; //development functionality will be included
} else {
    DEV = false;
}

// TODO test logic should not be in production code
TEST_DATA_DIR = '/Users/swat/dev/hexagram/tests/pyUnittest/testData/';
TEMP_DIR = '/tmp/';



// accessing remote collections on another server
//var mongo_url = 'mongodb://127.0.0.1:27017/dev'
//var database = new MongoInternals.RemoteCollectionDriver(mongo_url);
//Bookmarks = new Mongo.Collection('bookmarks', { _driver: database });

// This may be all that is required to access a collection on client and server
Bookmarks = new Mongo.Collection('bookmarks');
ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');


/*
// Deny all client-side updates to user documents
Meteor.users.deny({
  update() { return true; }
});
*/
