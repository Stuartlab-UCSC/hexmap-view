// bookmark.js
// Bookmark server methods.

import CryptoJS from 'crypto-js'

var Bookmarks = new Mongo.Collection('bookmarks');

function humanToday () {
    var date = new Date(),
        intMonth = parseInt(date.getMonth()) + 1,
        strMonth = (intMonth < 10) ?
            '0' + intMonth.toString() : intMonth.toString();
    return date.getFullYear() + '-' + strMonth + '-' + date.getDate();
}

function createId (jsonState) {

    // Generate a bookmark ID and URL.
    var id = CryptoJS.SHA256(jsonState).toString();
    return {
        id: id,
        url: URL_BASE + '/?bookmark=' + id,
    };
}

exports.create = function (jsonState, username) {

    // Create or update a bookmark.
    var key = createId(jsonState),
        dbUsername = username,
        bookmark = Bookmarks.findOne(key.id.toString());
    
    // If this bookmark already exists, update the user list.
    if (bookmark) {

        // Convert the db username and the given username to a single array
        // of unique elements.
        dbUsername = _.uniq([].concat(bookmark.username, username)
            .filter(Boolean));
    }

    // Insert/update the state into the bookmark collection.
    Bookmarks.upsert({ _id: key.id },
        {$set: {
            jsonState: jsonState,
            username: dbUsername,
            lastAccess: humanToday(),
        }},
    );
    
    return { bookmark: key.url };
};

Meteor.methods({
    findBookmark: function (id) {
        try {
            var bookmark = Bookmarks.findOne(id.toString()),
                user = Meteor.user();
            
            if (!bookmark) {
                return 'Bookmark not found';
            }
            
            // TODO update the lastAccess date
            Bookmarks.update(id, {
                $set: {
                    username: user ? user.username : undefined,
                    lastAccess: humanToday(),
                },
            });
            return JSON.parse(bookmark.jsonState);
            
        } catch (error) {
            
            console.log('findBookmark() failed with:', error.toString());
            console.trace();
            throw new Meteor.Error('Could not find bookmark', error.toString());
        }
    },

    createBookmark: function (jsonState) {
    
        // Save state in a bookmark, returning the URL.
        try {
            var user = Meteor.user(),
                result = exports.create(
                    jsonState, user ? user.username : undefined);
            return result.bookmark;
            
        } catch (e) {
            console.log('saveBookmark() failed with:', e.toString());
            console.trace();
            throw new Meteor.Error('Could not create bookmark', e.toString());
        }
    }
});
