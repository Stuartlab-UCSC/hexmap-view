var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var os = Npm.require('os');
var crypto = Npm.require('crypto');
var path = Npm.require('path');

// Find the path for the data directory

// TODO these dirs may need to be different with built meteor
// There must be a better way to do this for dev and built
var serverDir = '../../../../../server/'; // TODO move server python files out of meteor
var url = Meteor.absoluteUrl();
var dataDir;
if (url === 'http://localhost:3000/') {
    dataDir = '/Users/swat/';
} else if (url === 'http://hexmap.sdsc.edu:8111/') {
    dataDir = '/cluster/home/swat/';
} else {
    dataDir = '/data/home/swat/';
}

function writeToTempFile (data, fileExtension) {

    // Write arbitrary data to a file, blocking until the write is complete
    var filename = os.tmpdir() + '/' + crypto.randomBytes(4).readUInt32LE(0);
    if (!_.isUndefined(fileExtension)) {
        filename += fileExtension;
    }
    fs.writeFileSync(filename, data);
    return filename;
}

function parseTsv (data) {

    // separate the data in to an array of rows
    var data1 = data.split('\n'),

        // Separate each row into an array of values
        parsed = _.map(data1, function(row) {
            return row.split('\t');
        });

    // Remove any empty row left from the new-line split
    if (parsed[parsed.length-1].length === 1
            && parsed[parsed.length-1][0] === '') {
        parsed.pop();
    }
    return parsed;
}

function readFromTsvFileSync (filename) {

    // Parse the data after reading the file
    return parseTsv(fs.readFileSync(filename, 'utf8'));
}

function fixUpProjectDir (parms) {

    // Make a project data directory string usable by the server code.
    // This is needed due to a prefix required on http calls to proxy
    // servers. This prefix needs to be removed for the server's use.
    // We may not need proxPre after having all file retrievals go through
    // meteor methods.
    parms.directory = dataDir + parms.directory.replace(parms.proxPre, '');
}

Meteor.methods({

    getTsvFile: function (filename, project, proxPre) {

        // Retrieve data from a tab-separated file
        this.unblock();
        var future = new Future();
        var path;
            if (filename.indexOf('layer_') > -1 || filename.indexOf('stats') > -1) {
                path = dataDir + filename.replace(proxPre, '');
            } else {
                path = dataDir + project.replace(proxPre, '') + filename;
            }

        // TODO check for existence first so we don't throw an error into
        // the server log
        if (fs.existsSync(path)) {
            fs.readFile(path, 'utf8', function (error, results) {
                if (error) {
                    future.throw(error);
                } else {

                    future.return(parseTsv(results));
                }
            });
        } else {
            future.return('Error: file not found on server: ' + path);
        }
        return future.wait();
    },

    getDataDirs: function (user) {

        // Retrieve data directories
        this.unblock();
        var future = new Future(),
            dir = dataDir + 'data/' + ((_.isUndefined(user)) ? '' : user);
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

        fixUpProjectDir(parms);

        // Write the parms to a temporary file so we don't overflow the stdout
        // buffer.
        parmFile = writeToTempFile(JSON.stringify({parm: parms}));

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
                    var data = readFromTsvFileSync(result);
                    fs.unlinkSync(parmFile);
                    //fs.unlinkSync(result); // TODO may not always be a temp file?
                    future.return(data);
                }
            }
        });
        return future.wait();
    },
});
