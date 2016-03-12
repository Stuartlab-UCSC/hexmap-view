// dbMethods.js

Meteor.methods({

    findBookmark: function (_id) {
        return Bookmarks.findOne(_id.toString());
    }

});