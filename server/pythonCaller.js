
// pythonCaller.js
// Call python utilities from nodejs.

var exec = Npm.require('child_process').exec;
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

callPython = function (pythonCallName, opts, callback) {

    // Generic asynchronous caller from server to python code.
    // Put the parameters in a file as json, then call the python routine. The
    // python routine returns either an error string or a filename containing
    // the results as json. The results are returned to the caller via the
    // supplied callback as a javascript object on success, or a string on error.
    
    // Write the opts to a file as json for reading by the python code.
    var parmFile = writeToTempFile(JSON.stringify(opts));
    //console.log(parmFile)
    var command =
        "python "
        + SERVER_DIR
        + "pythonCaller.py '"
        + pythonCallName
        + "' '"
        + parmFile
        + "' '"
        + SERVER_DIR
        + "'";

    var result;
    exec(command, function (error, stdout, stderr) {
        if (error) {
        
            // Return any errors not captured by the python script
            //console.trace()
            result = {code: 1, data: error};
            //TODO we should check stderror as well
        
        } else if (typeof stdout === 'string'
            && (stdout.slice(0,5).toLowerCase() === 'error'
            || stdout.slice(0,7).toLowerCase() === 'warning')) {
        
            // Return any errors/warnings captured by the python script
            result = {code: 1, data: stdout};
         
        } else {
        
            // Success, so read and parse the results in the json file,
            // returning the data
            var str = stdout.toString();
            var filename = str.replace('\n', '');
            var data = readFromJsonFileSync(filename);
            result = {
                code: 0,
                data: data,  // readFromJsonFileSync(stdout.toString().replace('\n', '')),
                filename: filename,
            };
        }
        callback(result);
    });
}

Meteor.methods({

    // For calling python functions from the client
    pythonCall: function (pythonCallName, opts) {

        // Call a python function named pythonCallName passing the opts
        this.unblock();
        var future = new Future();

        // Create temp file if the client wants us to
        if (opts.hasOwnProperty('tempFile')) {
            opts.tempFile = writeToTempFile('junk');
        }

        // Make a project data directory string usable by the server code.
        opts.directory = VIEW_DIR + opts.directory;

        // Write the opts to a temporary file so we don't overflow the stdout
        // buffer.
        var pythonDir = SERVER_DIR,
            parmFile = writeToTempFile(JSON.stringify({parm: opts}));

        var command =
            'python '
            + pythonDir
            + pythonCallName
            + ".py '"
            + parmFile
            + "'";

        exec(command, function (error, stdout, stderr) {
            if (error) {
                console.trace();
                future.throw(error);
            } else {

                var data,
                    result = stdout.toString().slice(0, -1); // remove last newline

                // Return any known errors/warnings to the client
                if (typeof result === 'string' &&
                    (result.slice(0,5).toLowerCase() === 'error'
                    || result.slice(0,7).toLowerCase() === 'warning')) {
                    fs.unlinkSync(parmFile);
                    future.return(result);
                } else {
                    if (opts.tsv) {

                        // Read the tsv results file, creating an array of strings,
                        // one string per row. Return the array to the client where
                        // the row format is known, and parse them there.
                        // TODO This seems abusive of Meteor and should be change
                        // to what is best for meteor. This is reading the file on
                        // the server, then passing the long array to the client.
                        data = readFromTsvFileSync(result);
                    } else {
             
                        // Read and parse the json file

                        data = readFromJsonFileSync(result);
                        data.result = result;
                    }
                    fs.unlinkSync(parmFile);
                    future.return(data);
                }
            }
        });
        return future.wait();
    },
});

