
// pythonCall.js
// Call python utilities from nodejs.

var exec = Npm.require('child_process').exec;
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var spawn = Npm.require('child_process').spawn;


// A lookup table indexed by python call name which references a callback.
var callbacks = {
    'layout': create_map,
};

report_calc_result = function (result, future) {

    // Report an error or successful result to http or the client.
    if (future.http_response) {
    
        // This 'future' is really an http response, so save the results
        // to a json file and return the json file.
        var json_data = JSON.stringify(result.data);
        var json_file = writeToTempFile(json_data);
        respondToHttp (result.code, future.http_response, json_file);
        
    // Otherwise handle the future return
    } else if (result.code === 200) {
        future.return(result);
    } else {
        future.throw(result);
    }
}
function callback_error (error, pythonCallName, future) {

    // Add an http code and call the callback.
    var data = error.toString(),
        result = {
        code: 500,
        data: data
    };
    
    console.log('Error: pythonCall(' + pythonCallName + ')', data);

    callbacks[pythonCallName] (result, future);
}

function callback_success (filename, pythonCallName, future) {

    // Add an http code, get the data from the file then call the callback.
    var result = { code: 200 },
        json_results_file = filename.toString().replace('\n', '');
    
    result.data = readFromJsonFileSync(json_results_file);
    
    console.log('Info: pythonCall(' + pythonCallName + ')',
        'Results file:', json_results_file);

    callbacks[pythonCallName] (result, future);
}

call_python_local = function (pythonCallName, opts_filename, future) {

    // Generic asynchronous caller from server to python code.
    // Put the parameters in a file as json, then call the python routine. The
    // python routine returns either an error string or a filename containing
    // the results as json. The results are returned to the caller via the
    // supplied callback as a javascript object on success, or a string on
    // error.
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_local(' + pythonCallName + ')');
    
    var call,
        result,
    
        // Parms to pass to python
        spawn_parms = [
            SERVER_DIR + 'pythonCall.py',
            pythonCallName,
            opts_filename,
            TEMP_DIR,
        ];
    
    // Make the python call with a spawned process.
    call = spawn('python', spawn_parms);

    call.on('error', function (error) {
        callback_error(error, pythonCallName, future);
    });

    call.stderr.on('data', function (data) {
        callback_error(data, pythonCallName, future);
    });

    call.stdout.on('data', function (stdout_in) {
    
        var stdout = stdout_in.toString();
        if (typeof stdout === 'string' &&
            (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning')) {
    
            // Return any errors/warnings printed by the python script
            callback_error(stdout, pythonCallName, future);
        } else {
            callback_success(stdout, pythonCallName, future);
        }
    });
    
    call.on('close', function (code) {
        if (code === 0) {
            console.log('Info: success with call_python_local(' +
                pythonCallName + ')',
                'Exited with:', code);
        } else {
            console.log('Error with call_python_local(' + pythonCallName + ')',
                'Exited with:', code);
        }
    });
    
    call.stdin.end();
};

function call_python_remote (pythonCallName, opts_filename, future) {

    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_remote(' + pythonCallName + ')');
    
    // Define HTTP request options
    var options = {
        headers: {
            'content-type': 'application/json',
        },
        data: opts_filename,
    };

    HTTP.post(CALC_URL + '/' + pythonCallName, options,
            function (error, result) {
        
        if (error) {
            console.log('Error: call_python_remote(' + pythonCallName + '):',
                error.toString());
            callback_error(error, pythonCallName, future);
            
        } else {
            console.log('Info: success with call_python_remote(' +
                pythonCallName + ')', 'Results file:', result.data);
              
            // Should this parse the json in result.content instead of returning
            // result.data?
            callback_success(result.data, pythonCallName, future);
        }
    });
}
// overlayNodes & mapManager want:
// callPython = function (pythonCallName, opts, callback) {

callPython = function (pythonCallName, opts, future) {

    // Call a python function where the caller passes the
    // python call name, call options, and a future.
    // On success, future.return() is called with:
    //  {
    //      code: <http-status-code>, (whether it called locally or remotely)
    //      data: <data>,
    //  }
    // On error, future.thrown() is called with the above code & data structure.

    // Convert the python parameters to json and save that json in a file.
    var json_opts = JSON.stringify(opts);
    var opts_filename = writeToTempFile(json_opts);

    // Call either the local or remote python script.
    if (CALC_URL) {
    
        // Execute this remotely. The opts are already converted to json and
        // saved to a file, so just pass the filename contained in the opts.
        call_python_remote(pythonCallName, opts_filename, future);

    } else {
        
        // Execute this locally,
        // so convert the options into json and save it to a file
        call_python_local(pythonCallName, opts_filename, future);
    }
};

var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

/* TODO unused
function call_python (pythonCallName, opts) {

    // Asynchronously call a python function with this routine
    // handling the fiber/future.
    this.unblock();
    var future = new Future();
    
    if (valid_calls_from_client.indexOf(pythonCallName) > -1) {


        console.log('call_python(): future:', future);
        
        // This is a valid python call, so call it.
        callPython(pythonCallName, opts, undefined, future);
    } else {
    
        // This is not a valid python call, return an error.
        Meteor.setTimeout(function () {
            future.return('Error: ' + pythonCallName +
                ' is not a python function', this);
        }, 0);
    }
    return future.wait();
}
*/

Meteor.methods({

/* TODO unused, but should be used by statsDynamic & diffAnalysis
    callPython: function (pythonCallName, opts) {

        // Asynchronously call a python function from the client.
        return call_python(pythonCallName, opts);
    },
*/
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
