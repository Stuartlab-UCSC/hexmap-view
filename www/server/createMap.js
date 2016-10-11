
// createMap.js
// Call the python layout code.

var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

function pass_parameter_checks (dataIn, res) {

    // Do some checks on the request content, returning false if not passing.
    
    // TODO no checks yet.
    /*
    if (!dataIn.hasOwnProperty('opts')) {
        respondToHttp(400, res,
            'Create Map function parameters missing or malformed');
        return false;
    }
    */
    return true;
}

create_map = function (opts, res, future) {
    
    // Process the data in the create map request where:
    // opts: request data as a javascript object
    // res: the http response object if from http request, or undefined
    // future: the future object if called from client, or undefined
    
    callPython('layout', opts, res, future, function (result) {
    
        if (result.code !== 0) {
            respondToHttp(500, res, result, future);
            return;
        }
        
        // Check the python layout log for success
        var log = fs.readFileSync(result.data, 'utf8');
        var log_array = log.split('\n');
        var success_msg = 'Visualization generation complete!';
        var success = _.find(log_array, function(line) {
            return line.indexOf(success_msg) > -1;
        });
        if (success) {

            // Return the layout log file name
            respondToHttp(200, res, result.data, future);
        } else {
           
            // Send the log to the admin & throw an error.
            var subject = 'Error when creating a map';
            var msg = 'log file: ' + result.data;
            sendMail(ADMIN_EMAIL, subject, msg);
            
            //
            respondToHttp(400, res, 'Calc script had an unknown error', future);
        }
    });
};

create_map_http_request = function (dataIn, res) {

    // Process a create map request via http.
    // Let the parameter checker send the http response on invalid data.
    if (!pass_parameter_checks(dataIn, res)) { return; }
    
    create_map(dataIn, res);
};

Meteor.methods({

    create_map: function (opts) {

        // Process a create map request from the client.
        this.unblock();
        var future = new Future();
        create_map(opts, undefined, future);
        return future.wait();
    },
});
