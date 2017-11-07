// overlayNode.js

// This allows the user to view new node(s) placement overlaid on an existing map.

import Ajax from '/imports/mapPage/data/ajax.js';
import DialogHex from '/imports/common/dialogHex.js';
import Layout from '/imports/mapPage/head/layout.js';
import OverlayNodes from './overlayNodes.js';
import State from '/imports/common/state.js';
import Tool from '/imports/mapPage/head/tool.js';
import Util from '/imports/common/util.js';

import './overlayNode.html';

var title = 'Place New Nodes',
    dialogHex,
    $dialog;

Template.navBarT.helpers({
    overlayNodeRemove: function () {
        return Session.get('overlayNodes') ? 'block' : 'none';
    },
});

function validateNodeData (data) {

    if (_.isUndefined(data) || _.isNull(data)) {
        Util.banner('error',
            'Nodes are undefined, please upload a file of the requested format.');
        return false;
    }
    if (data.length < 1) {
        Util.banner('error',
            'Error: the file is empty.');
        return false;
    }
    return true;
}

function showNewNodes (result) {
    nodeNames = Object.keys(result.nodes);
    State.bookmarkReload(result.nodes[nodeNames[0]].url);
}

function doIt (tsv) {

    // Build the rest of the data needed to locate these nodes on the map,
    // then call the computation utility.
    var nodeData = Util.parseTsv(tsv);
    var valid = validateNodeData(nodeData);
    if (!valid) {
        return;
    }

    //Util.banner('info', 'Nodes will appear when location calculations are complete.');

    // Convert the node data into an object

    // Save the node names.
    var data = {};
    var nodes = []
    _.each(nodeData[0].slice(1), function (node) {
        data[node] = {}
        nodes.push(node);
    });

    // For each feature line, add its data to the proper node object
    _.each(nodeData.slice(1), function (row) {
        var feature = row[0];
        
        // For each node, add this feature value.
         _.each(nodes, function (node, i) {
            data[node][feature] = row[i + 1];
        });
    });
    nodeData = undefined; // This could be big, so free it from memory

    // Build the rest of the options to pass to the computation utility.
    var opts = {
        map: Util.getHumanProject(ctx.project),
        layout: Layout.findCurrentName(),
        nodes: data,
    };
    if (Meteor.user()) {
        opts.email = Meteor.user().username;
    }

    Ajax.query('overlayNodes', opts,
        function (result) {
            Util.banner('info', 'Your nodes are about to drop onto the map');
            showNewNodes(result);
        },
        function (error) {
            Session.set('mapSnake', false);
            Util.banner('error', 'when adding a new node: ' + error);
        },
    );

    // Hide this dialog
    hide();
}

function gotFilename (event) {

    // When a file is selected, read it in
    Session.set('mapSnake', true);

    // Make a FileReader to read the file
    var reader = new FileReader();

    reader.onload = function(read_event) {

        // When we read with readAsText, we get a string.
        doIt(reader.result);
    };

    reader.onerror = function(read_event) {
        Util.banner('error', 'Error reading file:' + file.filename);
    };
    reader.onabort = function(read_event) {
        Util.banner('error', 'Aborted reading file: ' + file.filename);
    };

    try {
    
        // Read the file.
        reader.readAsText(event.target.files[0]);
    } catch (error) {

        // The user most likely didn't pick a file.
        Session.set('mapSnake', false);
        Util.banner('error', 'you need to select a file.');
    }
}

function show () {

    // Show the contents of the dialog, once per trigger button click

    // Deselect the tool because we don't need to listen to map events.
    Tool.activity(false);

    // Attach event listeners
    $dialog.find('.file').change(gotFilename);
}

function criteriaCheck () {

    // Bail with a message if the required data needed is not present.
    var placeNodeCriteria = false,
        meta = Session.get('mapMeta');
    // If there is cluster data, we've
    // met the data criteria to run placeNode.
    var layout = Layout.findCurrentName();
    if (meta.layouts &&
        meta.layouts[layout] &&
        meta.layouts[layout].clusterData) {
        placeNodeCriteria = true;
    }
    if (!placeNodeCriteria) {
        Util.banner('error', 'Sorry, the required data to ' +
        'place new nodes is not available for this map.');
        return false;
    } else if (! Session.equals('mapView', 'honeycomb')) {
        Util.banner('error', 'Sorry, nodes may only be placed in the ' +
            '"Hexagonal Grid" view. (Selectable under the "View menu".)');
        return false;
    } else {
        return true;
    }
}

function preShow () {

    // First check for this user having the credentials to do this.
    var good = Util.credentialCheck('to place new nodes');
    if (good) {

        // Then check for the map having the proper criteria to do this.
        // Does this map and layout have the data needed to place nodes?
        good = criteriaCheck();
    }
    return good;
}

function hide() {

    // Hide the dialog after cleaning up
    dialogHex.hide();
}

function createWindow() {

    // Don't know why this function is not picked up below.
    dialogHex.show();
}

exports.init = function () {

    $dialog = $('#overlayNode');
    var $trigger = $('#navBar .overlayNode');

    // Create an instance of DialogHex
    var opts = { title: title };
    dialogHex = DialogHex.create({
        $el: $dialog,
        opts: opts,
        preShowFx: preShow,
        showFx: show,
        hideFx: hide,
        helpAnchor: '/help/placeNode.html',
    });

    // Create a link from the menu
    Tool.add('overlayNode', createWindow, title);

    // Add a handler for the remove menu option
    $('#navBar .overlayNodeRemove').on('click', OverlayNodes.remove);
}
