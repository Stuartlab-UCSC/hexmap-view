// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';
    Windows = new Mongo.Collection('Windows');

    var title = 'Reflect on Another Map',
        dialogHex,
        $button,
        $dialog,
        mapId,
        mapIdList,
        toMapId,
        toMapIds,
        selectionList,
        toMapIdList,
        lastUser,
        subscribedToMaps = false,
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
 
        // TODO this should be set to the last selected toMapId
        toMapId = toMapIds[0]
        $mapAnchor.select2("val", toMapId);
 
        console.log('toMapId', toMapId);

        $mapAnchor.show();

        // The selection selector.
        selectionList = createLayerNameList($('#reflectDialog .layerNameListAnchor'),
                                    $('#reflectDialog .selectionListLabel'),
                                    selectionSelected);
        selectionList.enable(true, {binary: true});

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
 
        // OnReady function for subscription to reflectionToMapIds.

        // For now, only allow mRNA, the first layout for reflection
        // so keep the menu option disabled
        if (!Session.equals('layoutIndex', 0)) return;
 
        // grab array for possible maps to reflect to
        var addressEntry = ManagerAddressBook.findOne();
        if (addressEntry) {
            toMapIds = addressEntry.toMapIds;
        }
 
        if (addressEntry && toMapIds && toMapIds.length > 0) {
            $button.removeClass('disabled');
        } else {
            $button.addClass('disabled');
        }
    }
 
    function layoutChange () {
 
        // For now we only have reflect available on layout 0: mRNA
        var layoutIndex = Session.get('layoutIndex');
 
        if (layoutIndex < 1 && toMapIds && toMapIds.length > 0) {
            $button.removeClass('disabled');
        } else {
            $button.addClass('disabled');
        }
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
            if (!subscribedToMaps) {
                Meteor.subscribe('reflectionToMapIds',ctx.project, getToMapIds);
                subscribedToMaps = true;
            }

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
 
        $button = $('.reflectTrigger');
        $dialog = $('#reflectDialog');
        Tracker.autorun(userChange);
        Tracker.autorun(layoutChange);

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
    }
})(app);
