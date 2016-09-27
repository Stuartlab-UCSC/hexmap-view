// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'Create a New Map',
        dialogHex, // instance of the class DialogHex
        $dialog, // our dialog DOM element
        feature_file, // the feature file object
        our_feature_file_name,
        view_dir,
        log = new ReactiveVar();

    var show_advanced = 'Advanced options...',
        hide_advanced = 'Hide advanced options',
        formats = [
            'Feature matrix',
            'Full similarity matrix',
            'Sparse similarity matrix',
            'Node XY positions',
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
 
    Template.create_map_t.helpers({
        name: function () {
            var file = Session.get('create_map_feature_file');
            if (name) {
                return file.name;
            } else {
                return undefined;
            }
        },
        log: function () {
            return log.get();
        },
        dynamic: function () {
            return !(Session.get('create_map_stats_precompute'));
        },
        precompute: function () {
            return Session.get('create_map_stats_precompute');
        },
        advanced_label: function () {
            return Session.get('create_map_show_advanced')
                ? hide_advanced : show_advanced;
        },
        advanced_display: function () {
            if (Session.get('create_map_show_advanced')) {
                return 'table';
            } else {
                return 'none';
            }
        },
    });

    /* TODO later
    function name_changed (ev) {
        var name = ev.target.value,
            dup_name,
            msg ' is already used, so a new name is suggested';
 
        unique_name = Project.make_name_unique(name);
        if (unique_name === name) {
            Session.set('create_map_name', name);
        } else {
            Session.set('create_map_name', unique_name);
            banner('warn', name + msg);
        }

            // Suggest another unique name
            dup_name = name;
            requested_name = unique_name;
 
            msg =
        }
    }
    */
 
    function username_received (username) {
 
        if (!username) {
            Util.banner('error', 'username could not be found');
            return;
        }
 
        var clean_username = Util.clean_file_name(username);
 
        var dir = FEATURE_SPACE_DIR + clean_username + '/';
        var file_name = 'feature.tsv'
        our_feature_file_name = dir + file_name;
        view_dir = VIEW_DIR + clean_username + '/';
 
        // Define the file selector for feature file
        feature_file = create_upload($dialog.find('.feature_upload_anchor'),
            dir, file_name, log);
        Session.set('create_map_feature_file', feature_file.file);

        /*
        // Define the file selector for feature file
        $dialog.find('.feature.file').on('change', function (ev) {
            Session.set('create_map_feature_file', event.target.files[0]);
            //var file = event.target.files[0];
        });
        */
 
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
        createOurSelect2($method_anchor, {data: data}, Session.get('create_map_method'));
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
 
        // Show the contents of the dialog, once per trigger button click
 
        // Find the username to build directories for her
        Util.get_username(username_received);
 
    }

/*

        file_picker.change(function(event) {
            // When a file is selected, read it in and populate the text box.
            
            // What file do we really want to read?
            var file = event.target.files[0];
            
            // Make a FileReader to read the file
            var reader = new FileReader();
            
            reader.onload = function(read_event) {  
                // When we read with readAsText, we get a string. Just stuff it
                // in the text box for the user to see.
                text_area.text(reader.result);
            };
            
            // Read the file, and, when it comes in, stick it in the textbox.
            reader.readAsText(file);
        });
        
*/

    function feature_file_uploaded () {
 
        Util.banner('info', feature_file.user_file_name
            + ' upload complete. Generating layout...');

        var opts = [
            '--names', 'layout',
            '--directory', view_dir,
            '--include-singletons',
            '--no-density-stats',
            '--no-layout-independent-stats',
            '--no-layout-aware-stats',
        ];
        if (true) { // TODO (feature_format === 'coordinates') {
            opts.push('--coordinates');
            opts.push(our_feature_file_name);
        }
        if (false) {
            opts.push('--scores');
            opts.push('TODO')
        }
 
        Meteor.call('callPython', 'layout', opts,
            function (error, results) {
            if (error) {
                Util.banner('error', error);
            } else {
                console.log('no errors generated on layout,py');
                if (!_.isUndefined(results)) {
                    console.log('results', results);
                }
                // TODO
            }
        });
    }

    function createIt () {
 
        // Create the map

        // Upload the user's feature file
        feature_file.upload_now(feature_file, feature_file_uploaded);
	}
 
    function hide() {
 
        // TODO
        //methodList.destroy();
        //methodList = undefined;
        dialogHex.hide();
    }

    initCreateMap = function () {
 
        $dialog = $('#create_map_dialog');
        var $button = $('#navBar createMap');
 
        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: title,
            buttons: [{ text: 'Create', click: createIt }],
        };
        dialogHex = createDialogHex(undefined, $button, $dialog, opts, show,
            hide, true, 'help/createMap.html');
 
        Session.set('create_map_show_advanced', false);
        log.set('');
 
        // Listen for the menu clicked
        add_tool("createMap", function() {
            dialogHex.show();
        }, 'Create a new map');
    }
})(app);
