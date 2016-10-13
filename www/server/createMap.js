
// createMap.js
// Call the python layout code.

var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

create_map_http_parm_checker = function (data, res) {

    // Do some checks on the request content, returning false if not passing.
    
    // TODO no checks yet.
    /*
    if (!dataIn.hasOwnProperty('opts')) {
        future.return() instead
        respondToHttp(400, res,
            'Create Map function parameters missing or malformed');
        return false;
    }
    */
    
    // We passed all of the parameter checks so call the python function,
    // wrapping the http response so downstream callers will pass it along as
    // a future.
    callPython('layout', data, { http_response: res });
}

create_map = function (result, future) {
    
    // Process the results of the create map request where:
    // result: { code: <http-code>, data: <result-data> }
    
    if (result.code !== 200) {
        report_calc_result (result, future);
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
        report_calc_result(result, future);
    } else {
       
        // Send the log to the admin & throw an error.
        var subject = 'Error when creating a map';
        var msg = 'log file: ' + result.data;
        sendMail(ADMIN_EMAIL, subject, msg);
        
        report_calc_result ({
            code: 400,
            data: 'Calc script had an unknown error',
            }, future);
    }
};

Meteor.methods({

    create_map: function (opts) {

        // Process a create map request from the client.
        this.unblock();
        var future = new Future();
        callPython('layout', opts, future, false);
        return future.wait();
    },
});
