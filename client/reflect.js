// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'Reflect on Another Map',
        dialogHex,
        $dialog,
        mapIdList,
        mapId,
        selectionList,
        selectionSelected = ''; // Selected selection from the list of selections

    function show () {
 
        // Show the contents of the dialog, once per trigger button click
 
        // The map ID selector.
        var data = [{ id: 6, text: mapId }];
        var $mapAnchor = $('#reflectDialog .mapIdAnchor');
        mapIdList = createOurSelect2($mapAnchor, {data: data}, 6);
        $mapAnchor.show();
 
        // The selection selector.
        selectionList = createLayerNameList($('#reflectDialog .layerNameListAnchor'),
                                    $('#reflectDialog .selectionListLabel'),
                                    selectionSelected);
        selectionList.enable(true, {selection: true});
 
        // Define the event handler for the selecting in the list
        $mapAnchor.on('change', function (ev) {
            mapId = ev.target.value;
        });
    }
 
    function mapManager (operation, toMapId, nodeIds) {
        console.log('Called mapManager stub with:',
            '\n    operation:', operation,
            '\n    toMapId:', toMapId,
            '\n    nodeIds:', nodeIds);
    }
 
    function mapIt () {
 
        // Gather the user input and call the map manager.
        selectionSelected = selectionList.selected;
        var nodeIds = _.keys(layers[selectionList.selected].data);
        mapManager('reflectInAnotherMap', mapId, nodeIds);

        banner('info', 'Your other map will be updated shortly.');
        hide();
	}
 
    function hide() {
 
        // TODO clean up mapIdList
        /*
        mapId = mapIdList.selected;
        mapIdList.destroy();
        mapIdList = undefined;
        */
        selectionSelected = selectionList.selected;
        selectionList.destroy();
        selectionList = undefined;
        dialogHex.hide();
    }

    initReflect = function () {

        $dialog = $('#reflectDialog');
        var $button = $('#reflectTrigger');
 
        // Initialize our UI variables
        mapId = 'CKCC/v1 Gene Map';
 
        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: title,
            buttons: [{ text: 'Reflect', click: mapIt }],
        };
        dialogHex = createDialogHex($button, $dialog, opts, show,
            hide, true, '#fakeHelpAnchor');
 
        // Listen for the menu clicked
        $button.on('click', function () {
            dialogHex.show();
        });
 
        // Enable/Disable the menu option whenever the username changes,
        // including log out.
        Meteor.autorun(function() {
            var user = Meteor.user();
            
            if (user) {
                $button.removeClass('ui-state-disabled');
            } else {
                $button.addClass('ui-state-disabled');
            }
        });
    }
})(app);
