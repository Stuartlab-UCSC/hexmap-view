// dbMethods.js
// Misc database methods that are not enough code to stand in their own file.

var crypto = Npm.require('crypto');
var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');
var Http = require('./http');
var DbMethods = require('./dbMethods');

var Bookmarks = new Mongo.Collection('bookmarks');

humanToday = function () {
     var date = new Date();
     return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
}

function findBookmark (id, future) {
    try {
        var bookmark = Bookmarks.findOne(id.toString()),
            user = Meteor.user();
        
        if (!bookmark) {
            future.return('Bookmark not found');
            return;
        }
        
        // TODO update the lastAccess date
        Bookmarks.update(id, {
            $set: {
                username: user ? user.username : undefined,
                lastAccess: humanToday(),
            },
        });
        future.return(JSON.parse(bookmark.jsonState));
        
    } catch (error) {
        console.log('findBookmark() failed with:', error.toString());
        future.throw(error.toString());
    }
}

function createBookmark (state, future) {

    // Save state in a bookmark, returning the hash ID in the future return
    try {
        var hash = crypto.createHash('sha256');
        hash.update(state);
        var id = hash.digest('hex'),
            user = Meteor.user();

        var upsertReturn = Bookmarks.upsert({ _id: id },
            {$set: {
                jsonState: state,
                username: user ? user.username : undefined,
                lastAccess: humanToday(),
            }},
        );
        future.return(id);
        
    } catch (e) {
        console.log('saveBookmark() failed with:', e.toString());
        future.throw(e.toString());
    }
}

exports.createBookmarkFiber = function (state, res) {
    
    new Fiber(function () {
        
        // Save state in a bookmark, returning the hash ID in the future return
        try {
            var hash = crypto.createHash('sha256');
            hash.update(state);
            var id = hash.digest('hex');

            var upsertReturn = Bookmarks.upsert({ _id: id },
                {$set: {
                    jsonState: state,
                    username: 'query/createBookmark',
                    lastAccess: humanToday(),
                }},
            );
            Http.respond(200, res, { bookmark: id });
            
        } catch (e) {
            console.log('saveBookmark() failed with:', e.toString());
            
            Http.respond(500, res, { error: e.toString() });
        }
    }).run();
}

Meteor.methods({

    findBookmark: function (id) {
    
        // Find a bookmark and return it's contents
        this.unblock();
        var future = new Future();
        findBookmark(id, future);
        return future.wait();
    },
    
    createBookmark: function (state) {
        this.unblock();
        var future = new Future();
        createBookmark(state, future);
        return future.wait();
    },
});
