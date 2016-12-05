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
        logDisplay = new ReactiveDict(),
        log = new ReactiveDict(),
        jobQueue = JobCollection('jobQueue'),
        jobSubscription = null;
 
    Template.jobT.helpers({
        jobs: function () {
            return jobQueue.find({});
        },
        cButtontext: function () {
            if (jobQueue.jobStatusRemovable.indexOf(this.status) > -1) {
                return 'Clear';
            } else {
                return 'Cancel';
            }
        },
        logDisplay: function () {
            //return this.showLog ? 'default' : 'none';
            return 'default';
        },
        log: function () {
            var lines = '';
            _.each(log, function (l) {
                console.log('l:', l);
                console.log('l.time', l.time);
                lines += '\n' + l.time + ' ' + l.level + ' ' + l.message;
            });
            return lines;
        },
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
    
    function cancel_clicked () {
        hide();
	}

    function show () {
 
        // Show the contents of the dialog, once per trigger click
        
        // Retrieve all job IDs for this user
        jobSubscription = Meteor.subscribe("allJobs");
    }

    function hide() {

        // Free any memory we can before destroying the dialog
        jobSubscription.stop();
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
                position: { my: "center top", at: "center-300 top+150",
                    of: window },
                maxHeight: $(window).height() - 150,
            };
            dialogHex = createDialogHex(undefined, undefined, $dialog, opts,
                show, hide, 'help/job.html');
        
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
