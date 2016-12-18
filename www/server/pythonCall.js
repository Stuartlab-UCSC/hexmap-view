
// pythonCall.js
// Call python utilities from nodejs.

var Future = Npm.require('fibers/future');
var spawn = Npm.require('child_process').spawn;
var Fiber = Npm.require('fibers');
var Http = require('./http');
var PythonCall = require('./pythonCall');

var jobQueue;

// Save calc contexts so we can use them after the job call
var calcContexts = {};

function make_parm_file (opts) {

    // Save parameters to a temporary file in json and return the file name as
    // json that looks like:
    //      {"parm_filename": "<filename>"}
    //
    // This format was settled on because:
    //    - http requests only in json simplifies the code
    //    - downstream server needs an identifier of 'parm_filename' so it knows
    //      what to do with the content
    //    - there are few accessing functions that need to dig inside the json
    //      object; only receive http
    return JSON.stringify({
        parm_filename: writeToTempFile(JSON.stringify(opts))
    });
}

function load_data (filename, calcCtx) {

    // Convert the contents of this file from json or tsv to javascript.
    var data;
    if (calcCtx.tsv) {

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

function call_post_calc(result, calcCtx) {

    // There is a post_calc function to run before returning to http or
    // the client.
    
    if (result.statusCode !== 500) {
    
        // On success, load the data into javascript
        // from the file with the json results.
        calcCtx.js_result = load_data(result.data, calcCtx);
    }
    
    // Remove the post_calc from the calcCtx so we don't call it again.
    var post_calc = calcCtx.post_calc;
    delete calcCtx.post_calc;
    
    post_calc(result, calcCtx);
}

exports.report_calc_result = function (result_in, calcCtx) {

    // Report an error or successful result to http or the client,
    // after running the post-calc function if there is one.
    
    var result = _.clone(result_in);
    if (!result) {
        result = {
            statusCode: 500,
            data: 'Warning: job ' + calcCtx.jobId +
                    ' has no result, so created this one',
        };
    }
    
    var type = 'Info:';
    if (result.statusCode === 500) {
        type = 'Error:';
    }
    if (calcCtx.post_calc) {
    
        call_post_calc(result, calcCtx);

    } else if (calcCtx.http_response) {

        // This is from an http request so respond to that
        Http.respond (
            result.statusCode,
            calcCtx.http_response,
            result.data);

    } else if (calcCtx.future) {
    
        // This has a future, so return the result via the future
        if (result.statusCode === 200) {
        
            // Success with a results filename, so extract the data if the
            // the post_calc function did not do it already.
            if (calcCtx.js_result) {
                result.data = calcCtx.js_result;
            } else if (result_in) {
                result.data = load_data(result_in.data, calcCtx);
            }
            
            // Return the success to the future
            calcCtx.future.return(result);
            
        } else {
        
            // Throw the error to the future
            calcCtx.future.throw(new Meteor.Error(result.data));
        }
        
    } else {
        console.log('Error: job:', calcCtx.jobId +
            ', report_calc_result() received a context without a',
            'future or http_response, calcCtx:', calcCtx);
    }
};

function report_job_result (job) {
    
    // Main server retrieves the results from the job document and reports it.
    var result;
    if (job.status === 'cancelled') {
        result = {
            statusCode: 205,
            data: 'user cancelled job',
        };

    } else { // Status must be 'completed' or 'failed'.
        result = job.result;
        if (job.failures && job.failures.length > 0) {
            result = job.failures[0];
        }
    }
    PythonCall.report_calc_result(result, calcContexts[job._id]);
}

exports.status_changed = function (nu, old) {
    
    // When there is a change of job status to 'completed', 'failed'
    // or 'cancelled', report job results.
    if (old && old.status !== nu.status &&
            nu.status === 'completed' ||
            nu.status === 'failed' ||
            nu.status === 'cancelled' ) {
        report_job_result(nu);
    }
};

function report_error (statusCode, error, via, operation, jobCtx) {
    
    var errorString = error.toString(),
        result = {
            statusCode: statusCode ? statusCode : 500,
            data: errorString,
        };
    
    // Call this job failed.
    new Fiber(function () {
        jobCtx.job.fail(result, { "fatal": true });
        jobCtx.jobCallback();
    }).run();
}

function report_success (result_filename, operation, jobCtx) {

    // Remove any trailing new line char
    // The filename a string
    var filename = result_filename,
        index = result_filename.indexOf('\n');
    
    if (index > -1) {
        filename = result_filename.slice(0, index);
    }
    
    var result = { statusCode: 200, data: filename };
    
    // Call this job done.
    new Fiber(function () {
        jobCtx.job.done(result, {});
        jobCtx.jobCallback();

    }).run();
    console.log('Info: job:', jobCtx.jobId + ', Success:', result.statusCode,
        result.data);
}

function execute_job (job, callback) {

    // Execute a job from the job queue.
    
    // Extract python parameters from the job
    var operation = job._doc.data.operation;
    var json = job._doc.data.json;
    
    // Save some job information for later
    var jobCtx = {
        job: job,
        jobId: job._doc._id,
        jobCallback: callback,
    };
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    job.log('job: ' + job._doc._id + ' execute_job(' + operation + ')', { echo: true });
    
    // Parms to pass to python
    var spawn_parms = [
            SERVER_DIR + 'pythonCall.py',
            operation,
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
        report_error(undefined, error, '"error"', operation, jobCtx);
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
            report_error(undefined, stdout, '"stdout"', operation, jobCtx);
        } else {
            report_success(stdout, operation, jobCtx);
        }
    });
    
    call.on('close', function (code) {
        var msg = '';
        if (code === 0) {
            if (!reported) {
                msg = 'Exited with: 0, however nothing was previously ' +
                    'reported to the future or http\n';
            }
        } else {
            msg = 'Returned with code: ' + code + '\n';
        }
        
        // If we've not reported back to http or the future, there is some
        // uncaught error, so report whatever we have in syserr.
        if (!reported) {
            report_error(undefined, msg + stderr, 'close with return code of ' +
                code, operation, jobCtx);
        }
    });
    
    call.stdin.end();
}

