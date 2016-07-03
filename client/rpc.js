// rpc.js
// Remote procedure calls / web workers.

/* global $, banner, print, Worker */

var app = app || {}; // jshint ignore:line

// The only public method
initRpc = null; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var self;

    function Rpc() {

        var s = this;

        self = this;

        s.worker_filename = 'statistics.js';

        // How many statistics Web Workers should we start?
        s.NUM_RPC_WORKERS = 1; // TODO testing
        //s.NUM_RPC_WORKERS = 10;

        // This is a pool of statistics Web Workers.
        s.workers;

        // This holds which RPC worker we ought to give work to next.
        // TODO: Better scheduling, and wrap all this into an RPC object.
        s.next_free_worker;

        // This holds how namy RPC jobs are currently running
        s.jobs_running;

        // This keeps track of how many RPC jobs are in the current batch.
        s.jobs_in_batch;

        // This is the object of pending callbacks by RPC id
        s.callbacks;

        // This is the object of progress callbacks by RPC id
        s.progress_callbacks;

        // This is the next unallocated RPC/batch id
        s.next_id;

        // This is the first RPC ID in the current batch. Only one RPC batch is supposed
        // to be running at a time. Any replies from RPC callbacks with IDs smaller than
        // this should be ignored, as those results are no longer wanted.
        s.batch_start;
    }

    Rpc.prototype.initialize = function () {
        // Set up the RPC system. Must be called before 'call' is used.
        console.log('rpc.initialize');

        var s = this,
            i,
            worker;

        // Throw away the dead workers
        s.workers = [];

        // Start at the beginning of the worker list.
        s.next_free_worker = 0;

        // Say no jobs are running, since we killed them all.
        s.jobs_running = 0;

        // We're starting a new batch, so set the number of jobs in the batch
        s.jobs_in_batch = 0;

        // Clear all the callbacks
        s.callbacks = {};
        s.progress_callbacks = {};

        s.next_id = 0;

        s.batch_start = 0

        for (i = 0; i < s.NUM_RPC_WORKERS; i += 1) {
            // Start the statistics RPC (remote procedure call) Web Worker
            worker = new Worker(s.worker_filename);

            // Send all its messages to our reply processor
            worker.onmessage = s._worker_reply;

            // Send its error events to our error processor
            worker.onerror = s._worker_error;

            // Add it to the list of workers
            s.workers.push(worker);
        }
        return s;
    };

    Rpc.prototype.new_batch = function () {
        // Should be called before you launch a logical set (or "batch") of RPC
        // jobs. Prepares the UI to reflect the progress on the next batch of RPC
        // jobs.
        console.log('rpc.new_batch');

        var s = this,
            i;

        // First, say that if anybody from the old batch replies to us, we don't
        // want to know it. We only care about results from jobs launched after now.
        s.batch_start = s.next_id;

        if (s.jobs_running > 0) {
            // If any jobs are still running from the last batch, we need to kill
            // and re-make all the workers, in order to stop them, so we don't waste
            // time computing the last batch.

            for (i = 0; i < s.workers.length; i += 1) {
                // Kill each worker
                s.workers[i].terminate();
            }
        }

        // Reset variables
        s.initialize();
    };

    Rpc.prototype.call = function (function_name, function_args, callback, progress_callback) {
        // Given a function name and an array of arguments, send a message to a Web
        // Worker thread to ask it to run the given job. When it responds with the
        // return value, pass it to the given callback. If it responds with any
        // intermediate results, pass them to the progress callback.

        console.log('rpc.call function_name:', function_name);
        console.log('function_args:', function_args);
        console.log('callback:', callback);
        console.log('progress_callback:', progress_callback);

        // Allocate a new call id
        var s = this,
            id = s.next_id;
        s.next_id += 1;

        // Store the callback
        s.callbacks[id] = callback;

        // We got a progress callback. Use that.
        s.progress_callbacks[id] = progress_callback;

        // Launch the call. Pass the function name, function args, and id to send
        // back with the return value.
        s.workers[s.next_free_worker].postMessage({
            name: function_name,
            args: function_args,
            id: id
        });

        // Next time, use the next worker on the list, wrapping if we run out.
        // This ensures no one worker gets all the work.
        s.next_free_worker = (s.next_free_worker + 1) % s.workers.length;

        // Update the UI with the number of jobs in flight. Later, decrement
        // jobs_running so the callback knows if everything is done or not.
        s.jobs_running += 1;
        $("#jobs-running").text(s.jobs_running);

        // And the number of jobs total in the batch
        s.jobs_in_batch += 1;
        $("#jobs-in-batch").text(s.jobs_in_batch);
    };

    Rpc.prototype._worker_reply = function (message) {
        // Handle a Web Worker message, which may be an RPC response, log or debug message

        console.log('rpc._worker_reply');
        var s = self; // TODO

        if (!_.isUndefined(message.data.type) && message.data.type === 'debug') {
            console.log(message.data.message);
            return;
        }

        if (!_.isUndefined(message.data.log)) {
            // This is really a log entry
            print(message.data.log);
            return;
        }

        if (message.data.id < s.batch_start) {
            // This job is not part of the current batch. Don't believe its lies.
            // TODO: Report errors even here?
            return;
        }

        if (message.data.progress !== undefined) {
            // This is really an intermediate progress report
            if (s.progress_callbacks[message.data.id] !== undefined) {
                // We have a callback registered to handle it. Call that.
                s.progress_callbacks[message.data.id](message.data.progress);
            } else {
                print("Warning: got progress without progress callback for " +
                        message.data.id);
            }
            return;
        }

        // This is really a job completion message (success or error).

        // Update the UI with the number of jobs in flight.
        s.jobs_running -= 1;
        $("#jobs-running").text(s.jobs_running);

        if (message.data.error) {
            // The RPC call generated an error.
            // Inform the page.
            print("RPC error: " + message.data.error);

            // Get rid of the callback
            delete s.callbacks[message.data.id];

            // And the progress callback
            delete s.progress_callbacks[message.data.id];

            return;
        }

        // Pass the return value to the registered callback.
        s.callbacks[message.data.id]({
            results: message.data.return_value,
            jobs_running: s.jobs_running
        });

        // Get rid of the callback
        delete s.callbacks[message.data.id];

        // And the progress callback
        delete s.progress_callbacks[message.data.id];
    };

    Rpc.prototype._worker_error = function (error) {

        console.log('rpc _worker_error');
        // Handle an error event from a web worker
        // See http://www.whatwg.org/specs/web-apps/current-work/multipage/workers.h
        // tml#errorevent

        banner('warn', "Web Worker error: " + error.message); // TODO
        print(error.message + "\n at" + error.filename + " line " + error.lineno +
                " column " + error.column); // TODO
    };

    initRpc = function () { // jshint ignore:line
        console.log('initRpc');
        var rpc = new Rpc();
        rpc.initialize();
        return rpc;
    };

})(app);
