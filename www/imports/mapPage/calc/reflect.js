// reflect.js
// This captures the user input to reflect a set of nodes on another map.

import Auth from '/imports/common/auth.js';
import DialogHex from '/imports/common/dialogHex.js';
import LayerNameList from '/imports/mapPage/shortlist/layerNameList.js';
import Tool from '/imports/mapPage/head/tool.js';
import Util from '/imports/common/util.js';

import './reflect.html';

var ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');
var ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
//'use strict';

var title = 'Reflect on Another Map',
    dialogHex,
    $link,
    $button,
    $dialog,
    mapId,
    toMapId,
    toMapIds,
    dataType,
    dataTypes,
    selectionList,
    subscribedToMaps = false,
    selectionSelected = ''; // option selected from the selection list

Template.reflectT.helpers({
    tStats: function () {
        return !Session.get('reflectRanked');
    },
    ranked: function () {
        return Session.get('reflectRanked');
    },
});

function hide() {
    // Free some things, then hide the dialog
    selectionSelected = selectionList.selected;
    selectionList.destroy();
    selectionList = undefined;
    dialogHex.hide();
}

function show () {

    // Show the contents of the dialog, once per trigger button click

    // Create the target map selector

    // Put the data in the format the selector wants
    var mapIdData = [];
    toMapIds.forEach(function(mapId){
        mapIdData.push({id: mapId, text: mapId});
    });

    var $mapAnchor = $('#reflectDialog .mapIdAnchor');
    Util.createOurSelect2($mapAnchor, {data: mapIdData}, toMapId);

    $mapAnchor.show();

    // Define the event handler for selecting in the list
    $mapAnchor.on('change', function (ev) {
        toMapId = ev.target.value;
    });

    // Create the layer name selector.
    selectionList = LayerNameList.create(
                                $('#reflectDialog .layerNameListAnchor'),
                                $('#reflectDialog .selectionListLabel'),
                                selectionSelected);
       
    // Only include binary data types, which also includes node selections.
    selectionList.enable(true, {binary: true});

    // Create the data type selector

    // Put the data in the format the selector wants
    var dataTypeData = [];
    dataTypes.forEach(function(type){
        dataTypeData.push({id: type, text: type});
    });

    var $dataTypeAnchor = $('#reflectDialog .dataTypeAnchor');
    Util.createOurSelect2($dataTypeAnchor, {data: dataTypeData}, dataType);

    $dataTypeAnchor.show();

    $link = $("<a href='' target='_blank' class='ui-button-text'> Reflect </a>");
    var $button = $(".ui-dialog button");
    var $span = $("button").find("span");
    $span.detach();
    $button.append($link);

    // Define the event handler for selecting in the list
    $dataTypeAnchor.on('change', function (ev) {
        dataType = ev.target.value;
        //console.log('data type selected:', dataType);
    });
    
    // Event handler for the Tstats vs. ranked.
    $('#reflectDialog .ranked').on('change', function (ev) {
    
        //console.log('ranked ev.target.checked', ev.target.checked);
        
        Session.set('reflectRanked', ev.target.checked);
    });
    $('#reflectDialog .tStats').on('change', function (ev) {
    
        //console.log('tStats ev.target.checked', ev.target.checked);
        
        Session.set('reflectRanked', !ev.target.checked);
    });
}

function criteriaCheck () {

    // Bail with a message if the required data needed is not present.
    if (!(Session.get('reflectCriteria'))) {
        dialogHex.hide();
        Util.banner('error', 'Sorry, the required data to ' +
        'reflect onto another map is not available for this map.');
        return false;
    }
    return true;
}

function preShow () {

    // First check for this user having the credentials to do this.
    var good = Auth.credentialCheck('to reflect onto another map');
    if (good) {
    
        // Then check for the map having the proper criteria to do this.
        // Does this map have the pre-computed data needed to do this?
        good = criteriaCheck();
    }
    return good;
}

