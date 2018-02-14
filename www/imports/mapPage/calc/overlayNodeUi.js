// overlayNode.js

// This allows the user to view new node(s) placement overlaid on an existing map.

import ajax from '/imports/mapPage/data/ajax';
import auth from '/imports/common/auth';
import DialogHex from '/imports/common/DialogHex';
import layout from '/imports/mapPage/head/layout';
import overlayNodes from './overlayNodes';
import rx from '/imports/common/rx';
import state from '/imports/common/state';
import tool from '/imports/mapPage/head/tool';
import util from '/imports/common/util';

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
        util.banner('error',
            'Nodes are undefined, please upload a file of the requested ' +
                'format.');
        return false;
    }
    if (data.length < 1) {
        util.banner('error', 'Error: the file is empty.');
        return false;
    }
    return true;
}

function httpError (result) {
    rx.set('placeNode.running.done');
    util.banner('error', 'when calculating position of a new node: ' +
        result.error, result.stackTrace);
}

function getJobStatus (jobId, jobStatusUrl) {

    // Check status of the job and display when complete.
    ajax.getJobStatus(jobId, jobStatusUrl,
        function (result) {
            if (result['status'] === 'Success') {
                var nodes = result.result.nodes;
                var nodeNames = Object.keys(nodes);
                var url = nodes[Object.keys(nodes)[0]].url;
                 util.reportJobSuccess(url);
            } else {
                httpError(result.result);
            }
        },
        httpError,
    )
}

function doIt (tsv) {

    // Build the rest of the data needed to locate these nodes on the map,
    // then call the computation utility.
    var nodeData = util.parseTsv(tsv);
    var valid = validateNodeData(nodeData);
    if (!valid) {
        return;
    }

    util.banner('info', 'Nodes will appear when location calculations are ' +
        'complete.');

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
        map: util.getHumanProject(ctx.project),
        layout: layout.findCurrentName(),
        nodes: data,
    };
    if (Meteor.user()) {
        opts.email = Meteor.user().username;
    }

    // Add this job to the calc server.
    ajax.query('placeNode', opts,
        function (result) {
            getJobStatus(result.jobId, result.jobStatusUrl);
        },
        function (result) {
            util.banner('error', 'when adding a new node: ' + result.error,
                result.stackTrace);
        },
    );

    hide();
    rx.set('placeNode.running.done');
    util.reportJobSubmitted();
}

function gotFilename (event) {

    // When a file is selected, read it in
    rx.set('placeNode.running.now');

    // Make a FileReader to read the file
    var reader = new FileReader();

    reader.onload = function(read_event) {

        // When we read with readAsText, we get a string.
        doIt(reader.result);
    };

    reader.onerror = function(read_event) {
        rx.set('placeNode.running.done');
        util.banner('error', 'Error reading file:' + file.filename);
    };
    reader.onabort = function(read_event) {
        rx.set('placeNode.running.done');
        util.banner('error', 'Aborted reading file: ' + file.filename);
    };

    try {
    
        // Read the file.
        reader.readAsText(event.target.files[0]);
    } catch (error) {

        // The user most likely didn't pick a file.
        rx.set('placeNode.running.done');
        util.banner('error', 'you need to select a file.');
    }
}

function show () {

    // Show the contents of the dialog, once per trigger button click

    // Deselect the tool because we don't need to listen to map events.
    tool.activity(false);

    // Attach event listeners
    $dialog.find('.file').change(gotFilename);
}

function criteriaCheck () {

    // Bail with a message if the required data needed is not present.
    var placeNodeCriteria = false,
        meta = Session.get('mapMeta');
    // If there is cluster data, we've
    // met the data criteria to run placeNode.
    var name = layout.findCurrentName();
    if (meta.layouts &&
        meta.layouts[name] &&
        meta.layouts[name].clusterData) {
        placeNodeCriteria = true;
    }
    if (!placeNodeCriteria) {
        util.banner('error', 'Sorry, the required data to ' +
        'place new nodes is not available for this map.');
        return false;
    } else if (! Session.equals('mapView', 'honeycomb')) {
        util.banner('error', 'Sorry, nodes may only be placed in the ' +
            '"Hexagonal Grid" view. (Selectable under the "View menu".)');
        return false;
    } else {
        return true;
    }
}

function preShow () {

    // First check for this user having the credentials to do this.
    var good = auth.credentialCheck('to place new nodes');
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
    tool.add('overlayNode', createWindow, title);

    // Add a handler for the remove menu option
    $('#navBar .overlayNodeRemove').on('click', overlayNodes.remove);
}
