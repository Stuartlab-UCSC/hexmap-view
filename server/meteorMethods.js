var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var path = Npm.require('path');

// TODO these dirs may need to be different with built meteor
// There is a better way to do this for dev and built
var serverDir = '../../../../../server/';
var dataDir = '../../../../../public/data/';

Meteor.methods({

    getDataDirs: function (user) {

        // Retrieve data directories
        this.unblock();
        var future = new Future(),
            dir = dataDir + ((_.isUndefined(user)) ? '' : user);
        fs.readdir(dir, function (error, results) {
            if (error) {
                future.throw(error);
            } else {
                future.return(results);
            }
        });
        return future.wait();
    },

    pythonCall: function (pythonCallName, parms) {

        // Call a python function named pythonCallName passing the parms
        this.unblock();
        var future = new Future();

        var command =
            'python '
            + serverDir
            + pythonCallName
            + ".py '"
            + JSON.stringify({parm: parms})
            + "'";

        exec(command, function (error, stdout, stderr) {
            if (error) {
                future.throw(error);
            } else {
                future.return(stdout.toString());
            }
        });
        return future.wait();
    },
});
