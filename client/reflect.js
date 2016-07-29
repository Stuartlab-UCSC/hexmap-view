// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';
    Windows = new Mongo.Collection('Windows');

    var title = 'Reflect on Another Map',
        dialogHex,
        $dialog,
        mapId,
        mapIdList,
        toMapId,
        toMapIds,
        selectionList,
        toMapIdList,
        lastUser,
        selectionSelected = ''; // option selected from the selection list

    function show () {

        // Show the contents of the dialog, once per trigger button click
 
        //make Json for showing the possible maps to send reflection to
        var data = [];
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

        userId=Meteor.user().username;

        Meteor.call("mapManager",operation, userId, ctx.project, toMapId, featOrSamp,
                                 nodeIds, selectionSelected, function (error,success) {
            if(error){
                console.log('Mapmanager: Operation ' + operation + ' failed');
            } else {
                console.log('Mapmanager: Operation ' + operation + ' success');
            }
        });

        Meteor.call("isWindowOpen",Meteor.user().username, toMapId, function(error,result){
            // no errors are returned
            if(!result) { //result is simply true if the toMapId window  is opened.
                pathPeices = toMapId.split('/');
                major = pathPeices[0]; //
                minor = pathPeices[1];
                window.open(URL_BASE + '/?p=' + major + '.' + minor)// opens new window
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

        banner('info', 'Your other map will update shortly.');
        hide();
	}
 
    function hide() {
 
        // TODO: do we need to free map select vars as well?
        selectionSelected = selectionList.selected;
        selectionList.destroy();
        selectionList = undefined;
        dialogHex.hide();
    }
 
    function getToMapIds() {
 
        // grab array for possible maps to reflect to
        var mapIds,
            addressEntry = ManagerAddressBook.findOne();
        if (addressEntry) {
            mapIds = addressEntry.toMapIds;
        }
 
        if (!addressEntry || !mapIds || mapIds.length < 1) {
            return undefined;
        }
        return mapIds;
    }
 
    function userChange () {

        // When the user changes, either logs on or off, subscribe to ...
        var user = Meteor.user();
        var refTo, openWin;

        if (lastUser) {
            Meteor.subscribe('ClosedWindow',lastUser.username, mapId);
        }

        // Save the user for cleaning up when it changes
        lastUser = user;

        if (user) {

            //subscribe to address book
            Meteor.subscribe('reflectionToMapIds',ctx.project);

            //keep track of windows open
            Meteor.subscribe('OpenedWindow',user.username,ctx.project);
            // TODO: Create a listener to know when to save state ?

            window.onbeforeunload = function() {
                Meteor.subscribe('ClosedWindow',user.username,mapId);
            };
        }

        // Save the map ID for cleaning up when it changes
        mapId = ctx.project;
    }


    initReflect = function () {
 
        Tracker.autorun(userChange);
 
        // Give the subscriptions a chance to complete
        Meteor.setTimeout(function () {

            var $button = $('.reflectTrigger');
     
            // If there are no target maps for this map, we cannot reflect.
            toMapIds = getToMapIds();
            if (!toMapIds) {
                $button.addClass('disabled');
                return;
            }
     
            $button.removeClass('disabled');
            $dialog = $('#reflectDialog');

            // Define the dialog options & create an instance of DialogHex
            var opts = {
                title: title,
                buttons: [{ text: 'Reflect', click: mapIt }],
            };
            dialogHex = createDialogHex({
                $button: $button,
                $el: $dialog,
                opts: opts,
                showFx: show,
                hideFx: hide,
                buttonInitialized: true,
            });
     
            // Listen for the menu clicked
            add_tool("reflectTrigger", function(ev) {
                if (!$(ev.target).hasClass('disabled')) {
                    dialogHex.show();
                }
            }, 'Reflect nodes onto another map');
        }, 3000);
    }
})(app);
