// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'Create a New Map',
        dialogHex,
        $dialog;
 
    /* TODO later
    var show_advanced = 'Advanced options...',
        hide_advanced = 'Hide advanced options',
        formats = ['Feature matrix', 'Similarity full matrix', 'Similarity sparse matrix', 'Node XY positions'],
        default_format = 'Feature matrix',
        methods = ['DrL', 'tSNE', 'MDS', 'PCA', 'ICA', 'isomap', 'spectral embedding'],
        advanced_label = new ReactiveVar(),
        requested_name = new ReactiveVar('');
    */
 
    Template.create_map_t.helpers({
        /* TODO later
        name: function () {
            return requested_name.get();
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
        */
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
 
    function show () {
 
        // Show the contents of the dialog, once per trigger button click
 
        // Define the handler for the feature file selection
        $dialog.find('.feature.file').on('change', function (ev) {
            var file = event.target.files[0];
        });
 
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

    function createIt () {
 
        // TODO

        banner('info', 'Your map is building. An email will be sent when complete.');
        hide();
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
 
        // Listen for the menu clicked
        add_tool("createMap", function() {
            dialogHex.show();
        }, 'Create a new map');
    }
})(app);