function jobType () {
    return 'calc';
}

function add_to_queue (operation, json, calcCtx) {

    // Create a job and add it to the job queue
    var operationLabels = {
            'layout': 'create_map',
            'overlayNodes': 'N_of_1',
            'statsDynamic': 'dynamic_stats',
        },
        label = operationLabels[operation],
        job = new Job(jobQueue, jobType(), // type of job
    
            // Job data that you define, including anything the job
            // needs to complete. May contain links to files, etc...
            {
                userId: Meteor.userId(),
                operation: operation,
                operationLabel: label ? label : operation,
                json: json,
            }
        );
    
    // Commit it to the server & save the local calcCtx for post-processing.
    new Fiber(function () {
        calcCtx.jobId = job.save();
        job.log('job: ' + calcCtx.jobId + ' add_to_queue(' + operation + ')', { echo: true });
        calcContexts[calcCtx.jobId] = calcCtx;
    }).run();
}

exports.call = function (operation, opts, calcCtx) {

    // Call a python function where the caller passes the
    // python call name, call options, and a calc context.
    // On success or error, the results are received as:
    //  {
    //      statusCode: <http-status-code>
    //      data: <data>,
    //  }
    
    // If the caller wants the results in tsv, save that in the calc context
    if (opts.hasOwnProperty('tsv')) {
        calcCtx.tsv = true;
    }

    // Call the local python calc after converting the data to json,
    // storing in a file, then jsonizing that filename
    var parm_filename;
    if (opts.parm_filename) {
    
        // This is coming from http so parm_filename is already in json
        parm_filename = opts;
    } else {
    
        parm_filename = make_parm_file(opts);
    }
    
    add_to_queue(operation, parm_filename, calcCtx);
};

// These are the valid python calls from the client when using the generic
// pythonCall method below.
var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

Meteor.methods({

    pythonCall: function (operation, opts) {

        // Asynchronously call a python function with this routine
        // handling the fiber/future.
        this.unblock();
        var future = new Future();
        
        if (valid_calls_from_client.indexOf(operation) > -1) {
            
            // Create a temp file for the results if the client wants us to
            if (opts.hasOwnProperty('tempFile')) {
                opts.tempFile = writeToTempFile('junk');
            }
        
            // This is a valid python call, so call it.
            PythonCall.call(operation, opts, { future: future });
        } else {
        
            // This is not a valid python call, return an error.
            Meteor.setTimeout(function () {
                future.return('Error: ' + operation +
                    ' is not a python function');
            }, 0);
        }
        return future.wait();
    },
});

Meteor.startup(function () {

    // Define and start up the job queue.
    
    if (IS_MAIN_SERVER) {
    
        // Define the job queue on the main server
        jobQueue = new JobCollection('jobQueue');
        
        // Define permissions
        jobQueue.allow({

            // Grant full permission to any authenticated user
            admin: function (userId, method, params) { // jshint ignore: line
                if (userId && Roles.userIsInRole(userId, ['jobs', 'dev'])) {
                    return true;
                }
                return false;
            },
        });

        // Publish this collection
        Meteor.publish('myJobs', function (userId) {
            if (this.userId === userId) {
                var cursor = jobQueue.find({ type: jobType(),
                    'data.userId': userId });
                return cursor;
            } else {
                return [];
            }
        });
     
    } else if (IS_CALC_SERVER) {
    
        // Define the job queue for remote access
        // This server is a calc server, but not the main server hosting
        // the database, so set up remote access to the database.
        var mongo_url = MAIN_MONGO_URL;
        var database = new MongoInternals.RemoteCollectionDriver(mongo_url);
        jobQueue = new JobCollection('jobQueue', { _driver: database });
     
    } else {
    
        // This will never work; a server must be 'main', 'calc' or both.
        console.log('Error: this server is not defined as a main server',
            'or a calc server.');
        return;
    }
    
    // DEBUG
    //jobQueue.setLogStream(process.stdout);
            
    // Set a very long time to poll for delayed jobs that are ready to run.
    // This shouldn't be needed but polling still happens with pollInterval
    // set to false.
    jobQueue.promote(1000000000);

    // Start the job server.
    jobQueue.startJobServer();

    // Define the queue.
    var q = jobQueue.processJobs(jobType(), {
            pollInterval: false, // Don't poll
        }, execute_job);

    if (IS_CALC_SERVER) {
        
        // For any documents of type 'calc',
        // when a document is added, tell the queue to seek new work.
        jobQueue
            .find({ type: jobType()})
            .observe({ added: function () { q.trigger(); } });
    }
    if (IS_MAIN_SERVER) {

        // For any documents of type 'calc', when a document is changed...
        jobQueue
            .find({ type: jobType()})
            .observe({ changed: PythonCall.status_changed });
        }
});
