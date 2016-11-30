
// pythonCall.js
// Call python utilities from nodejs.

var Future = Npm.require('fibers/future');
var spawn = Npm.require('child_process').spawn;
var Http = require('./http');
var PythonCall = require('./pythonCall');

var JobsCode = require('./jobs');
var Fiber = Npm.require('fibers');

// Save job_contexts so we can use them after the job call
var job_contexts = {};

function make_parm_file (opts, in_json) {

    // Save parameters to a temporary file in json and return the file name as
    // json that looks like:
    //      {"parm_filename": "<filename>"}
    // in_json of true indicates the options are already in json format
    //
    // The filename is always passed as a json object of the form:
    //      '{ "parm_filename": "<parm-filename>" }'
    //
    // This format was settled on because:
    //    - http requests only in json simplifies the code
    //    - downstream server needs an identifier of 'parm_filename' so it knows
    //      what to do with the content
    //    - there are few accessing functions that need to dig inside the json
    //      object; only receive http & call_python_remote
    
    // convert the opts to json if need be
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

function call_post_calc(result, context) {

    // There is a post_calc function to run before returning to http or
    // the client, so call that after loading the data into javascript
    // from the file with the json results.
    context.js_result = load_data(result.data, context);
    
    // Remove the post_calc from the context so we don't call it again.
    var post_calc = context.post_calc;
    delete context.post_calc;
    
    post_calc(result, context);
}

function report_result (remote, result_in, context) {

    // Report an error or successful result to http or the client,
    // after running the post-calc function if there is one.
    var result = _.clone(result_in);
    if (context.post_calc) {
    
        call_post_calc(result, context)

    } else if (context.http_response) {

        // This is from an http request so respond to that
        var in_json = false;
        if (remote && result.statusCode === 200) {
        
            // Successful returns from a remote calc are already in json.
            in_json = true;
        }
        Http.respond (
            result.statusCode,
            context.http_response,
            result.data,
            in_json);

    } else if (context.future) {
    
        // This has a future, so return the result via the future
        if (result.statusCode === 200) {
        
            // Success with a results filename, so extract the data if the
            // the post_calc function did not do it already.
            if (context.js_result) {
                result.data = context.js_result;
            } else if (result_in) {
                result.data = load_data(result_in.data, context);
            }
            
            // Return the success to the future
            context.future.return(result);
            
        } else {
        
            // Throw the error to the future
            context.future.throw(result);
        }
        
    } else {

        console.log('Error: report_local_result() received a context without a',
            'future or http_response\ncontext:', context);
        console.trace();
    }
    
    // Call this job done.
    new Fiber(function () {
        context.job.done({});
    }).run();
};

exports.report_local_result = function (result_in, context) {
    report_result(false, result_in, context);
}

function get_fx (remote) {
    return remote ? 'call_python_remote' : 'call_python_local';
}

function report_error (
        remote, statusCode, error, via, pythonCallName, context) {
    
    var errorString = error.toString(),
        result = {
            statusCode: statusCode ? statusCode : 500,
            data: errorString,
        };
    
    console.log('Error:', statusCode, errorString,
        '\n    in:', get_fx(remote) + '(' + pythonCallName + ')',
        '\n    via:', via);
    
    report_result(remote, result, context);
}

function report_success (remote, result, pythonCallName, context) {

    console.log('Info: Success:', result.statusCode,
        result.data.slice(0, 50) + '...',
        '\n    in:', get_fx(remote) +'(' + pythonCallName + ')');
    
    report_result(remote, result, context);
}

function local_success (result_filename, pythonCallName, context) {

    // Remove any trailing new line char
    // The filename a string
    var filename = result_filename,
        index = result_filename.indexOf('\n');
    if (index > -1) {
        filename = result_filename.slice(0, index);
    }
    
    report_success(false, { statusCode: 200, data: filename },
            pythonCallName, context)
}

function remote_success (result, pythonCallName, context) {
    report_success(true, result, pythonCallName, context);
}

function execute_job (job, callback) {

    // Execute a job from the job queue.
    
    // Extract python parameters from the job
    var pythonCallName = job._doc.data.pythonCallName;
    var json = job._doc.data.json;
    var context = job_contexts[job._doc._id];
    context.job = job;
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: execute_job(' + pythonCallName + ')');
    
    // Parms to pass to python
    var spawn_parms = [
            SERVER_DIR + 'pythonCall.py',
            pythonCallName,
            json,
            TEMP_DIR,
        ];
    
    // Any errors not caught by the python code will throw an error and be
    // reported under the 'on error' routine.
    // Any errors that are caught by the python code will write to a list and
    // continue execution.
    var stderr = [];
    
    // Define a flag so that if nothing is returned other than the return code,
    // we will report the error via the http response or the future
    var reported = false;
    
    // Make the python call using a spawned process.
    var call = spawn('python', spawn_parms);

    call.on('error', function (error) {
        reported = true;
        report_error(
            false, undefined, error, '"error"', pythonCallName, context);
    });

    call.stderr.on('data', function (data) {
        // Save stderr messages and only report them if the close returns
        // a failure.
        stderr.push(data.toString());
    });

    call.stdout.on('data', function (stdout_in) {
        var stdout = stdout_in.toString();
        reported = true;
        if (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning') {
    
            // Return any errors/warnings printed by the python script
            report_error(
                false, undefined, stdout, '"stdout"', pythonCallName, context);
        } else {
            local_success(stdout, pythonCallName, context);
        }
    });
    
    call.on('close', function (code) {
        if (code === 0) {
            if (reported) {
                console.log('Info: success with call_python_local(' +
                    pythonCallName + ')', 'Exited with: 0');
            } else {
                console.log('Error: call_python_local(' + pythonCallName + ')',
                    'Exited with: 0, however nothing was previously reported',
                    'to the future or http');
            }
        } else {
            console.log('Error with call_python_local(' + pythonCallName + ')',
                'Exited with:', code, 'syserr below:');
        }
        
        // If we've not reported back to http or the future, there is some
        // uncaught error, so report whatever we have in syserr.
        if (!reported) {
            report_error(
                false, undefined, stderr, '"close"', pythonCallName, context);
        }
    });
    
    call.stdin.end();
}

function add_to_job_queue (pythonCallName, json, context) {

    // Create a job and add it to the job queue
    
    var job = new Job(jobQueue, 'calc', // type of job
    
        // Job data that you define, including anything the job
        // needs to complete. May contain links to files, etc...
        {
            pythonCallName: pythonCallName,
            json: json,
            context: context
        }
    );

    // Commit it to the server & save the local context for post-processing.
    
    console.log('json:', json);
    
    //new Fiber(function () {
        var rc = job.save();
        console.log('rc:', rc);
    //}).run();
    
    job_contexts[job._doc._id] = context;
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
    
    var id = 1;
    var f = new Fiber(function(id) { // jshint ignore: line
        context.in_json = true;
        
        // Use the meteor 'http' package to handle the http
        HTTP.post(CALC_URL + '/' + pythonCallName, options,
                function (error, result) {
            
            if (error) {
                var errorMsg = error.toString(),
                    statusCode;
                if (error.response && error.response.statusCode) {
                    statusCode = error.response.statusCode;
                    if (error.response.data) {
                        errorMsg = error.response.data;
                    }
                }
                report_error(true, statusCode, errorMsg, '"error"',
                    pythonCallName, context);
                
            } else if (result && result.statusCode === 200) {
            
                remote_success(result, pythonCallName, context);
                
            } else if (result && result.statusCode) {
                report_error(true, result.statusCode, result.toString(),
                    '"has statusCode"', pythonCallName, context);
                
            } else if (result) {
                report_error(true, undefined, result.toString(),
                    '"no statusCode"', pythonCallName, context);
        
            } else {
                report_error(true, undefined, '"no result"', '"no result"',
                    '"has statusCode"', pythonCallName, context);
            }
        });
    }).run(id);
}

exports.call = function (pythonCallName, opts, context) {

    // Call a python function where the caller passes the
    // python call name, call options, and a context.
    // On success or error, the results are received as:
    //  {
    //      statusCode: <http-status-code>, whether it called locally or remote
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
            parm_filename = opts;
        } else {
        
            parm_filename = make_parm_file(opts);
        }
        
        add_to_job_queue(pythonCallName, parm_filename, context);
    }
};

// These are the valid python calls from the client when using the generic
// pythonCall method below.
var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

exports.init = function () {

    // Set up the job queue processing
    jobQueue.processJobs('calc', {}, execute_job);
}

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
