
// secure.js

// This file contains all the meteor server code related to security:
// logins, associating users with roles, authorization...

//createRole('dev');
//createRole('viewAll');
//createRole('queryAPI');
//createRole('dev');
//createRole('CIRM');
//removeRoles(['Pancan12']);
//removeUsersFromRoles(['jstuart@ucsc.edu'], ['dev', 'Pancan12']);
//showUsernames();
//addUsersToRoles (['swat@soe.ucsc.edu'] , ['dev']);
//removeUser('swat@ucsc.edu');
/*
var users = [
    {email: 'swat@soe.ucsc.edu', roles: ['jobs']},
];
createUsers(users);
*/

function usernamesToUsers (usernamesIn) {
    var usernames = usernamesIn;
    if (typeof usernames === 'string') {
        usernames = [usernamesIn];
    }
    var array = _.map(usernames, function (username) {
        return Accounts.findUserByUsername(username);
    });
    if (typeof usernamesIn === 'string') {
        return array[0];
    }
    return array;
}

function sendEnrollmentEmail(username) {
    var user = usernamesToUsers(username);
    var token = Random.secret();
    var date = new Date();
    var tokenRecord = {
        token: token,
        email: user.username,
        when: date
    };
    Meteor.users.update(user._id, {$set: {
        "services.password.reset": tokenRecord
    }});

    // Before emailing, update user object with new token
    Meteor._ensure(user, 'services', 'password').reset = tokenRecord;
    var enrollAccountUrl = Accounts.urls.enrollAccount(token);

    /*
    // Corrupted passwords message:
    var subject = 'Please reset your password at ' +
        URL_BASE.toString();
    var msg = 'Your password has been corrupted ' +
              'so please reset it at the link below. ' +
              'Note that no one obtained your password, ' +
              'so you may use the same one you had previously.\n\n' +
              enrollAccountUrl + '\n\n' +
              'Please let us know if you do not have access to '+
              'maps that you could previously see. \n\n' +
              'Thank you and sorry for any inconvenience.'
    */
    
    var subject = 'An account has been created for you on ' +
        URL_BASE.toString();
    var msg = subject + '\n' +
              'Please set your password within one week at: \n\n' +
              enrollAccountUrl;
 
    sendMail(username, subject, msg);
    
    // And tell the admin
    msg = "'New user by admin: " +
        username +
        ' at ' +
        URL_BASE.toString() +
        ' with roles: ' +
        user.roles;
    sendMail(ADMIN_EMAIL, msg, msg);
}

function createUsers(users) { // eslint-disable-line no-unused-vars
    _.each(users, function (user) {
        try {
            var id = Accounts.createUser({
                email: user.email,
                password: "changeMe",
                username: user.email,
            });

            // Create the user and add the roles to the user's object
            if (user.roles.length > 0) {
                Roles.addUsersToRoles(id, user.roles);
            }
            sendEnrollmentEmail(user.email);
           
        } catch (error) {
            console.log(`attempting to add user to role since createUser
                failed:` , user.email, error);
            addUsersToRoles([user.email] , user.roles);
        }
    });
}

function addUsersToRoles (usernames, roles) {

    // Add users to roles
    // Users must exist
    // Non-existant roles will be created
    // Duplicate roles will be not added
    var users = usernamesToUsers(usernames);
    if (users) {
        Roles.addUsersToRoles(users, roles);
    }
}

// eslint-disable-next-line no-unused-vars
function removeUsersFromRoles(usernames, roles) {

    var users = usernamesToUsers(usernames);
    Roles.removeUsersFromRoles(users, roles);
}

function getAllUsernames () {

    // Find all of the usernames
    var users = Meteor.users.find({}, {fields: {username: 1, _id: 0}}).fetch();
    return _.map(users, function (user) {
        return user.username;
    });
}

function getAllUsers () {

    // Find all of the users.
    return Meteor.users.find({}, {fields: {username: 1, _id: 1}}).fetch();
}

function showRolesWithUsers() {

    // Show all roles with users in each.
    var roleObjs = Roles.getAllRoles().fetch();
    var roles = _.map(roleObjs, function(role) {
        return role.name;
    });
    
    console.log('\nRoles with users: ---------------------------');
    var noRoleUsers = getAllUsernames();
    _.each(roles, function (role) {
        var users = Roles.getUsersInRole(role).fetch();
        var usernames = _.map(users, function (user) {
            var index = noRoleUsers.indexOf(user.username);
            if (index > -1) {
                noRoleUsers.splice(index, 1);
            }
            return user.username;
        });
        console.log(role, ': Users:', usernames);
    });
    
}

function showUsersWithRoles () {

    // Print for each user with her roles.
    console.log('\nUsers with roles: ---------------------------');
    _.each(getAllUsers(), function (user) {
        var roles = Roles.getRolesForUser(user._id);
        console.log(user.username, ': Roles:', roles);
    });
}

showRolesWithUsers();
showUsersWithRoles();

function showUsers () { // eslint-disable-line no-unused-vars

    // Show all users with their properties
    var users = Meteor.users.find().fetch();
    console.log('all users:\n', users);
}

function showUsernames () { // eslint-disable-line no-unused-vars

    // Show all usernames
    console.log('all usernames:\n', getAllUsernames());
}

function removeRoles (role) { // eslint-disable-line no-unused-vars

    // Drop all users from the roles and remove the roles.
    if (!role) { return; }
    
    var roles = role;
    if (Object.prototype.toString.call(role) === '[object String]' ) {
        roles = [role];
    }
    var users = Meteor.users.find().fetch();
    Roles.removeUsersFromRoles(users, roles);
    _.each(roles, function (role) {
        Roles.deleteRole(role);
    });
}

function createRole(newRoleName) { // eslint-disable-line no-unused-vars
    
    // Create a role unless it already exists
    var roles = Roles.getAllRoles().fetch();
    var foundRole = _.find(roles, function (role) {
        return role.name === newRoleName;
    });
    if (!foundRole) {
        Roles.createRole(newRoleName);
    }
}

function removeUser(username) { // eslint-disable-line no-unused-vars
    var user = usernamesToUsers(username);
    Meteor.users.remove(user);
}

Accounts.onCreateUser(function (options, user) {

    // Add a field of 'username' that meteor recognizes as unique
    user.username = user.emails[0].address;
    
    // Send the admin an email.
    var msg = "'New user: " +
        user.emails[0].address +
        ' at ' +
        URL_BASE.toString() +
        "'";
    sendMail(ADMIN_EMAIL, msg, msg);
    
    // Don't forget to return the new user object.
    return user;
});

Meteor.methods({

    getUserAuthorizationRoles: function () {
    
        // Get the current user's authorization roles.
        var user = Meteor.user();
        if (user === null) {
            return [];
        } else {
            return Roles.getRolesForUser(user._id);
        }
    },

    get_username: function () {
    
        // Get the username of the current user
        if (Meteor.user()) {
            return Meteor.user().username;
        } else {
            return undefined;
        }
    },
});
