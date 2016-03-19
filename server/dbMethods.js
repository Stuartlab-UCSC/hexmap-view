// dbMethods.js

Meteor.methods({

    findBookmark: function (id) {
        return Bookmarks.findOne(id.toString());
    },
    
    addBookmark: function (id, state) {
        return Bookmarks.insert({
            "_id": id,
            "jsonState": state,
            "createdAt": new Date(),
        });
    },
    
    findUser: function (id) {
        return Meteor.users.findOne(id);
    },

});

// Utilities for testing /////////////////////////////

/*
Meteor.call('insertUser', 'hexmap@santaCruzWood.com', function (error, result) {
    console.log('insertUser error, result:', error, result);
})
*/
/*
Meteor.call('findUser', 'Gxe2RWPbKcdTt6Ntb', function (error, user) {
    console.log('user.emails[0].address', user.emails[0].address);
})
*/

// Create a roll
//var rc = Roles.createRole('swat');
//console.log('rc:', rc);

// Add users to roles. note: creates role if it does not exist
//var rc = Roles.addUsersToRoles('Gxe2RWPbKcdTt6Ntb', 'swat');
//console.log('rc:', rc);

// Show roles for this use
//console.log('roles for this user:', Roles.getRolesForUser('Gxe2RWPbKcdTt6Ntb'));
//console.log('user is in Role swat:', Roles.userIsInRole ('Gxe2RWPbKcdTt6Ntb', 'swat'));

// returns cursor:
//console.log('users in role swat:', Roles.getUsersInRole('swat'));
//console.log('1st role: ', Roles.getAllRoles()[0]);
