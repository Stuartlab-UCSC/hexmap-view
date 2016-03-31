
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
