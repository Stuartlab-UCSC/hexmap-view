// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'Reflect on Another Map',
        dialogHex,
        $dialog,
        mapId,
        mapIdList,
        toMapId,
        selectionList,
        toMapIdList,
        selectionSelected = ''; // Selected selection from the list of selections
    
    function show () {

        // Show the contents of the dialog, once per trigger button click
        
        //grab array for possible maps to reflect to
        toMapIds = ManagerAddressBook.findOne().toMapIds;
        //console.log(toMapIds);


        var data = [];
        
        //make Json for showing the possible maps to send reflection to
        toMapIds.forEach(function(mapId){
            data.push({id: mapId, text: mapId});
        });

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
            toMapId = ev.target.value;
        });
    }

    function mapManager (operation, featOrSamp, nodeIds) {
        //this function seems redundant, could do below insidde mapit
        console.log('Called mapManager stub with:',
            '\n    username:', Meteor.user().username,
            '\n    operation:', operation,
            '\n    toMapId:', toMapId,
            '\n    mapId:', mapId,
            '\n    featOrSamp:', featOrSamp,
            '\n    nodeIds:', nodeIds,
            '\n    selection:', selectionSelected,
            '\n    FeatureSpaceDir:', FEATURE_SPACE_DIR);

        //console.log(ctx)
        userId=Meteor.user().username;

        Meteor.call("mapManager",operation, userId, ctx.project, toMapId, featOrSamp,
                                 nodeIds, selectionSelected, function (error,success) {
            if(error){
                console.log('Mapmanager: Operation ' + operation + ' failed');
            } else {
                console.log('Mapmanager: Operation ' + operation + ' success');
            }
        });
        
    }

    function mapIt () {
        
        //TODO:this is an arguement for the manager's script, the Manager should figure this out
        featOrSamp = ManagerAddressBook.findOne().featureOrSample;

        // Gather the user input and call the map manager.
        selectionSelected = selectionList.selected;
        
        // Bail if no selection is selected
        if (_.isUndefined(selectionSelected)) return;

        var nodeIds = [];
        _.each(layers[selectionList.selected].data,
            function (val, key) {
                if (val === 1)  nodeIds.push(key);
            }
        );
        //calls client's Map manager (redundant?)
        mapManager('reflection', featOrSamp, nodeIds);

        banner('info', 'Your other map will be updated shortly.');
        hide();
	}
 
    function hide() {
        
        selectionSelected = selectionList.selected;
        selectionList.destroy();
        selectionList = undefined;
        dialogHex.hide();
    }

    initReflect = function () {

        
        mapId = ctx.project;
        
        //subscribe to address book
        Meteor.subscribe('reflectionToMapIds',mapId);

        $dialog = $('#reflectDialog');
        var $button = $('#reflectTrigger');
 
        // Initialize our UI variables
        
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
