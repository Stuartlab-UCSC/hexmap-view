// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) { // jshint ignore: line
CreateMap = (function () { // jshint ignore: line

    var title = 'Create a New Map',
        dialogHex, // instance of the class DialogHex
        $dialog, // our dialog DOM element
        feature_upload, // the feature file selector
        attribute_upload, // the feature file selector
        our_feature_file_name,
        our_attribute_file_name,
        user_project,
        feature_space_dir,
        view_dir,
        log = new ReactiveVar(),
        safe_username;

    var show_advanced = 'Advanced options...',
        hide_advanced = 'Hide advanced options';
    /*
    var formats = [
            'Feature matrix',           // feature
            'Full similarity matrix',   // full_sim
            'Sparse similarity matrix', // sparse_sim
            'Node XY positions',        // coordinates
        ],
        default_format = 'Feature matrix',
        methods = [
            'DrL',
            'tSNE',
            'MDS',
            'PCA',
            'ICA',
            'isomap',
            'spectral embedding',
        ],
        default_method = 'Drl',
        advanced_label = new ReactiveVar(),
        requested_name = new ReactiveVar('');
    */
 
    Template.create_map_t.helpers({
        log: function () {
            Meteor.setTimeout(function () {
                var $log = $('#create_map_dialog .log');
                if ($log && $log[0]) {
                    $log.scrollTop($log[0].scrollHeight);
                }
            }, 0); // Give some time for the log message to show up
            return log.get();
        },
        dynamic: function () {
            return !(Session.get('create_map_stats_precompute'));
        },
        precompute: function () {
            return Session.get('create_map_stats_precompute');
        },
        advanced_label: function () {
            return Session.get('create_map_show_advanced') ?
                hide_advanced : show_advanced;
        },
        advanced_display: function () {
            if (Session.get('create_map_show_advanced')) {
                return 'table';
            } else {
                return 'none';
            }
        },
    });
 
    function report_error (msg) {
        Util.banner('error', msg);
        var date = new Date().toString(),
            i = date.indexOf('GMT');
        date = date.slice(0, i);
        feature_upload.log_it(msg + '\nPlease let hexmap@ucsc.edu know you ' +
            'had a map creation problem on ' + date);
    }
 
    function report_info (msg) {
        Util.banner('info', msg);
        feature_upload.log_it(msg);
    }
 
    function create_map () {
 
        var msg = 'Uploads complete. Generating layout...';
 
        Util.banner('info', msg);
        feature_upload.log_it(msg);

        var opts = [
            '--names', 'layout',
            '--directory', view_dir,
            '--role', safe_username,
            '--include-singletons',
            '--no_density_stats',
            '--no_layout_independent_stats',
            '--no_layout_aware_stats',
        ];
        if (true) { // TODO (feature_format === 'coordinates') {
            opts.push('--coordinates');
            opts.push(our_feature_file_name);
        }
        if (attribute_upload.file) {
            opts.push('--scores');
            opts.push(our_attribute_file_name);
        }
 
        Meteor.call('create_map', opts, function (error) {
            if (error) {
                report_error('Error: ' + error);
                
            } else {
                report_info('Map was successfully created.');

                // Open the new map.
                Hex.loadProject(user_project);
            }
        });
    }

    function upload_attributes () {
 
        // Upload the user's attribute file
        if (attribute_upload.file) {
            attribute_upload.upload_now(attribute_upload, function () {
                var msg =
                    attribute_upload.user_file_name + ' has been uploaded.';
                Util.banner('info', msg);
                create_map();
            });
        } else {
            create_map();
        }
    }

    function create_clicked () {
 
        // Upload the user's feature file
        feature_upload.upload_now(feature_upload, function () {
            var msg = feature_upload.user_file_name + ' has been uploaded.';
            Util.banner('info', msg);
            upload_attributes();
        });
	}
 
    function username_received (username) {
 
        // User name has been received, set up the widgets
        if (!username) {
            Util.banner('error', 'username could not be found');
            return;
        }
        safe_username = Util.clean_file_name(username);
 
        // Transform the username into a suitable file name,
        // and set up some directory names
        // TODO: build these file names in the server using
        // clean_file_name() there
        user_project = safe_username + '/';
        feature_space_dir = FEATURE_SPACE_DIR + user_project;
        view_dir = VIEW_DIR + user_project;
        var meteor_method = 'upload_create_map_feature_space_file';

 
        // Define the file selector for features file
        var file_name = 'features.tab';
        our_feature_file_name = feature_space_dir + file_name;
        feature_upload = create_upload($dialog.find('.feature_upload_anchor'),
            meteor_method, file_name, log);
        Session.set('create_map_feature_file', feature_upload.file);
 
        // Define the file selector for attributes file
        file_name = 'attributes.tab';
        our_attribute_file_name = feature_space_dir + file_name;
        attribute_upload =
            create_upload($dialog.find('.attribute_upload_anchor'),
            meteor_method, file_name, log);
        Session.set('create_map_attribute_file', attribute_upload.file);

        // Initialize the file widgets
        log.set('log messages:');

        /* TODO later
        // Create the feature format list
        var data = [];
        formats.forEach(function (format){
            data.push({id: format, text: format});
        });
        var $format_anchor = $('#create_map_dialog .format_anchor');
        createOurSelect2($format_anchor, {data: data}, default_format);
        $format_anchor.show();

        // Define the event handler for the feature format list
        $format_anchor.on('change', function (ev) {
            format_selected = ev.target.value;
        });
        */
 
        /* TODO later
        // Create the method list
        var data = [];
        methods.forEach(function (method){
            data.push({id: method, text: method});
        });
        var $method_anchor = $('#create_map_dialog .method_anchor');
        createOurSelect2($method_anchor, {data: data}, 
            Session.get('create_map_method'));
        $method_anchor.show();

        // Define the event handler for the method list
        $method_anchor.on('change', function (ev) {
            Session.set('create_map_method', ev.target.value);
        });
        */
 
        /* TODO later
        // Define event handler for advanced link click
        $('#create_map_dialog .advanced_trigger').on('click', function () {
            Session.set('create_map_show_advanced',
                !Session.get('create_map_show_advanced'));
        });
        */
    }
 
    function show () {
 
        // Show the contents of the dialog, once per menu button click

        // Find the username to build directories for her
        Util.get_username(username_received);
    }

    function hide() {
 
        // Free any memory we can before destroying the dialog
        dialogHex.hide();
    }
    
    return { // Public methods
        init: function () {
     
            $dialog = $('#create_map_dialog');
            var $button = $('#navBar .createMap');
     
            // Define the dialog options & create an instance of DialogHex
            var opts = {
                title: title,
                buttons: [{ text: 'Create', click: create_clicked }],
            };
            dialogHex = createDialogHex(undefined, undefined, $dialog, opts, show,
                hide, true, 'help/createMap.html');
     
            Session.set('create_map_show_advanced', false);

            // Listen for the menu clicked
            Tool.add("createMap", function() {
                dialogHex.show();
            }, 'Create a new map');
     
            // Also open the dialog if the link on the home page is clicked
            $('.createMapHome .createMap')
                .button()
                .on('click', function () {
                $button.click();
            });
     
        },
    };
}());
})(app);
