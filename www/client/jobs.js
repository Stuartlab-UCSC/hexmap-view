// jobs.js
// This creates a job control dialog based on the meteor package:
//      vsivsi:job-collection
// Makes status on jobs visible and allows status changes by user. Jobs are
// created elsewhere.

var app = app || {};

(function (hex) { // jshint ignore: line
Jobs = (function () { // jshint ignore: line

    var title = 'Jobs',
        dialogHex, // instance of the class DialogHex
        $dialog; // our dialog DOM element
        log = new ReactiveVar(),
        calculation = new ReactiveVar(),
        jobQueue = JobCollection('jobQueue'),


        /*
        feature_upload, // the feature file selector
        attribute_upload, // the feature file selector
        our_feature_file_name,
        our_attribute_file_name,
        user_project,
        feature_space_dir,
        view_dir,
        safe_username,
        */
 
    Template.jobT.helpers({
        calculation: function () {
            return calculation.get();
        },
        log: function () {
            Meteor.setTimeout(function () {
                var $log = $('#jobDialog .log');
                if ($log && $log[0]) {
                    $log.scrollTop($log[0].scrollHeight);
                }
            }, 0); // Let the log message display before we adjust scrolling
            return log.get();
        },
        /*
        dynamic: function () {
            return !(Session.get('job_stats_precompute'));
        },
        precompute: function () {
            return Session.get('create_map_stats_precompute');
        },
        */
    });
 
    function report_error (msg) {
        Util.banner('error', msg);
        var date = new Date().toString(),
            i = date.indexOf('GMT');
        date = date.slice(0, i);
        feature_upload.log_it(msg + '\nPlease let hexmap@ucsc.edu know you ' +
            'had a calculation problem on ' + date);
    }

    function report_info (msg) {
        Util.banner('info', msg);
        feature_upload.log_it(msg);
    }
 
    function job_now () {
        /*
        // Because of the server settings, the code below will
        // only work if the client is authenticated.
        // On the server, all of it would run unconditionally.

        // Create a job:
        var job = new Job(jobQueue, 'calc', // type of job
        
            // Job data that you define, including anything the job
            // needs to complete. May contain links to files, etc...
            {
                address: 'bozo@clowns.com',
                subject: 'Critical rainbow hair shortage',
                message: 'LOL; JK, KThxBye.'
            }
        ).save();                // Commit it to the server;

        // Now that it's saved, this job will appear as a document
        // in the jobQueue Collection, and will reactively update as
        // its status changes, etc.
        */
        
        // Any job document from jobQueue can be turned into a Job object
        try {
            job = new Job(jobQueue, jobQueue.findOne({}));
            console.log('job_now() job:', job);
        } catch (error) {
            console.log('job_now() no jobs found');
        }
        

        /*
        // Or a job can be fetched from the server by _id
        jobQueue.getJob(_id, function (err, job) {
        
            // If successful, job is a Job object corresponding to _id
            // With a job object, you can remotely control the
            // job's status (subject to server allow/deny rules)
            // Here are some examples:
            job.pause();
            job.cancel();
            job.remove();
            // etc...
        });
        */
    }


        
/*
        var msg = 'Uploads complete. Generating layout...';
 
        Util.banner('info', msg);
        feature_upload.log_it(msg);

        var opts = [
            '--names', 'layout',
            '--directory', view_dir,
            '--role', safe_username,
            '--include-singletons',
            '--no-density-stats',
            '--no-layout-independent-stats',
            '--no-layout-aware-stats',
        ];
        if (true) { // TODO (feature_format === 'coordinates') {
            opts.push('--coordinates');
            opts.push(our_feature_file_name);
        }
        if (attribute_upload.file) {
            opts.push('--scores');
            opts.push(our_attribute_file_name);
        }
    }
*/
    
    function cancel_clicked () {
        hide();
        /*
        // Upload the user's feature file
        feature_upload.upload_now(feature_upload, function () {
            var msg = feature_upload.user_file_name + ' has been uploaded.';
            Util.banner('info', msg);
            upload_attributes();
        });
        */
        
	}

    function show () {
 
        // Show the contents of the dialog, once per trigger click
        job_now();
        //dialogHex.show();

        // Define the file selector for features file
        //Session.set('create_map_feature_file', feature_upload.file);
    }

    function hide() {

        // TODO
        //methodList.destroy();
        //methodList = undefined;
        dialogHex.hide();
    }
    
    return { // Public methods
        init: function () {
     
            $dialog = $('#jobDialog');
            var $button = $('#navBar .job');
     
            // Define the dialog options & create an instance of DialogHex
            var opts = {
                title: title,
                buttons: [{ text: 'Cancel', click: cancel_clicked }],
            };
            dialogHex = createDialogHex(undefined, undefined, $dialog, opts, show,
                hide, 'help/job.html');
        
            // Log to the console any DDP method calls from JobCollection
            jobQueue.logConsole = true;
     
            // Listen for the menu clicked
            Tool.add("jobs", function() {
                dialogHex.show();
            }, 'Job Status');
        },
    };
}());
})(app);
