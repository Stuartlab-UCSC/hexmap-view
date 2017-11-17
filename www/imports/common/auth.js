
// auth.js
// Authorize users based on roles and project access.

import perform from '/imports/common/perform.js';
import util from '/imports/common/util.js';

function getCredentials (userId) {

    // Whenever the user changes, including logout, check to see
    // what sort of credentials the user has.
    if (userId) {
        perform.log('auth:credentials-request:userId:' + userId);
        Meteor.call('is_user_in_role', ['jobs', 'dev'],
            function (error, results) {
                if (results) {
                    Session.set('jobCredential', true);
                } else {
                    Session.set('jobCredential', false);
                }
                perform.log('auth:credentials-got:userId,has-creds?:' +
                    userId + ',' + Session.get('jobCredential'));
            }
        );
    } else {
        Session.set('jobCredential', false);
        perform.log('auth:no-credentials-for-no-userId');
        
    }
}

exports.credentialCheck = function (credential) {

    // Bail with a message if the user is not logged in or does not have
    // the credentials.
    var returnVal = false;
    if (!Meteor.userId()) {
        util.banner('error', 'Please log in ' + credential + '.');
    } else if (!(Session.get('jobCredential'))) {
        util.banner('error', 'Sorry, you do not have credentials ' +
           credential + '. Please request access from hexmap at ucsc dot edu.');
    } else {
        returnVal = true;
    }
    return returnVal;
};

exports.init = function () {

    // Listen for a change of user.
    Meteor.autorun(function () {
        var userId = Meteor.userId();
        perform.log('auth:user-change-check:userId:' + userId);
            
        getCredentials(userId);
        if (Session.equals('page', 'mapPage')) {
            import project from '/imports/mapPage/head/project.js';
            project.authorize(userId);
        }
    });
};