function get_reflection_count(operation,dataType,toMapId,nodeIds) {
    //grab the available nodes from database
    var available_nodes = ManagerFileCabinet.findOne({operation: operation,
                                                      datatype:dataType,
                                                      toMapId: toMapId
                                                       }).available_nodes;
    //make object for easy 'in' operation
    //nodes must be of type string for this to work ...?

    //console.log(available_nodes);
    //console.log(nodeIds);
    var in_count=0;
    try {
        _.each(nodeIds,function(node){
            if (available_nodes.indexOf(node) !== -1 ){
                 in_count+=1;
            }
        });
    } catch (e) {
    
        // If there are no available nodes, that will be reported later.
        jQuery.noop();
    }

    return in_count;
}
function mapManager (operation, nodeIds) {

    var userId = Meteor.user().username;
    var rankCategories = Session.get('reflectRanked')
    //console.log("reflect MapMan nodeIds:",nodeIds,dataType);
    //only perform reflection if there if there is some intersect of
    // reflection nodes and selected nodes
    if (get_reflection_count(operation, dataType, toMapId, nodeIds) !== 0) {
        Meteor.call("mapManager", operation,
            dataType,
            userId,
            ctx.project,
            toMapId,
            nodeIds,
            rankCategories,
            selectionSelected,
            //Session.get('reflectRanked'),
            function (error) {
                if (error) {
                    Util.banner('error', 'Unknown server error.');
                    console.log(error);
                } else {
                    console.log('Mapmanager: Operation ' +
                        operation + ' success');
                }
            });
        //show a message to user
        Util.banner('info', 'Your other map will update shortly.');
        hide();
        var pathPeices = toMapId.split('/');
        var major = pathPeices[0];
        var minor = pathPeices[1];

        var url = URL_BASE + '/?p=' + major + '.' + minor;
        $link.attr("href", url);

        return get_reflection_count(operation, dataType, toMapId, nodeIds);
    }
}

function tell_user_about_subset(have_data_count, request_count) {

    // Tell the user that not all of the nodes had data.
    var message = have_data_count.toString() +
                        ' of ' +
                        request_count.toString() +
                        ' requested nodes have data to reflect.\n' +
                        'Reflection computed with only those nodes.';
    if (have_data_count === 0){
        message += ' Therefore reflection was not computed.';
    }
    alert(message);
}

function mapIt () {
    // Gather the user input and call the map manager.
    selectionSelected = selectionList.selected;
    
    // Bail if no selection is selected
    if (_.isUndefined(selectionSelected)) { return; }

    var nodeIds = [];
    _.each(layers[selectionList.selected].data,
        function (val, key) {
            if (val === 1)  { nodeIds.push(key); }
        }
    );

    // Request the map manager to reflect using these nodes,
    // and receive a count of nodes that had data.
    var have_data_count = mapManager('reflection', nodeIds);
   
    // If some of the nodes don't have data, let the user know.
    if (have_data_count < nodeIds.length) {
        tell_user_about_subset(have_data_count, nodeIds.length);
    }
}

function getReflectionInfo() {
    // grab array for possible maps to reflect to
    var addressEntry = ManagerAddressBook.findOne();
    //console.log(addressEntry);
    if (addressEntry) {
        toMapIds = addressEntry.toMapIds;
        dataTypes = addressEntry.datatypes;
    }

    if (addressEntry && toMapIds && toMapIds.length > 0) {
        // We have map IDs, so initialize the selected target map
        // and enable the trigger to open the reflection dialog
        toMapId = toMapIds[0];
        dataType= dataTypes[0];
        Session.set('reflectCriteria', true);
    } else {
        Session.set('reflectCriteria', false);
    }
}

function userChange () {
    // When the user changes, either logs on or off, subscribe to ...
    var user = Meteor.user();

    // Initialize the reflection criteria found flag.
    Session.set('reflectCriteria', false);
    
    if (user) {

        //subscribes to fill in available datatypes and target map ids
        // and which node Ids are available in any given refleciton
        if (!subscribedToMaps) {
            Meteor.subscribe('reflectionToMapIds',
                              ctx.project,
                              getReflectionInfo
                             );
            Meteor.subscribe('ManagerFileCabinet',ctx.project);
            subscribedToMaps = true;
        }
    }
    // Save the map ID for cleaning up when it changes
    mapId = ctx.project;
}

exports.init = function () {

    $button = $('.reflectTrigger');
    $dialog = $('#reflectDialog');
    
    Meteor.autorun(userChange);

    if (_.isUndefined(Session.get('reflectRanked'))) {
        Session.set('reflectRanked', false);
    }

    // Define the dialog options & create an instance of DialogHex
    var opts = {
        title: title,
        buttons: [{ text: 'Reflect', click: mapIt }],
    };
    dialogHex = DialogHex.create({
        $el: $dialog,
        opts: opts,
        preShowFx: preShow,
        showFx: show,
        hideFx: hide,
        helpAnchor: '/help/reflect.html',
    });

    // Listen for the menu clicked
    Tool.add("reflectTrigger", function(ev) {
        if (!$(ev.target).hasClass('disabled')) {
            dialogHex.show();
        }
    }, 'Reflect nodes onto another map');
}
