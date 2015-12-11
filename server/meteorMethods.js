var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var os = Npm.require('os');
var crypto = Npm.require('crypto');
var path = Npm.require('path');

// TODO these dirs may need to be different with built meteor
// There must be a better way to do this for dev and built
var dirPrefix = '../../../../../';
var serverDir = dirPrefix + 'server/';
var publicDir = dirPrefix + 'public/';
var dataDir = publicDir + 'data/';

function writeToTempFile (data) {
    var filename = os.tmpdir() + '/' + crypto.randomBytes(4).readUInt32LE(0);
    fs.writeFileSync(filename, data);
    return filename;
}

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

        // Make a project data directory string usable by the server code.
        // This is needed due to a prefix required on http calls to proxy
        // servers.
        parms.directory = publicDir + parms.directory.replace(parms.proxPre, '');

        // Write the parms to a temporary file so the OS doesn't error on
        // paramters too long.
        filename = writeToTempFile(JSON.stringify({parm: parms}));

        var command =
            'python '
            + serverDir
            + pythonCallName
            + ".py '"
            + filename
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
