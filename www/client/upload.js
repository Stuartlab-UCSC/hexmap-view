// upload.js
// This uploads a single TSV file to the server, with progress feedback.

var app = app || {};

(function (hex) {
Upload = (function () {
    //'use strict';
    
    var title = 'Upload a TSV file',
        $dialog,    // our dom element from which the jqueryUI dialog is created
        dialog_hex, // our dialogHex instance
        file,
        start,
        chunk_size = 1024 * 1024 * 10, // 10 MB
        reader;
        
    function report_error (error) {
        Util.banner('error', 'Uploading file to server failed with: ' + error);
    }
    
    function read (callback) {
    
        // Read the file in chucks
        reader.onload = function (ev) {
            callback(null, new Uint8Array(reader.result));
            start += chunk_size;
        }
        reader.onerror = function () {
            callback(reader.error);
        }
        reader.readAsArrayBuffer(file.slice(start, start + chunk_size));
    }
    
    function upload() {
    
        var startDate = new Date;
    
        // Initiate the upload
        if (!file) {
            Util.banner('error', 'No file was selected');
            return;
        }
        
        start = 0;
        reader = new FileReader();
        
        var read_next = function () {
        
            // Read the next chunk of data and write it to the server
            if (start < file.size) {
                read(function (error, result) {
                    if (error) {
                        report_error(error);
                    } else {
                    
                        // Convert ArrayBuffer to something the server can read
                        var buf = new Uint8Array(result);
          
                        // Write the file chunk to the server
                        Meteor.apply(
                            'write_tsv_file_to_server',
                            [file, buf, start],
                            {wait: true},
                            function (error) {
                                if (error) {
                                    report_error(error);
                                } else {
                                    // TODO a progress meter
                                    read_next();
                                }
                            }
                        );
                    }
                });
            } else {
                var endDate = new Date;
                var elapsed = ' ('
                    + Math.ceil(
                      (endDate.getTime() - startDate.getTime()) / 100 / 60) / 10
                    + ' minutes)';
                console.log('Upload complete, elapsed minutes:', elapsed);
            }
        }
        read_next();
    }

    function handleFileSelect (ev) {
        file = ev.target.files[0]; // FileList object
        if (!file) {
            return; // TODO can we get here without a file? add an error message
        }
    }
    
    function show () {
        $dialog.on('change', '.file_name', handleFileSelect);
    }
    
    function hide() {
    }

    return { // Public methods
        init: function () {

            $dialog = $('#upload_dialog');
            var $button = $('#navBar .upload');
     
            // Define the dialog options & create an instance of DialogHex
            var opts = {
                title: title,
                buttons: [{ text: 'Upload', click: upload }],
            };
            dialogHex = createDialogHex(undefined, $button, $dialog, opts, show,
                hide, true);
     
            // Listen for the menu clicked
            add_tool('upload', function() {
                dialogHex.show();
            }, 'Upload a tab-separated-values file');
        },
    }
}());
})(app);
