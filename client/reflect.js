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
 
        // The the mapId is selected by the user, they select the map they want to see the reflection in
        // mapId selector:
        var data = [
            { id: 5, text: 'Pancan12/TumorMap' }, //TODO: replace with bettter way to get mapId
            { id: 6, text: 'Pancan12/GeneMap'},
            { id: 6, text: 'GTEx/SampleMap'},
            { id: 6, text: 'GTEx/GeneMap'},
        ];
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
            '\n    username:', Meteor.user().username,
            '\n    operation:', operation,
            '\n    toMapId:', toMapId,
            '\n    nodeIds:', nodeIds,
            '\n    selection:', selectionSelected);

        userId=Meteor.user().username;

        Meteor.call("mapManager",operation,userId,toMapId,nodeIds,selectionSelected,function (error,success){
        //Meteor.call("mapManager",'test',toMapId,nodeIds,function (error,success){
            if(error){
                console.log('Mapmanager: Operation' + operation + ' failed');
            } else {
                //console.log('success');
            }
        });
        
    }

    function mapIt () {
        // TODO get name of selection and feed it to manager
        // determine which map you are going to, only two options now

        if ('PAM50' in layers){
            toMapId = 'sample';
            console.log('you on genemap');
        } else if('Tissue' in layers) {
            toMapId = 'feature';
            console.log('you on samplemap');
        } else if ('Tissue_Norm' in layers){
            toMapId = 'GtexFeature';
        } else {
            toMapId = 'GtexSample';
        } 
        
        // Gather the user input and call the map manager.
        selectionSelected = selectionList.selected;
        console.log(selectionSelected);
        // Bail if no selection is selected
        if (_.isUndefined(selectionSelected)) return;

        var nodeIds = [];
        _.each(layers[selectionList.selected].data,
            function (val, key) {
                if (val === 1)  nodeIds.push(key);
            }
        );

        mapManager('reflection', toMapId, nodeIds);

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
        // duncan comment: Why here, I put it inside mapIt
        mapId = 'the map you are on';
 
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
            
            // TODO this only changes its color, really disable it
            if (user) {
                $button.removeClass('ui-state-disabled');
            } else {
                $button.addClass('ui-state-disabled');
            }
        });
    }
})(app);
