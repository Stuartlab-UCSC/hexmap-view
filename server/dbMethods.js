// dbMethods.js

Meteor.methods({

    findBookmark: function (id) {
        return Bookmarks.findOne(id.toString());
    },
    
    addBookmark: function (id, state) {
        return Bookmarks.insert({
            "_id": id,
            "jsonState": JSON.stringify(state),
            "createdAt": new Date(),
        });
    },
    
});
