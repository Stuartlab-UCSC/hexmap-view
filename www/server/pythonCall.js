
// pythonCall.js
// Call python utilities from nodejs.

var exec = Npm.require('child_process').exec;
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var spawn = Npm.require('child_process').spawn;

function report_error (error_in, on, pythonCallName, callback) {
    var error = error_in.toString();
    console.log(
        'Error:', on, 'from python call:', pythonCallName + ':', error);
    callback({ code: 1, data: error });
}

callPythonLocal = function (pythonCallName, opts, callback) {

    // Generic asynchronous caller from server to python code.
    // Put the parameters in a file as json, then call the python routine. The
    // python routine returns either an error string or a filename containing
    // the results as json. The results are returned to the caller via the
    // supplied callback as a javascript object on success, or a string on
    // error.
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: callPython(' + pythonCallName + ')');
    
    // Parms to pass to python
    var parms = [
            SERVER_DIR + 'pythonCall.py',
            pythonCallName,
            writeToTempFile(JSON.stringify(opts)),
        ],
        call,
        result;
    
    // Make the python call via a subprocess.
    call = spawn('python', parms),

    call.on('error', function (error) {
        report_error(error, 'error', pythonCallName);
    });

    call.stderr.on('data', function (data) {
        report_error(data, 'stderr', pythonCallName);
    });

    call.stdout.on('data', function (stdout_in) {
        var stdout = stdout_in.toString();
        if (typeof stdout === 'string' &&
            (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning')) {
    
            // Return any errors/warnings printed by the python script
            report_error(stdout, 'stdout', pythonCallName);
        } else {

            // Success, so read and parse the results in the json file,
            // returning the data.
            var str = stdout.toString();
            var filename = str.replace('\n', '');
            var data = readFromJsonFileSync(filename);
            console.log('Info: success with callPython(' + pythonCallName + ')',
                'Results file:', filename);
            result = {
                code: 0,
                data: data,
                filename: filename,
            };
            callback(result);
        }
    });
    
    call.on('close', function (code) {
        if (code === 0) {
            console.log('Info: success with callPython(' + pythonCallName + ')',
                'Exited with:', code);
        } else {
            console.log('Error with callPython(' + pythonCallName + ')',
                'Exited with:', code);
        }
    });
    
    call.stdin.end();
};

callPython = function (pythonCallName, opts, callback) {

    // Call either the local or remote python script.
    if (CALC_URL) {
        console.log('we should call the remote calc server here');
        callPythonLocal(pythonCallName, opts, callback);
    } else {
        callPythonLocal(pythonCallName, opts, callback);
    }
};

var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

function return_error_to_client_async (msg, caller) {
    return future.wait();
}

Meteor.methods({

    callPython: function (pythonCallName, opts) {
    
        // Asynchronously call a python function from the client:
        // preferred method
        this.unblock();
        var future = new Future();
        
        if (valid_calls_from_client.indexOf(pythonCallName) > -1) {
        
            // This is a valid python call, so call it.
            callPython(pythonCallName, opts, function (result) {
                future.return(result);
            });
        } else {
        
            // This is not a valid python call, return an error.
            Meteor.setTimeout(function (msg) {
                future.return('Error: ' + pythonCallName +
                    ' is not a python function', this);
            }, 0);
        }
        return future.wait();
    },

    pythonCall: function (pythonCallName, opts) {
    
        // TODO deprecated, move statsDynamic & diffAnalysis to use callPython
        // Asynchronously call a python function from the client.
        
        // If this is not a valid python call, return an error
        if (valid_calls_from_client.indexOf(pythonCallName) < 0) {
            return 'Error: ' + pythonCallName + ' is not a python function';
        }
        
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
            'python ' +
            pythonDir +
            pythonCallName +
            ".py '" +
            parmFile +
            "'";

        exec(command, function (error, stdout) {
            if (error) {
                //console.log(error);
                console.trace();
                future.throw(error);
            } else {

                var data,
             
                    // remove last newline
                    result = stdout.toString().slice(0, -1);

                // Return any known errors/warnings to the client
                if (typeof result === 'string' &&
                    (result.slice(0,5).toLowerCase() === 'error' ||
                        result.slice(0,7).toLowerCase() === 'warning')) {
                    fs.unlinkSync(parmFile);
                    future.return(result);
                } else {
                    if (opts.tsv) {

                        // Read the tsv results file, creating an array of
                        // strings, one string per row. Return the array to the
                        // client where the row format is known, and parse them
                        // there.
                        // TODO This seems abusive of Meteor and should be
                        // change to what is best for meteor. This is reading
                        // the file on the server, then passing the long array
                        // to the client.
                        data = readFromTsvFileSync(result);
                    } else {
             
                        // Read and parse the json file

                        data = readFromJsonFileSync(result);
                        data.result = result;
                    }
                    //fs.unlinkSync(parmFile);
                    future.return(data);
                }
            }
        });
        return future.wait();
    },
});
