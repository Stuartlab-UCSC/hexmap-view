
// auth.js
// Authorize users based on roles and project access.

import perform from '/imports/common/perform.js';
import rx from '/imports/common/rx.js';
import userMsg from '/imports/common/userMsg';

function getUserRoles () {

    // Whenever the user changes, including logout, check to see
    // what sort of credentials she has.
    rx.set('user.roles.empty');
    perform.log('auth:credentials-request');
    Meteor.call('getUserAuthorizationRoles', function (error, results) {
        if (results) {
            rx.set('user.roles.load', { roles: results });
            
            // Authorize the project if we are on the map page.
            if (Session.equals('page', 'mapPage')) {
                import project from '/imports/mapPage/head/project.js';
                project.authorize();
            }
        }
        perform.log('auth:credentials-got:has-roles?:' +
            rx.get('user.roles'));
    });
}

exports.credentialCheck = function (credential) {

    // Bail with a message if the user is not logged in.
    var returnVal = true;
    if (!Meteor.userId()) {
        userMsg.error('Please log in or create an account ' + credential + '.');
        returnVal = false;
    }
    return returnVal;
};

exports.init = function () {

    // Listen for a change of user including logout.
    Meteor.autorun(function () {
        var userId = Meteor.userId();
        perform.log('auth:user-change-check:userId:' + userId);
        
        // Get the user's roles.
        getUserRoles();
    });
};
