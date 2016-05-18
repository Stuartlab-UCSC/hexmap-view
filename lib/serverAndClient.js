
URL_PORT = 0; // Global url port number for client and server

var url = Meteor.absoluteUrl();
URL_PORT = Number(url.slice(url.lastIndexOf(':') + 1, -1));

if (Meteor.server) {

    VIEW_DATA_DIR = ''; // Global data directory for server
    
    if (URL_PORT === 3000) {

        // Localhost development
        VIEW_DATA_DIR = '/Users/swat/data/view/';
    } else if (URL_PORT > 8080 && URL_PORT < 8443) {

        // Development on hexmap.sdsc.edu
        VIEW_DATA_DIR = '/cluster/home/swat/data/view/';
    } else {

        // Production
        VIEW_DATA_DIR = '/data/data/view/';
    }
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
