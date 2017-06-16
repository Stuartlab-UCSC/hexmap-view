// overlayNode.js

// This allows the user to view new node(s) placement overlaid on an existing map.

var app = app || {};

(function (hex) {
    //'use strict';

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
            banner('error',
                'Nodes are undefined, please upload a file of the requested format.');
            return false;
        }
        if (data.length < 1) {
            banner('error',
                'Error: the file is empty.');
            return false;
        }
        return true;
    }
 
    function showNewNodes (result) {
        nodeNames = Object.keys(result.nodes);
        Hex.bookmarkReload(result.nodes[nodeNames[0]].url);
    }
 
    function doIt (tsv) {

        // Build the rest of the data needed to locate these nodes on the map,
        // then call the computation utility.
        var nodeData = tsvParseRows(tsv);
        var valid = validateNodeData(nodeData);
        if (!valid) {
            return;
        }

        //banner('info', 'Nodes will appear when location calculations are complete.');
 
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
            map: getHumanProject(ctx.project),
            layout: Session.get('layouts')[Session.get('layoutIndex')],
            nodes: data,
        };
        if (Meteor.user()) {
            opts.email = Meteor.user().username;
        }

        var preText = 'When adding a new node: ';
        $.ajax({
            type: 'POST',
            url: HUB_URL + '/query/overlayNodes',
            contentType: "application/json", // sending json
            dataType: 'json', // expects json returned
            data: JSON.stringify(opts),
            success:  function (result) {
                banner('info', 'Your nodes are about to drop onto the map');
                showNewNodes(result);
            },
            error: function (error) {
                if (error.responseJSON && error.responseJSON.error) {
                    banner('error', preText + error.responseJSON.error);
                } else {
                    banner('error', preText + 'Unknown server error');
                }
            }
        });

        // Hide this dialog
        hide();
	}
 
    function gotFilename (event) {
 
        // When a file is selected, read it in
 
        // Make a FileReader to read the file
        var reader = new FileReader();
 
        reader.onload = function(read_event) {

            // When we read with readAsText, we get a string.
            doIt(reader.result);
        };

        reader.onerror = function(read_event) {
            banner('error', 'Error reading file:' + file.filename);
        };
        reader.onabort = function(read_event) {
            banner('error', 'Aborted reading file: ' + file.filename);
        };
        
        // Read the file, and, when it comes in, stick it in the textbox.
        reader.readAsText(event.target.files[0]);
    }
 
    function show () {
 
        // Show the contents of the dialog, once per trigger button click
 
        // Deselect the tool because we don't need to listen to map events.
        tool_activity(false);
 
        // Attach event listeners
        $dialog.find('.file').change(gotFilename);
    }
 
    function criteriaCheck () {
    
        // Bail with a message if the required data needed is not present.
        if (!(Session.get('placeNodeCriteria'))) {
            dialogHex.hide();
            Util.banner('Data not available', 'Sorry, the required data to ' +
            'place new nodes is not available for this map.');
            return false;
        }
        return true;
    }

    function preShow () {
        var good = criteriaCheck();
        if (good) {
            good = Util.credentialCheck('to place new nodes');
        }
        return good;
    }
 
    function hide() {
 
        // Hide the dialog after cleaning up
        $dialog.off('change', '.file');
        dialogHex.hide();
    }
 
    function createWindow() {
 
        // Don't know why this function is not picked up below.
        dialogHex.show();
    }
 
    initOverlayNodeUi = function () {

        $dialog = $('#overlayNode');
        var $trigger = $('#navBar .overlayNode');
 
        // Create an instance of DialogHex
        var opts = { title: title };
        dialogHex = createDialogHex({
            $el: $dialog,
            opts: opts,
            preShowFx: preShow,
            showFx: show,
            hideFx: hide,
            helpAnchor: '/help/placeNode.html',
        });
 
        // Create a link from the menu
        add_tool('overlayNode', createWindow, title);
 
        // Add a handler for the remove menu option
        $('#navBar .overlayNodeRemove').on('click', removeOverlayNodes);
    }
})(app);
