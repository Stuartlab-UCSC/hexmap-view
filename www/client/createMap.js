// createMap.js
// This creates a new map with user uploaded data.

var app = app || {};

(function (hex) {
    //'use strict';

    var showAdvanced = 'Show advanced attribute types...',
        hideAdvanced = 'Hide advanced attribute types',
        title = 'Create a New Map with Your Data',
        dialogHex,
        $dialog,
        methodSelected,
        //methodList,
        formats = ['Feature matrix', 'Similarity full matrix', 'Similarity sparse matrix', 'Node XY positions'],
        default_format = 'Feature matrix',
        methods = ['DrL', 'tSNE', 'MDS', 'PCA', 'ICA', 'isomap', 'spectral embedding'],
        defaultMethod = methods[0],
        advanced_label = new ReactiveVar();
 
/*
    Template.create_map_t_.helpers({
        advanced_label: function () {
            return Session.get('createMapAdvanced') ;
        },
        advanced_display: function () {
            if (Session.get('createMapAdvanced') === showAdvanced) {
                return 'none';
            } else {
                return 'table';
            }
            return Session.get('nodeCount');
        },
    });
*/
    function show () {
 
        // Show the contents of the dialog, once per trigger button click

        // Create the feature format list
        var data = [];
        formats.forEach(function (format){
            data.push({id: format, text: format});
        });
        var $format_anchor = $('#createMapDialog .format_anchor');
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
        var $method_anchor = $('#createMapDialog .method_anchor');
        createOurSelect2($method_anchor, {data: data}, defaultMethod);
        $method_anchor.show();

        // Define the event handler for the method list
        $method_anchor.on('change', function (ev) {
            methodSelected = ev.target.value;
        });
 
/*
        // Define event handler for advanced link click
        $('#createMapDialog .advanced_trigger').on('click', function () {
            if (Session.equals('createMapAdvanced', showAdvanced)) {
                Session.set('createMapAdvanced', hideAdvanced);
            } else {
                Session.set('createMapAdvanced', showAdvanced);
            }
        })
*/
    }

    function createIt () {
 
        // TODO

        // TODO do grid & home page have a banner?
        banner('info', 'Your map is building. An email will be sent when complete.');
        hide();
	}
 
    function hide() {
 
        // TODO
        //methodSelected = methodList.selected;
        //methodList.destroy();
        //methodList = undefined;
        dialogHex.hide();
    }

    initCreateMap = function () {
 
        $dialog = $('#createMapDialog');
        var $button = $('#navBar createMap');
 
        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: title,
            buttons: [{ text: 'Create', click: createIt }],
        };
        dialogHex = createDialogHex(undefined, $button, $dialog, opts, show,
            hide, true, 'help/createMap.html');
 
            //'help/createMap.html#feature-file-formats');
 
        // Listen for the menu clicked
        add_tool("createMap", function() {
            dialogHex.show();
        }, 'Create a new map');
 
        // Initialize some variables
        Session.set('createMapAdvanced', showAdvanced);
 
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
