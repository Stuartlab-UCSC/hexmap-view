
// auth.js
// Authorize users based on roles and project access.

import perform from '/imports/common/perform.js';
import Util from '/imports/common/util.js';

exports.isNewUser = function (user, prevUsername) {
    var isNew = false;
    if (user) {
        if (user.username !== prevUsername) {
            prevUsername = user.username;
            isNew = true;
        }
    } else if (prevUsername !== 'null') {
        prevUsername = 'null';
        isNew = true;
    }
    return {isNew: isNew, prevUsername: prevUsername};
};

var prevUsername = 'empty';

exports.getCredentials = function () {

    // Whenever the user changes, including logout, check to see
    // if the user has job credentials.
    // Whenever the user changes, including logout, check to see
    // if the user has job credentials.
    Meteor.autorun( function () {
        var user = Meteor.user(), // jshint ignore: line
            a = exports.isNewUser(user, prevUsername);
        Session.set('jobCredential', false);
        if (a.isNew) {
            prevUsername = a.prevUsername;
            if (user) {
                Meteor.call('is_user_in_role', ['jobs', 'dev'],
                    function (error, results) {
                        if (results) {
                            Session.set('jobCredential', true);
                        } else {
                            Session.set('jobCredential', false);
                        }
                        perform.log('auth.getCredentials(): with username: ' +
                            Session.get('jobCredential'));
                    }
                );
            } else {
                perform.log('auth.getCredentials():no user: ' +
                    Session.get('jobCredential'));
            }
        } else {
            perform.log('auth.getCredentials():not new user ' +
                Session.get('jobCredential'));
        }
    });
};

exports.credentialCheck = function (credential) {

    // Bail with a message if the user is not logged in or does not have
    // the credentials.
    var returnVal = true;
    if (!Meteor.user()) {
        Util.banner('error', 'Please log in ' + credential + '.');
        returnVal = false;
    } else if (!(Session.get('jobCredential'))) {
        Util.banner('error', 'Sorry, you do not have credentials ' +
           credential + '. Please request access from hexmap at ucsc dot edu.');
        returnVal = false;
    }
    return returnVal;
};
