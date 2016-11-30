
// jobs.js
// This handles job control based on the meteor package:
//      vsivsi:job-collection
/*
IS_CALC_SERVER
CALC_URL
*/

var PythonCall = require('./pythonCall');

jobQueue = JobCollection('jobQueue');

Meteor.startup(function () {
    //if (CALC_URL) {
    
        // This uses another server for calculations,
        // so define a job queue in the database
    
        // job-collection debug
        jobQueue.setLogStream(process.stdout);

        jobQueue.allow({

            // Grant full permission to any authenticated user
            // TODO check for role of 'job'
            admin: function (userId, method, params) {
                return (userId ? true : false);
            }
        });

        // Normal Meteor publish call, the server always
        // controls what each client can see
        Meteor.publish('allJobs', function () {
            return jobQueue.find({});
        });

        // Start the job queue.
        jobQueue.startJobServer();
        
        // Initialize
        PythonCall.init();
        
    //}
});







/*
// This is the worker or calculation server
if (IS_CALC_SERVER) {
    var someCallback = function (something) {
        console.log('in job callback');
    }

    console.log('defining queue');
    
    var queue = jobQueue.processJobs('sendMail', {},
        function (job, callback) {
        
            // This will only be called if a 'sendMail' job is obtained
        
            console.log('in job worker');
            
            job.done();
            callback();
            
            sendMail(email.address, email.subject, email.message,
                function(err) {
                    if (err) {
                        job.log("Sending failed with error" + err,
                            {level: 'warning'});
                        job.fail("" + err);
                    } else {
                        job.done();
                    }
                    // Be sure to invoke the callback
                    // when work on this job has finished
                    callback();
                }
            );
            
        }
    );
}
*/
