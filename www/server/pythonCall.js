
// pythonCall.js
// Call python utilities from nodejs.

var Future = Npm.require('fibers/future');
var spawn = Npm.require('child_process').spawn;
var Http = require('./http');
var PythonCall = require('./pythonCall');

function make_parm_file (opts, in_json) {

    // Save parameters to a file in json and return the file name as json that
    // looks like this: {"parm_filename": "<filename>"}
    // in_json of true indicates the options are already in json format
    var json_opts = in_json ? opts : JSON.stringify(opts);
    
    return JSON.stringify({
        parm_filename: writeToTempFile(json_opts)
    });
}

function load_data (filename, context) {

    // Convert the contents of this file from json or tsv to javascript.
    var data;
    if (context.tsv) {

        // Read the tsv results file, creating an array of
        // strings, one string per row. Return the array to the
        // client where the row format is known, and parse them
        // there.
        data = readFromTsvFileSync(filename);
        
    } else {

        // Read and parse the json file
        data = readFromJsonFileSync(filename);
    }
    return data;
}

exports.report_local_result = function (result, context) {

    // Report an error or successful result to http or the client.
    
    if (context.post_calc) {

        // There is a post_calc function to run before returning to http or
        // the client, so call that after loading the data into javascript
        // from the file with the json results.
        context.js_result = load_data(result.data, context);
        
        // Remove the post_calc from the context so we don't call it again.
        var post_calc = context.post_calc;
        delete context.post_calc;
        
        post_calc(result, context);
    
    } else if (context.http_response) {

        // This is from an http request so respond to that
        Http.respond (result.code, context.http_response, result.data);

    } else if (context.future) {
    
        // This has a future, so return the result via the future
        if (result.code === 200) {
        
            // Success with a results filename, so extract the data if the
            // the post_calc function did not do it already.
            if (!context.js_result) {
                result.data = load_data(result.data, context);
            }
            context.future.return(result);
            
        } else {
        
            // An error as a string.
            context.future.throw(result);
        }
        
    } else {

        console.log('Error: report_local_result() received a context without a',
            'future or http_response\ncontext:', context);
        console.trace();
    }
};

function local_error (error, pythonCallName, context) {

    var result = { code: 500, data: error.toString() };
    console.log('Error: pythonCall(' + pythonCallName + ')', result.data);
    PythonCall.report_local_result(result, context);
}

function local_success (result_filename, pythonCallName, context) {

    // Remove any trailing new line char
    var filename = result_filename,
        index = result_filename.indexOf('\n');
    if (index > -1) {
        filename = result_filename.slice(0, index);
    }
    var result = { code: 200, data: filename };
    console.log('Info: pythonCall(' + pythonCallName + ') success.',
            'Results file:', result.data);
    PythonCall.report_local_result(result, context);
}

function call_python_local (pythonCallName, json, context) {

    // Generic asynchronous caller from server to python code.
    // Put the parameters in a file as json, then call the python routine. The
    // python routine returns either an error string or a filename containing
    // the results as json. The results are returned to the caller via the
    // supplied post_calc function as a javascript object on success, or a
    // string on error.
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_local(' + pythonCallName + ')');
    
    // Parms to pass to python
    var spawn_parms = [
            SERVER_DIR + 'pythonCall.py',
            pythonCallName,
            json,
            TEMP_DIR,
        ];
    
    // Make the python call using a spawned process.
    var call = spawn('python', spawn_parms);

    call.on('error', function (error) {
        local_error(error, pythonCallName, context);
    });

    call.stderr.on('data', function (data) {
        local_error(data, pythonCallName, context);
    });

    call.stdout.on('data', function (stdout_in) {
        var stdout = stdout_in.toString();
        if (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning') {
    
            // Return any errors/warnings printed by the python script
            local_error(stdout, pythonCallName, context);
        } else {
            local_success(stdout, pythonCallName, context);
        }
    });
    
    call.on('close', function (code) {
        if (code === 0) {
            console.log('Info: success with call_python_local(' +
                pythonCallName + ')', 'Exited with:', code);
        } else {
            console.log('Error with call_python_local(' + pythonCallName + ')',
                'Exited with:', code);
        }
    });
    
    call.stdin.end();
}

