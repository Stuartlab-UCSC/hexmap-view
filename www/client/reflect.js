// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';
    //Windows = new Mongo.Collection('Windows');

    var title = 'Reflect on Another Map',
        dialogHex,
        $button,
        $dialog,
        mapId,
        toMapId,
        toMapIds,
        dataType,
        dataTypes,
        selectionList,
        lastUser,
        subscribedToMaps = false,
        selectionSelected = '', // option selected from the selection list
        last_layer_names = [], // list of layer names from the last update //swat
        early_received_layers = [], // layers received before we're ready  //swat
        ready_to_receive_layers = false; // When we're ready to process received layers //swat
 
    function layers_received (layers) { //swat
        //console.log('layers recieved called with last layer_layer_names:',last_layer_names);
        //console.trace()
        // Find and handle new layers and removed layers
 
        // Find any new layers and add them to the shortlist
        var doc_layer_names = [];
        var new_layers = _.filter(layers, function (layer) {
            doc_layer_names.push(layer.layer_name);
            return (last_layer_names.indexOf(layer.layer_name) < 0);
        });
        //console.log('layers, new layers, doc layer names :', layers, new_layers, doc_layer_names);

        layer_post_office_receive_layers(new_layers);
        //console.trace();
        //console.log("layers from layers recived",layers);
        //console.log("new_layers from layers received" , new_layers);
        //layer_post_office_receive_layers(layers);

        // Find any layers removed and remove them from the shortlist
        _.each(last_layer_names, function (layer_name) {
            if (doc_layer_names.indexOf(layer_name) < 0) {
                update_shortlist(layer_name, true);
            }
        });

        last_layer_names = doc_layer_names;
    }

    Tracker.autorun(function(){
        var doc = LayerPostOffice.findOne({});
        //console.trace();
        //console.log('put in layers fired with doc:', doc);
        //var doc ={};
        //doc.layers = {};
        if (doc) {
            /*
             if (!ready_to_receive_layers) { // this never runs now, I think
             console.log('not ready to recieve layers, setting early_received_layers')
             early_received_layers = doc.layers;
             } else { */
            //console.log("reflect auto doc layers:", doc.layers);
            layers_received(doc.layers);
            //}
        }
    });
    /*
    Template.reflectT.helpers({ //swat
        dummy_element: function () {

            return 'dummy_element';
        },
    })
    */
    function show () {

        // Show the contents of the dialog, once per trigger button click
 
        // Create the target map selector
 
        // Put the data in the format the selector wants
        var mapIdData = [];
        toMapIds.forEach(function(mapId){
            mapIdData.push({id: mapId, text: mapId});
        });

        var $mapAnchor = $('#reflectDialog .mapIdAnchor');
        createOurSelect2($mapAnchor, {data: mapIdData}, toMapId);
 
        $mapAnchor.show();

        // Define the event handler for selecting in the list
        $mapAnchor.on('change', function (ev) {
            toMapId = ev.target.value;
            console.log('toMapId', toMapId);
        });

        // Create the layer name selector.
        selectionList = createLayerNameList($('#reflectDialog .layerNameListAnchor'),
                                    $('#reflectDialog .selectionListLabel'),
                                    selectionSelected);
        selectionList.enable(true, {binary: true});

        // Create the data type selector
 
        // Put the data in the format the selector wants
        var dataTypeData = [];
        dataTypes.forEach(function(type){
            dataTypeData.push({id: type, text: type});
        });

        var $dataTypeAnchor = $('#reflectDialog .dataTypeAnchor');
        createOurSelect2($dataTypeAnchor, {data: dataTypeData}, dataType);
 
        $dataTypeAnchor.show();

        // Define the event handler for selecting in the list
        $dataTypeAnchor.on('change', function (ev) {
            dataType = ev.target.value;
            console.log('data type selected:', dataType);
        });
    }

    function mapManager (operation, featOrSamp, nodeIds) {

        userId=Meteor.user().username;

        Meteor.call("mapManager",operation, userId, ctx.project, toMapId, featOrSamp,
                                 nodeIds, selectionSelected, function (error,success) {
            if(error){
                console.log(error);
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

    function tell_user_about_subset(have_data_count, request_count) {
 
        // Tell the user that not all of the nodes had data.
        var message = have_data_count.toSting() +
                            ' of ' +
                            request_count.toString() +
                            ' requested nodes have data to reflect.\n' +
                            'Reflect just those?';
        alert(message);
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
 
        // Request the map manager to reflect using these nodes,
        // and receive a count of nodes that had data.
        var have_data_count = mapManager('reflection', featOrSamp, nodeIds);
        banner('info', 'Your other map will update shortly.');
        hide();
 
        // Duncan,
        //   I guessed that you would want to return a count of nodes with
        //   data from this map manager request.
        //   I took the path of least resistence and just notify the user that
        //   not all nodes will be used in the reflection. So the user does not
        //   get a chance to cancel the request. We can change that to a
        //   cancel/OK question if that works better.
        //   I didn't test it either ;)
 
        // If some of the nodes don't have data, let the user know.
        if (have_data_count < nodeIds.length) {
            tell_user_about_subset(have_data_count, nodeIds.length);
        }
	}
 
    function hide() {
 
        // Free some things, then hide the dialog
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
 
            // We have map IDs, so initialize the selected target map
            // and enable the trigger to open the reflection dialog
            toMapId = toMapIds[0]
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
 
            // Duncan, I'll let you fill this in with a subscription or whatever.
            // For now I'll just return a couple for testing. And you should
            // initialize dataType something like I did for toMapId
            dataTypes = ['mRNA', 'CNV'];
            dataType = dataTypes[0];

            //keep track of windows open
            Meteor.subscribe('OpenedWindow',user.username,ctx.project);
            

            // Just before the page is closed, update the DB
            window.onbeforeunload = function() {
                Meteor.subscribe('ClosedWindow',user.username,mapId);
            };
        }

        // Save the map ID for cleaning up when it changes
        mapId = ctx.project;
    }
 
    function initReceiveReflectionLayers () { //swat
 
        // Initialize for receiving reflected layers
 
        // We cannot process the received layers until a few other things are
        // initialized, so the layers are saved until we are ready to receive
        if (early_received_layers) {
            layers_received(early_received_layers);
        }
        ready_to_receive_layers = true;
    }

    initReflect = function () {
 
        $button = $('.reflectTrigger');
        $dialog = $('#reflectDialog');
        Tracker.autorun(userChange);
        Tracker.autorun(layoutChange);
 
        initReceiveReflectionLayers(); //swat

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
