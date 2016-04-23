
// secure.js

// This file contains all the meteor server code related to security:
// logins, associating users with roles, authorization...

var exec = Npm.require('child_process').exec;

function addUsersToRoles (usernamesIn, roles) {

    // Add users to roles
    // Users must exist
    // Non-existant roles will be created
    // Duplicate roles will be not added
    var usernames = usernamesIn;
    if (typeof usernames === 'string') {
        usernames = [usernamesIn];
    }
    var users = _.map(usernames, function (username) {
        return Accounts.findUserByUsername(username)
    });
    Roles.addUsersToRoles(users, roles);
}

function showRolesWithUsersAndProject () {

    // Show all roles with users and projects in each
    console.log('\nroles with users and projects in each');
    
    var roleObjs = Roles.getAllRoles().fetch();
    var roles = _.map(roleObjs, function(role) {
        return role.name;
    });
    var projects = getDataDirs();
    var roleProjects = {};
    
    // Find the projects for each role
    _.each(projects, function (project) {
        var role = getProjectRole(project);
        if (roleProjects[role]) {
            roleProjects[role].push(project);
        } else {
            roleProjects[role] = [project];
        }
    });

    // Print for each role, its users and projects
    _.each(roles, function (role) {
        var users = Roles.getUsersInRole(role).fetch();
        var usernames = _.map(users, function (user) {
            return user.username;
        });
        console.log('\nRole:', role);
        console.log('Usernames:', usernames);
        console.log('Projects:', roleProjects[role]);
    });
}

function showUsers  () {

    // Show all users with their properties
    var users = Meteor.users.find().fetch();
    console.log('all users:\n', users);
}

function showUsernames () {

    // Show all usernames
    var users = Meteor.users.find({}, {fields: {username: 1, _id: 0}}).fetch();
    var usernames = _.map(users, function (user) {
        return user.username;
    });
    console.log('all usernames:\n', usernames);
}

//showUsernames();
//addUsersToRoles ('swat@soe.ucsc.edu', 'CKCC');
//showRolesWithUsersAndProject();
//addUsersToRoles(['x@x.x'],
//Meteor.users.remove({});



// Possible queries
/*
showRolesWithUsers: Show all roles with users in each
showRolesWithProjects: Show all roles with projects in each
showProjectsWithRoles: Show all projects with the role in each
userRequestRole: A UI for a user to request to join a role
*/

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
    
    // Send the admin an email.
    sendNewUserMail(user);
    
    // Don't forget to return the new user object.
    return user;
});

isUserInRole = function (user, role) {

    // Determine if a user is in a role.
    if (!role) return false;
    
    var roles = role;
    if (Object.prototype.toString.call(role) === '[object String]' ) {
        roles = [role];
    }
    if (roles.indexOf('public') > -1 || (user && Roles.userIsInRole(user, roles))) {
        return true;
    } else {
        return false;
    }
}

Meteor.methods({

    isUserInRole: function (role) {
        return isUserInRole(Meteor.user(), role);
    },
});
