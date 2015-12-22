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

function writeToTempFile (data, fileExtension) {
    var filename = os.tmpdir() + '/' + crypto.randomBytes(4).readUInt32LE(0);
    if (!_.isUndefined(fileExtension)) {
        filename += fileExtension;
    }
    fs.writeFileSync(filename, data);
    // TODO: close this file!?
    return filename;
}

function readFromFile (filename) {
    var data = fs.readFileSync(filename, 'utf8');

    // separate the data in to an array of rows
    data = data.split('\n');

    // Separate each row into an array of values
    data = _.map(data, function(row) {
        return row.split('\t');
    });
    return data;
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

        // Create temp file if the client wants us to
        if (parms.hasOwnProperty('tempFile')) {
            parms.tempFile = writeToTempFile('junk');
        }

        // Make a project data directory string usable by the server code.
        // This is needed due to a prefix required on http calls to proxy
        // servers. This prefix needs to be removed for the server's use.
        parms.directory = publicDir + parms.directory.replace(parms.proxPre, '');

        // Write the parms to a temporary file so we don't overflow the stdout
        // buffer.
        parmFile = writeToTempFile(JSON.stringify({parm: parms}));
        // TODO remove this file?

        var command =
            'python '
            + serverDir
            + pythonCallName
            + ".py '"
            + parmFile
            + "'";

        exec(command, function (error, stdout, stderr) {
            if (error) {
                future.throw(error);
            } else {

                var result = stdout.toString().slice(1, -2); //strip quotes and newline

                // Return any known errors to the client
                if (result.slice(0,5) === 'Error' || result.slice(0,4) === 'Info') {
                    fs.unlinkSync(parmFile);
                    future.return(result);
                } else {

                    // Read the tsv results file, creating an array of strings,
                    // one string per row. Return the array to the client where
                    // the row format is known, and parse them there.
                    // TODO This is a total abuse of Meteor and should be change
                    // to what is best for meteor. This is reading the file on
                    // the server, then passing the long array to the client.
                    var data = readFromFile(result);
                    fs.unlinkSync(parmFile);
                    //fs.unlinkSync(result); // TODO is this always a temp file?
                    future.return(data);
                }
            }
        });
        return future.wait();
    },
});
