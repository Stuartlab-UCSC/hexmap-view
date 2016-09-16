// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) {
    //'use strict';

    var show_advanced = 'Advanced options...',
        hide_advanced = 'Hide advanced options',
        title = 'Create a New Map',
        dialogHex,
        $dialog,
        //methodList,
        formats = ['Feature matrix', 'Similarity full matrix', 'Similarity sparse matrix', 'Node XY positions'],
        default_format = 'Feature matrix',
        methods = ['DrL', 'tSNE', 'MDS', 'PCA', 'ICA', 'isomap', 'spectral embedding'],
        advanced_label = new ReactiveVar();
 
    Template.create_map_t.helpers({
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

    function show () {
 
        // Show the contents of the dialog, once per trigger button click

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
 
        // Define event handler for advanced link click
        console.log("$('#create_map_dialog .advanced_trigger')", $('#create_map_dialog .advanced_trigger'));
        $('#create_map_dialog .advanced_trigger').on('click', function () {
            Session.set('create_map_show_advanced',
                !Session.get('create_map_show_advanced'));
        })
    }

    function createIt () {
 
        // TODO

        // TODO do grid & home page have a banner?
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
 
        // Enable/Disable the menu option whenever the username changes,
        // including log out.
        Meteor.autorun(function() {
            var user = Meteor.user();
            if (user) {
                $button.removeClass('disabled');
            } else {
                $button.addClass('disabled');
            }
        });
    }
})(app);
