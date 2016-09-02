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
        methods = ['DrL', 'tSNE', 'MDS', 'PCA', 'ICA', 'isomap', 'spectral embedding'],
        defaultMethod = methods[0],
        advancedLabel = new ReactiveVar();
 
    Template.createMapT.helpers({
        advancedLabel: function () {
            return Session.get('createMapAdvanced') ;
        },
        advancedDisplay: function () {
            if (Session.get('createMapAdvanced') === showAdvanced) {
                return 'none';
            } else {
                return 'table';
            }
            return Session.get('nodeCount');
        },
    });

    function show () {
 
        // Show the contents of the dialog, once per trigger button click

        // Create the selection list
        var data = [];
        methods.forEach(function (method){
            data.push({id: method, text: method});
        });
        var $methodAnchor = $('#createMapDialog .methodAnchor');
        createOurSelect2($methodAnchor, {data: data}, defaultMethod);
        $methodAnchor.show();

        // Define the event handler for the selecting in the list
        $methodAnchor.on('change', function (ev) {
            methodSelected = ev.target.value;
        });
 
        // Define event handler for advanced link click
        $('#createMapDialog .advancedTrigger').on('click', function () {
            if (Session.equals('createMapAdvanced', showAdvanced)) {
                Session.set('createMapAdvanced', hideAdvanced);
            } else {
                Session.set('createMapAdvanced', showAdvanced);
            }
        });
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
            hide, true, '#fakeHelpAnchor');
 
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
