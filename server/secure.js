
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
    
    // Send the admin an email.
    sendNewUserMail(user);
    
    // Don't forget to return the new user object.
    return user;
});
