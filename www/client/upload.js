// upload.js
// This uploads a single TSV file to the server.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    Upload = function ($anchor, dir, our_file_name, log) {

        this.$anchor = $anchor;
        this.dir = dir;
        this.our_file_name = our_file_name;
        this.log = log;
        this.chunk_size = 1024 * 1024 * 10; // 10 MB
            
        Upload.prototype.report_error = function (error, user_file_name) {
            var msg = 'Uploading ' + user_file_name
                + ' to server failed with: ' + error;
            Util.banner('error', msg);
            this.log.set(this.log.get() + '\n' + msg);
        }
        
        Upload.prototype.read = function (upload, callback) {
            var u = upload;
        
            // Read the file in chucks
            u.reader.onload = function (ev) {
                callback(null, new Uint8Array(upload.reader.result));
                u.start += u.chunk_size;
            }
            u.reader.onerror = function () {
                callback(u.reader.error);
            }
            u.reader.readAsArrayBuffer(
                u.file.slice(u.start, u.start + u.chunk_size));
        }
        
        Upload.prototype.log_it = function (upload, start, size) {
            var endDate = new Date;
            var elapsed =
                Math.ceil((endDate.getTime() - startDate.getTime())
                / 100 / 60) / 10;

            upload.log.set(upload.file.name + ': uploaded ' + start + ' of '
                        + size + ' bytes in ' + elapsed + ' minutes.');
        }
        
        Upload.prototype.upload_now = function (upload, callback) {
 
            // Do the the upload now
            var u = upload;
                startDate = new Date;
        
            // Initiate the upload
            if (!u.file) {
                Util.banner('error', 'No file was selected');
                return;
            }
 
            u.user_file_name = u.file.name;
 
            this.start = 0;
            u.reader = new FileReader();
            
            var read_next = function () {
 
                // Read the next chunk of data and write it to the server
                if (u.start < u.file.size) {
                    u.log_it(u, u.start, u.file.size);

                    u.read(u, function (error, result) {
                        if (error) {
                            u.report_error(error, u.file.name);
                        } else {
                        
                            // Convert ArrayBuffer to something the server can read
                            var buf = new Uint8Array(result);
              
                            // Write the file chunk to the server
                            Meteor.apply(
                                'write_tsv_file_to_server',
                                [u.dir, u.our_file_name, buf, u.start],
                                {wait: true},
                                function (error) {
                                    if (error) {
                                        u.report_error(error, u.file.name);
                                    } else {
                                        // TODO a progress meter
                                        read_next();
                                    }
                                }
                            );
                        }
                    });
                } else {
 
                    // The last chunck has been uploaded
                    u.log_it(u, u.file.size, u.file.size);
                    callback();
                }
            }
            read_next();
        }

        Upload.prototype.handle_file_select = function (ev, upload) {
            upload.file = ev.target.files[0]; // FileList object
            if (!upload.file) {
                upload.report_error ('No file found', '');
                return;
            }
        }
        
        Upload.prototype.show = function () {
            var u = this;
            $dialog.on('change', '.file_name', handle_file_select, u);
        }
 
        Upload.prototype.init = function ($anchor) {
            var u = this;

            this.$el = $anchor.find('.file_name');

            // Define the event handler for the selecting a file
            this.$el.on('change', function (ev) {
                u.handle_file_select(ev, u);
            });
 
            return this;
        }
    }

    create_upload = function ($anchor, dir, our_file_name, log) {
 

        // Creates an instance of the Upload to upload one file.
        // @param: $anchor: parent jquery dom element of this upload instance
        // @param: dir: full path of the directory for the upload file
        // @param: our_file_name: our base file name
        // @param: log: a reactiveVar containing a text log
 
        var instance = new Upload($anchor, dir, our_file_name, log);
        instance.init($anchor);
        return instance;
    }
})(app);

