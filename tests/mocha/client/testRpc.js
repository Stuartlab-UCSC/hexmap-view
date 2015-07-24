// tests/mocha/client/testRpc.js

if (!(typeof MochaWeb === 'undefined')) {
    MochaWeb.testOnly(function () {

        describe ('Rpc', function () {
            this.timeout(1000);

            it ('rpcCreate should exist', function () {
                Meteor.flush();
                chai.assert(rpcCreate);
            });
            it ('Rpc attributes & methods should exist', function () {
                Meteor.flush();
                var s = rpcCreate();
                chai.assert.equal(s.NUM_RPC_WORKERS, 10);
                chai.assert.equal(s.workers.length, s.NUM_RPC_WORKERS);
                chai.assert.equal(s.next_free_worker, 0);
                chai.assert.equal(s.jobs_running, 0);
                chai.assert.equal(s.jobs_in_batch, 0);
                chai.assert(s.callbacks);
                chai.assert(s.progress_callbacks);
                chai.assert.equal(s.next_id, 0);
                chai.assert.equal(s.batch_start, 0);
                chai.assert(s.initialize);
                chai.assert(s.new_batch);
                chai.assert(s.call);
                chai.assert(s._reply);
                chai.assert(s._error);
                chai.assert(s.workers[1].terminate);
                chai.assert(s.workers[1].onmessage);
                chai.assert(s.workers[1].onerror);
            });
            it ('Rpc.new_batch should create a batch', function () {
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                s.batch_start = 5;
                s.next_id = 6;
                s.jobs_running = 2;
                s.workers[0] = {terminate: function () {}};
                s.workers[1] = {terminate: function () {}};
                s.next_free_worker = 6;
                s.callbacks = {0: '0job', 1: '1job'};
                s.progress_callbacks = {0: '0job', 1: '1job'}
                s.jobs_in_batch = 2;

                s.new_batch();
                chai.assert.equal(s.batch_start, 6);
                chai.assert.equal(s.next_id, 6);
                chai.assert.equal(s.jobs_running, 0);
                chai.assert.equal(s.workers.length, 10);
                chai.assert.equal(s.next_free_worker, 0);
                chai.assert.equal(s.callbacks[1], undefined);
                chai.assert.equal(s.progress_callbacks[1], undefined);
                chai.assert.equal(s.jobs_in_batch, 0);
            });
            it ('Rpc.call should ask a worker to work, basic test', function () {
                // Does not test that the postMessage call actually worked
                // because that requires an async test that I don't want to do yet
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                s.next_id = 6;
                function_name = function () {};
                function_args = [0,1];
                callback = function () {};
                progress_callback = function () {};
                s.callbacks = {0: '0job', 1: '1job'};
                s.progress_callbacks = {0: '2job', 1: '3job'};
                s.workers[0] = {postMessage: function () {}};
                s.workers[1] = {postMessage: function () {}};
                s.next_free_worker = 9;
                s.jobs_running = 1;
                s.jobs_in_batch = 2;

                s.call('function_name', function_args, callback, progress_callback);
                chai.assert.equal(s.next_id, 7);
                //chai.assert.equal(s.next_free_worker, 0); // don't know why this fails
                chai.assert.equal(s.jobs_running, 2);
                chai.assert.equal(s.jobs_in_batch, 3);
            });
            it ('Rpc.reply should handle a log message', function () {
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = {
                    data: {
                        log: 'logMessage'
                        }
                    };
                s.jobs_running = 1;

                s._reply(message);
                chai.assert.equal(s.jobs_running, 1);
            });
            it ('Rpc.reply should handle the error of ID < start ID', function () {
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = { data: { id: '1' } };
                s.batch_start = 2;
                s.jobs_running = 1;

                s._reply(message);
                chai.assert.equal(s.jobs_running, 1);
            });
            it ('Rpc.reply should handle a progress message with a callback', function () {
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = { data: { id: '1', progress: 'progressMade' } };
                s.batch_start = 1;
                s.jobs_running = 1;
                var progressMessage = '';
                s.progress_callbacks[1] = function (progress) {
                    progressMessage = progress;
                }

                s._reply(message);
                chai.assert.equal(progressMessage, 'progressMade');
                chai.assert.equal(s.jobs_running, 1);
            });
            it ('Rpc.reply should handle a progress message without a callback', function () {
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = { data: { id: '1', progress: 'progressMade' } };
                s.batch_start = 1;
                s.jobs_running = 1;
                var progressMessage = '';

                s._reply(message);
                chai.assert.equal(progressMessage, '');
                chai.assert.equal(s.jobs_running, 1);
            });
            it ('Rpc.reply should handle an error completion message ', function () {
                // Does not check $("#jobs-running")
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = { data: { id: '1', error: 'errorOccured' } };
                s.batch_start = 1;
                s.jobs_running = 1;
                s.callbacks = {0: '0job', 1: '1job'};
                s.progress_callbacks = {0: '2job', 1: '3job'};

                s._reply(message);
                chai.assert.equal(s.jobs_running, 0);
                chai.assert.notOk(s.callbacks[1]);
                chai.assert.notOk(s.progress_callbacks[1]);
            });

            it ('Rpc.reply should handle a successful completion message ', function () {
                // Does not check $("#jobs-running")
                Meteor.flush(); var s = rpcCreate(); s.initialize();
                var message = { data: { id: '1', return_value: 'returnValue' } };
                s.batch_start = 1;
                s.jobs_running = 1;
                var val = '';
                s.callbacks[1] = function (reply) {
                    val = reply.results;
                }

                s._reply(message);
                chai.assert.equal(s.jobs_running, 0);
                chai.assert.equal(val, 'returnValue');
                chai.assert.notOk(s.callbacks[1]);
                chai.assert.notOk(s.progress_callbacks[1]);
            });

            // it ('_onmessage should call _reply', function () {
                // Unimplemented
            // });
        });
    });
}
