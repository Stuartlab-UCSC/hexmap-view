
// secureRoleTests.js

// Meteor server code to test role package security
// Note this only tests the Roles package and not our functions in secure.js

// Unit tests are here since mocha is broken
function runUnitTests () {

    var failures = 0;

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
        console.log('rc on insert of user:', ids[i]);
        //failures += 1;
        i += 1;
    }
    console.log('ids:', ids);

    // Verify users added
    var usersAdded = Meteor.users.find().fetch();
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

    // Add users to roles, creating roles as needed. users are user objects?
    Roles.addUsersToRoles(usersAdded[0], 'aDeveloper');
    Roles.addUsersToRoles([usersAdded[0], usersAdded[1]], 'CKCC');
    Roles.addUsersToRoles(usersAdded[2], Roles.GLOBAL_GROUP);

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
    var project = 'mcrchopra/first';
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
    
    if (failures < 1) console.log('All user tests were successful!');
}


//runUnitTests() // turn off when not testing;

// More Example calls ///////////////////////////////////////////////

// Insert a user into the users db table via the login UI

// groupId is equivalent to _id in the db.
// userId is equivalent to _id in the db.

/*
Meteor.call('findUser', 'CYhm7nMLqiRPpWYdX', function (error, user) {
    console.log('user.emails[0].address', user.emails[0].address);
});
*/

/*
// Find all users.
Meteor.call('findAllUsers', function (error, users) {
    _.each(users, function (user) {
        console.log('user', user.emails[0].address, user.username);
    });
});
*/
