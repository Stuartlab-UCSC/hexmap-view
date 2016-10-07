// upload.js
// This uploads a single TSV file to the server.

var app = app || {}; // jshint ignore:line
(function (hex) { // jshint ignore:line

    Upload = function ($anchor, meteor_method, our_file_name, log) { // jshint ignore:line

        this.$anchor = $anchor;
        this.meteor_method = meteor_method;
        this.our_file_name = our_file_name;
        this.log = log;
        this.chunk_size = 1024 * 1024; // 1 MB
            
        Upload.prototype.report_error = function (error, user_file_name) {
            var msg = 'Uploading ' + user_file_name +
                ' to server failed with: ' + error;
            Util.banner('error', msg);
            this.log_it(this.log.get() + '\n' + msg);
        };
        
        Upload.prototype.read = function (upload, callback) {
            var u = upload;
        
            // Read the file in chucks
            u.reader.onload = function () {
                callback(null, new Uint8Array(upload.reader.result));
                u.start += u.chunk_size;
            };
            u.reader.onerror = function () {
                callback(u.reader.error);
            };
            u.reader.readAsArrayBuffer(
                u.file.slice(u.start, u.start + u.chunk_size));
        };
        
        Upload.prototype.log_it = function (msg_in, start, size, replace_last) {
            var msg = msg_in;
            if (!msg) {
 
                // This must be an upload progress messsage
                var endDate = new Date(),
                    elapsed =
                        Math.ceil((endDate.getTime() -
                        this.startDate.getTime()) / 100 / 60) / 10,
                    elapsed_str
                        = elapsed.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
                    size_str
                        = size.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
                    start_str
                        = start.toString().replace(/\B(?=(\d{3})+\b)/g, ",");
                msg = this.file.name +
                    ': uploaded ' + start_str +
                    ' of ' + size_str +
                    ' bytes in ' + elapsed_str + ' minutes.';
            }

            msg = this.log.get() + replace_last ? '' : '\n' + msg;
            this.log.set(msg);
        };
        
        Upload.prototype.upload_now = function (upload, callback) {
 
            // Do the the upload now
            var u = upload;
            this.startDate = new Date();
        
            // Initiate the upload
            if (!u.file) {
                var msg = 'Error: No file was selected';
                Util.banner('error', msg);
                u.log_it(msg);
                return;
            }
 
            u.user_file_name = u.file.name;
 
            this.start = 0;
            u.reader = new FileReader();
            
            var read_next = function () {
 
                // Read the next chunk of data and write it to the server
                if (u.start < u.file.size) {
                    u.log_it(undefined, u.start, u.file.size, true);

                    u.read(u, function (error, result) {
                        if (error) {
                            u.report_error(error, u.file.name);
                        } else {
                        
                            // Convert ArrayBuffer to something server can read
                            var buf = new Uint8Array(result);
              
                            // Write the file chunk to the server
                            Meteor.apply(
                                u.meteor_method,
                                [u.our_file_name, buf, u.start],
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
                    u.log_it(undefined, u.file.size, u.file.size, true);
                    callback();
                }
            };
            read_next();
        };

        Upload.prototype.handle_file_select = function (ev, upload) {
            upload.file = ev.target.files[0]; // FileList object
            if (!upload.file) {
                upload.report_error ('No file found', '');
                return;
            }
        };
        
        Upload.prototype.init = function ($anchor) {
            var u = this;

            this.$el = $anchor.find('.file_name');

            // Define the event handler for the selecting a file
            this.$el.on('change', function (ev) {
                u.handle_file_select(ev, u);
            });
 
            return this;
        };
    };

    // Public methods
 
    create_upload = function ($anchor, meteor_method, our_file_name, log) {

        // Creates an instance of the Upload to upload one file.
        // @param: $anchor: parent jquery element of upload instance
        // @param: meteor_method: the meteor method do call for upload
        // @param: our_file_name: our base file name
        // @param: log: a reactiveVar containing a text log
 
        var instance =
            new Upload($anchor, meteor_method, our_file_name, log);
        instance.init($anchor);
        return instance;
    }
})(app);

