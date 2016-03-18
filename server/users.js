
// users.js

var exec = Npm.require('child_process').exec;

Meteor.methods({

    sendNewUserMail: function (user) {
    
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
    },
});

Accounts.onCreateUser(function (options, user) {

    // Notify the admin of a new user
    Meteor.call('sendNewUserMail', user, function (error, result) {
    })

    // Don't forget to return the new user object at the end!
    return user;
});
