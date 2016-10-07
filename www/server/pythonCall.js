
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
    // supplied callback as a javascript object on success, or a string on
    // error.
    
    // Write the opts to a file as json for reading by the python code.
    var json = JSON.stringify(opts);
    var parmFile = writeToTempFile(json);
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: callPython(' + pythonCallName, ')');

    
    var command =
        "python " +
        SERVER_DIR +
        "pythonCall.py '" +
        pythonCallName +
        "' '" +
        parmFile +
        "'";

    var result;
    
    var report_error = function (error, pythonCallName) {
        console.log('Error: from python call:', pythonCallName + ':', error);
        return {code: 1, data: error};
    };
    
    // TODO: replace 'exec' with something more standard
    exec(command, function (error, stdout, stderr) {
    
        if (error) {
            result = report_error(error, pythonCallName);
        
        } else if (stderr) {
            result = report_error(stderr.toString(), pythonCallName);
        
        } else if (typeof stdout === 'string' &&
            (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning')) {
        
            // Return any errors/warnings captured by the python script
            result = report_error(stdout, pythonCallName);
         
        } else {
        
            // Success, so read and parse the results in the json file,
            // returning the data
            var str = stdout.toString();
            var filename = str.replace('\n', '');
            var data = readFromJsonFileSync(filename);
            console.log('Info: success with callPython(' + pythonCallName,
                '), Results file:', filename);
            result = {
                code: 0,
                data: data,
                filename: filename,
            };
        }
        callback(result);
    });
};


function callPythonAsync (pythonCallName, opts, caller) {

    // Asynchronously call a python function: preferred method
    // when calling asynchronously from server.
    caller.unblock();
    var future = new Future();
    callPython(pythonCallName, opts, function (result) {
        future.return(result);
    });
    return future.wait();
}

var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

function return_error_to_client_async (msg, caller) {
    caller.unblock();
    var future = new Future();
    Meteor.setTimeout(function (msg) {
        future.return(msg);
    }, 0);
    return future.wait();
}

Meteor.methods({

    callPython: function (pythonCallName, opts) {
    
        // Asynchronously call a python function from the client:
        // preferred method
        if (valid_calls_from_client.indexOf(pythonCallName) > -1) {
            return callPythonAsync(pythonCallName, opts, this);
        } else {
        
            // This is not a valid python call, return an error
            return_error_to_client_async (
                'Error: ' + pythonCallName + ' is not a python function', this);
        }
    },

    pythonCall: function (pythonCallName, opts) {
    
        // TODO deprecated, move statsDynamic & diffAnalysis to use callPython
        // Asynchronously call a python function from the client: deprecated
        
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
