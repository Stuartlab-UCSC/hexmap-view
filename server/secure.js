
// secure.js

// This file contains all the meteor server code related to security:
// logins, associating users with userGroups, authorization...

var exec = Npm.require('child_process').exec;

function sendNewUserMail(user) {
    
    // Notify the admin of a new user
    var msg = "'New "
        + user.emails[0].address
        + ' at '
        + Meteor.absoluteUrl()
        + "'",
        command =
            'echo '
            + msg
            + ' | '
            + 'mail -s '
            + msg
            + ' hexmap@ucsc.edu';

    exec(command, function (error, stdout, stderr) {
        if (error) {
            console.log('sendNewUserMail had an error:', error);
        }
    });
}

Accounts.onCreateUser(function (options, user) {

     // Add a field of 'username' that meteor recognizes as unique
    user.username = user.emails[0].address;
    
    // Notify the admin of a new user
            var msg = "'New "
            + user.emails[0].address
            + ' at '
            + Meteor.absoluteUrl()
            + "'",
            command =
                'echo '
                + msg
                + ' | '
                + 'mail -s '
                + msg
                + ' hexmap@ucsc.edu';

        exec(command, function (error, stdout, stderr) {
            if (error) {
                console.log('sendNewUserMail had an error:', error);
            }
        });
    
    // Don't forget to return the new user object.
    return user;
});

// Unit tests are here since mocha is broken ///////////////////////////////////
function runUnitTests () {

    var failures = 0;

/*
    // Clear all users
    var count = Meteor.users.remove({});
    //console.log('deleteAllUsers: number of users removed:', count);
    
    // Verify all users are removed
    var users = Meteor.users.find({}).fetch();
    if (users.length > 0) {
        console.log('FAILED: not all users were removed.');
        failures += 1;
    }
    

    // Clear all roles
    var roles = Roles.getAllRoles().fetch(),
        count = roles.length;
    _.each(roles, function (role) {
        Roles.deleteRole(role.name);
    });
    //console.log('deleteAllRoles: number of roles removed:', count);

    // Add users
    var users = [
        {
            username: 'aDeveloper@a.a',
            emails: [
                {address: 'a@a.a'},
            ]
        },
        {
            username: 'ckccMember@a.a',
            emails: [
                {address: 'b@a.a'},
            ]
        },
        {
            username: 'admin@a.a',
            emails: [
                {address: 'c@a.a'},
            ]
        },
    ]
    var ids = [],
        i = 0;
    for (user in users) {
        ids[i] = Meteor.users.insert(user);
        i += 1;
    }
*/
    // Verify users added
    var usersAdded = Meteor.users.find().fetch();
/*
    if (usersAdded.length !== 3) {
        console.log('FAILED: users added count is not 3.');
        failures += 1;
    }
    _.each(usersAdded, function (user, i) {
        if (user._id !== ids[i]) {
            console.log('FAILED: user not added:', users[i].username);
            failures += 1;
        }
    });
    

    // Create the public group
    Roles.createRole('public');
    
    // Verify role added
    var roles = Roles.getAllRoles ().fetch();
    var found = _.find(roles, function (role) {
        return role.name === 'public';
    });
    if (!found) {
        console.log('FAILED: public role was not created');
        failures += 1;
    }

    // Add users to roles, creating roles as needed
    Roles.addUsersToRoles(usersAdded[0], 'aDeveloper');
    Roles.addUsersToRoles([usersAdded[0], usersAdded[1]], 'CKCC');
    Roles.addUsersToRoles(usersAdded[2], Roles.GLOBAL_GROUP);
*/
    // demo
    //Roles.createRole('CKCC');
    Roles.addUsersToRoles(usersAdded[3], ['public','CKCC']);
/*
    // Verify roles added
    var roles = ['aDeveloper', 'CKCC', Roles.GLOBAL_GROUP, ],
        rolesAdded = Roles.getAllRoles().fetch();
    _.each(roles, function(role) {
        var found = _.find(rolesAdded, function (added) {
            return added.name === role;
        });
        if (!found) {
            console.log('FAILED:, role not added:', role);
            failures += 1;
        }
    });
    
    // Verify users are added to correct roles
    // Assuming usersAdded & rolesAdded are in the same order as added
    if (!Roles.userIsInRole(usersAdded[0], roles[0])) {
        console.log('FAILED: user not in role: ', usersAdded[0].username, roles[0]);
        failures += 1;
    }
    if (!Roles.userIsInRole(usersAdded[0], roles[1])) {
        console.log('FAILED: user not in role: ', usersAdded[0].username, roles[1]);
        failures += 1;
    }
    if (!Roles.userIsInRole(usersAdded[1], roles[1])) {
        console.log('FAILED: user not in role: ', usersAdded[1].username, roles[1]);
        failures += 1;
    }
    if (!Roles.userIsInRole(usersAdded[2], roles[2])) {
        console.log('FAILED: user not in role: ', usersAdded[2].username, roles[2]);
        failures += 1;
    }
 
    // Verify users have the correct number of roles
    var userRoles = Roles.getRolesForUser(usersAdded[0]._id);
    if (userRoles.length !== 2) {
        console.log("FAILED: user's role count should be 2", usersAdded[0].username);
        failures += 1;
    }
    userRoles = Roles.getRolesForUser(usersAdded[1]._id);
    if (userRoles.length !== 1) {
        console.log("FAILED: user's role count should be 1", usersAdded[1].username);
        failures += 1;
    }
    userRoles = Roles.getRolesForUser(usersAdded[2]._id);
    if (userRoles.length !== 1) {
        console.log("FAILED: user's role count should be 1", usersAdded[2].username);
        failures += 1;
    }

    // Read the roles file in a public data directory
    var project = 'data/mcrchopra/first';
    var metaJson = project + '/meta.json';
    var roles = readFromJsonBaseFile(metaJson).roles;
    
    // Verify role read
    var found = _.find(roles, function (role) {
        return role === 'public';
    });
    if (!found) {
        console.log("FAILED: cannot find role 'public' in", metaJson);
        failures += 1;
    }
*/
    
    if (failures < 1) console.log('All user tests were successful!');
}



runUnitTests() // turn off when not testing;

// More Example calls ///////////////////////////////////////////////

// Insert a user into the users db table via the login UI

// groupId is equivalent to _id in the db.
// userId is equivalent to _id in the db.

/*
user = findOne(id);
console.log('user.emails[0].address', user.emails[0].address);
*/

/*
// Find all users.
var users = Meteor.users.find({}).fetch();
    _.each(users, function (user) {
        console.log('user', user.emails[0].address, user.username);
    });
}
*/
