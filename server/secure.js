
// secure.js

// This file contains all the meteor server code related to security:
// logins, associating users with roles, authorization...

var exec = Npm.require('child_process').exec;

//removeRoles(['Pancan12']);
//createRole('viewAll');
//createRole('CIRM');
//removeUsersFromRoles(['jstuart@ucsc.edu'], ['dev', 'Pancan12']);
//showUsernames();
//addUsersToRoles (['mcrchopra@gmail.com'] , ['dev']);
//removeUser('hexmap@ucsc.edu');
//Meteor.users.remove({});

showRolesWithUsersAndProject();

function usernamesToUsers (usernamesIn) {
    var usernames = usernamesIn;
    if (typeof usernames === 'string') {
        usernames = [usernamesIn];
    }
    return _.map(usernames, function (username) {
        return Accounts.findUserByUsername(username)
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

function removeUsersFromRoles(usernames, roles) {

    var users = usernamesToUsers(usernames);
    Roles.removeUsersFromRoles(users, roles);
}

function showRolesWithUsersAndProject () {

    // Show all roles with users and projects in each
    var roleObjs = Roles.getAllRoles().fetch();
    var roles = _.map(roleObjs, function(role) {
        return role.name;
    });
    var projects = getDataDirs();
    var roleProjects = {};
    
    // Find the projects for each role
    _.each(projects, function (project) {
        var role = getProjectRole(project);
        if (!role) {
        
            // Make a fake role so we print those projects with no role
            role = 'none, only dev and viewAll may view';
            if (roles.indexOf(role) < 0) {
                roles.push(role);
            }
        }
        if (roleProjects[role]) {
            roleProjects[role].push(project);
        } else {
            roleProjects[role] = [project];
        }
    });

    // Print for each role, its users and projects
    console.log('\nRoles, users, projects: ---------------------------');
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
        console.log('Role:', role, '\n  Usernames:', usernames, '\n  Projects:', roleProjects[role]);
    });
    console.log('Users without a role:', noRoleUsers);
}

function showUsers () {

    // Show all users with their properties
    var users = Meteor.users.find().fetch();
    console.log('all users:\n', users);
}

function getAllUsernames () {

    // Find all of the usernames
    var users = Meteor.users.find({}, {fields: {username: 1, _id: 0}}).fetch();
    return _.map(users, function (user) {
        return user.username;
    });
}

function showUsernames () {

    // Show all usernames
    console.log('all usernames:\n', getAllUsernames());
}

function removeRoles (role) {

    // Drop all users from the roles and remove the roles.
    if (!role) return;
    
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

function createRole(newRoleName) {
    
    // Create a role unless it already exists
    var roles = Roles.getAllRoles().fetch();
    var foundRole = _.find(roles, function (role) {
        return role.name === newRoleName;
    });
    if (!foundRole) {
        Roles.createRole(newRoleName)
    }
}

function removeUser(username) {
    var user = usernamesToUsers(username);
    Meteor.users.remove(user[0]);
}

// More possible queries
/*
showProjectsWithRoles: Show all projects with the role in each
userRequestRole: A UI for a user to request to join a role
*/

Accounts.onCreateUser(function (options, user) {

     // Add a field of 'username' that meteor recognizes as unique
    user.username = user.emails[0].address;
    
    // Send the admin an email.
    var msg = "'New user: "
        + user.emails[0].address
        + ' at '
        + URL_BASE.toString()
        + "'";
    sendMail(ADMIN_EMAIL, msg, msg);
    
    // Don't forget to return the new user object.
    return user;
});

isUserAuthorized = function (user, role) {

    // Determine if a user is authorized based on this role.
    // user and role are single strings, no arrays.
    // Logs a message when user is not authorized.
    var PUBLIC = 'public',
        ALL_ACCESS = ['dev', 'omni'];
    
    // Public projects with are viewable by anyone
    if (role === 'public') return true;
    
    // When not logged in, only public projects may be seen.
    if (!user) return false;
    
    // Authorize anything if the user is in the dev role.
    if (Roles.userIsInRole(user, ALL_ACCESS)) return true;
    
    // No role at this point means no authorization. Only ALL_ACCESS can access this.
    if (!role) return false;
    
    // Authorize if the user is in the given role
    if (Roles.userIsInRole(user, role)) return true;

    // Not authorized
    return false;
}

Meteor.methods({

    isUserInRole: function (role) {
        return Roles.userIsInRole(Meteor.user(), role);
    },
});
