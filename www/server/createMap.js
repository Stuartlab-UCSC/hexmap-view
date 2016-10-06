
// createMap.js
// Call the python layout code from the client.

var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

Meteor.methods({

    create_map: function (opts) {
    
    this.unblock();
    var future = new Future();
    callPython('layout', opts, function (result) {
        if (result.code === 1) {
            future.throw(result.data);
        } else {
        
            console.log('create_map: no error thrown');
            
            // Check the python layout log for success
            var log = fs.readFileSync(result.data, 'utf8');
            var log_array = log.split('\n');
            var success_msg = 'Visualization generation complete!';
            var success = _.find(log_array, function(line) {
                return line.indexOf(success_msg) > -1;
            });
            if (success) {
            
                console.log('create_map: success, log:', result.data);
               
                // Return the layout log file name.
                future.return(result.data);
            } else {
            
                console.log('create_map: error: unknown error');
               
                // Send the log to the admin & throw an error.
                var subject = 'Error when creating a map';
                var msg = 'log file: ' + result.data;
                sendMail(ADMIN_EMAIL, subject, msg);
                future.throw('Server had an unknown error.');
            }
        }
    });
    return future.wait();
    },
});