function report_remote_result (result, context) {

    if (context.http_response) {
    
        // Send the results back to the local server
        Http.respond(
            result.statusCode,
            context.http_response,
            result.content,
            true);
        
    } else if (context.future) {
        if (result.statusCode === 200) {
        
            // Success so return the data as a javascript object
            var filename = JSON.parse(result.content);
            var data = load_data(filename, context);
            context.future.return({
                code: result.statusCode,
                data: data
            });
        } else {
        
            // Error so throw the error as javascript
            context.future.throw({
                code: result.statusCode,
                data: JSON.parse(result.content)
            });
        }
    }
}

function call_python_remote (pythonCallName, json, context) {

    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_remote calling:',
        CALC_URL + '/' + pythonCallName);
    
    // Define HTTP request options
    var options = {
        headers: {
            'content-type': 'application/json',
        },
        content: json,
    };
    
    var Fiber = Npm.require('fibers');
    var id = 1;
    var f = new Fiber(function(id) { // jshint ignore: line
        context.in_json = true;
        HTTP.post(CALC_URL + '/' + pythonCallName, options,
                function (error, result) {
            
            if (error) {
                console.log('Error: call_python_remote(' + pythonCallName +
                    '):', result.statusCode, result.content.slice(0, 50));
            } else {
                console.log('Info: call_python_remote(' + pythonCallName + ')',
                    'Code, Results file:', result.statusCode, result.content.slice(0, 50));
            }
            report_remote_result(result, context);
        });
    }).run(id);
}

exports.call = function (pythonCallName, opts, context) {

    // Call a python function where the caller passes the
    // python call name, call options, and a context.
    // On success or error, the results are received as:
    //  {
    //      code: <http-status-code>, (whether it called locally or remotely)
    //      data: <data>,
    //  }

    var json;
    
    // If the caller wants the results in tsv, save that in the context
    if (opts.hasOwnProperty('tsv')) {
        context.tsv = true;
    }

    // Call either the local or remote python script.
    if (CALC_URL) {
    
        // Execute this remotely.
        if (opts.parm_filename) {
            
            // The opts is a parameter file name in json, so is fine as is
            // and looks like this: {"parm_filename": "<filename>"}
            json = opts;
        } else {
        
            // The opts are parameters in json, so save them to a file
            // and transform the filename to json.
            if (context.future) {
                json = make_parm_file(opts);
            } else {
                json = make_parm_file(opts, true);
            }
        }
        
        // Call the remote calc server
        call_python_remote(pythonCallName, json, context);

    } else {
        
        // Call the local python calc after converting the data to json,
        // storing in a file, then jsonizing that filename
        var parm_filename;
        if (opts.parm_filename) {
        
            // This is coming from http so parm_filename is already in json
            json = opts;
        } else {
        
            parm_filename = make_parm_file(opts);
        }
        
        call_python_local(pythonCallName, parm_filename, context);
    }
};

var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

Meteor.methods({

    pythonCall: function (pythonCallName, opts) {

        // Asynchronously call a python function with this routine
        // handling the fiber/future.
        this.unblock();
        var future = new Future();
        
        if (valid_calls_from_client.indexOf(pythonCallName) > -1) {
            
            // Create a temp file for the results if the client wants us to
            if (opts.hasOwnProperty('tempFile')) {
                opts.tempFile = writeToTempFile('junk');
            }
        
            // This is a valid python call, so call it.
            PythonCall.call(pythonCallName, opts, { future: future });
        } else {
        
            // This is not a valid python call, return an error.
            Meteor.setTimeout(function () {
                future.return('Error: ' + pythonCallName +
                    ' is not a python function');
            }, 0);
        }
        return future.wait();
    },
});
