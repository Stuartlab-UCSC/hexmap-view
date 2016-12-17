// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) { // jshint ignore: line
CreateMap = (function () { // jshint ignore: line

    var title = 'Create a Map',
        dialogHex, // instance of the class DialogHex
        $dialog, // our dialog DOM element
        feature_upload, // the feature file selector
        attribute_upload, // the feature file selector
        ui = new ReactiveDict(),
        log = new ReactiveVar(),
        show_advanced = 'Advanced options...',
        hide_advanced = 'Hide advanced options',
        formats = [
            ['feature_space', 'Feature matrix'],
            ['similarity_full', 'Full similarity matrix'],
            ['similarity', 'Sparse similarity matrix'],
            ['coordinates', 'XY positions'],
        ],
        default_feature_format = 'feature_space',
        methods = [
            'DrL',
            'tSNE',
            'MDS',
            'PCA',
            'ICA',
            'isomap',
            'spectral embedding',
        ],
        default_method = 'DrL',
        feature_file_base_name = 'features.tab',
        attr_file_base_name = 'attributes.tab',
        advanced_label = new ReactiveVar();
     
    Template.create_map_t.helpers({
        major_project: function () {
            return ui.get('major_project');
        },
        minor_project: function () {
            return ui.get('minor_project');
        },
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
 
    function project () {
        return ui.get('major_project') + '/' + ui.get('minor_project') + '/';
    }
 
    function major_project_dir () {
        return FEATURE_SPACE_DIR + '/' + ui.get('major_project');
    }

    function feature_space_dir () {
        return FEATURE_SPACE_DIR + project();
    }

    function view_dir () {
        return VIEW_DIR + project();
    }

    function feature_file_name () {
        return feature_space_dir() + feature_file_base_name;
    }

    function attr_file_name () {
        return feature_space_dir() + attr_file_base_name;
    }

    function create_map () {
 
        var msg = 'Uploads complete. Generating layout...';
 
        Util.banner('info', msg);
        feature_upload.log_it(msg);

        var opts = [
            '--names', 'layout',
            '--directory', view_dir(),
            '--role', ui.get('major_project'),
            '--include-singletons',
            '--no_density_stats',
            '--no_layout_independent_stats',
            '--no_layout_aware_stats',
        ];
        
        opts.push('--' + ui.get('feature_format'));
        
        opts.push(feature_file_name());

        if (attribute_upload.file) {
            opts.push('--scores');
            opts.push(attr_file_name());
        }
 
        Meteor.call('create_map', opts, function (error) {
            if (error) {
                report_error('Error: ' + error);
                
            } else {
                report_info('Map was successfully created.');

                // Open the new map.
                Hex.loadProject(project());
            }
        });
    }

    function upload_attributes () {
 
        // Upload the user's attribute file
        if (attribute_upload.file) {
            attribute_upload.upload_now(
                major_project_dir(),
                ui.get('minor_project'),
                function () {
                    var msg = attribute_upload.source_file_name +
                        ' has been uploaded.';
                    Util.banner('info', msg);
                    create_map();
                }
            );
        } else {
            create_map();
        }
    }

    function create_clicked () {
 
        // Upload the user's feature file
        feature_upload.upload_now(
            major_project_dir(),
            ui.get('minor_project'),
            function () {
                var msg = feature_upload.source_file_name +
                    ' has been uploaded.';
                Util.banner('info', msg);
                upload_attributes();
            }
        );
	}
 
    function username_received (username) {
 
        // User name has been received, set up the widgets.
        if (!username) {
            Util.banner('error', 'username could not be found');
            return;
        }
        
        // Find a name to use for this user's projects that will be
        // safe to use as a directory name. TODO this should be made unique for
        // the corner case of the safe name duplicates another user's safe name.
        ui.set('major_project', Util.clean_file_name(username));
 
        var meteor_method = 'upload_feature_space_file';
 
        // Define the file selector for features file
        feature_upload = create_upload($dialog.find('.feature_upload_anchor'),
            meteor_method, feature_file_base_name, log);
 
        // Define the file selector for attributes file
        attribute_upload =
            create_upload($dialog.find('.attribute_upload_anchor'),
            meteor_method, attr_file_base_name, log);

        // Initialize the file widgets
        log.set('log messages');
        
        // Create the feature format list
        var data = [];
        formats.forEach(function (format){
            data.push({id: format[0], text: format[1]});
        });
        var $format_anchor = $('#create_map_dialog .format_anchor');
        createOurSelect2($format_anchor, {data: data}, default_feature_format);
        $format_anchor.show();

        // Define some event handlers
        $('#create_map_dialog .minor_project').on('change', function (ev) {
            ui.set('minor_project', ev.target.value);
        });
        $format_anchor.on('change', function (ev) {
            ui.set('feature_format', ev.target.value);
        });
 
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
            dialogHex = createDialogHex({
                $el: $dialog,
                opts: opts,
                showFx: show,
                hideFx: hide,
                helpAnchor: '/help/createMap.html'
            });
     
            // Initialize some UI variables
            ui.set('feature_format', default_feature_format);
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
