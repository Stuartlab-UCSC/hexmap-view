// overlayNode.js

// This allows the user to view new node(s) placement overlaid on an existing map.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'New Nodes vs. Background',
        dialogHex,
        $dialog;

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
        bookmarkReload(result.bookmarks[0]);
    }
 
    function doIt (tsv) {

        // Build the rest of the data needed to locate these nodes on the map,
        // then call the computation utility.
        var nodeData = tsvParseRows(tsv);
        var valid = validateNodeData(nodeData);
        if (!valid) {
            return;
        }

        banner('info', 'Nodes will appear when location calculations are complete.');
 
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

        Meteor.call('overlayNode', opts,
            function (error, result) {
                if (error) {
                    banner('error', error);
                } else {
                    showNewNodes(result);
                }
            }
        );
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
        var $trigger = $('#menu_overlayNode');
 
        // Create an instance of DialogHex
        var opts = { title: title };
        dialogHex = createDialogHex($('#overlayNodeTrigger'), $dialog, opts,
            show, hide, true);
 
        // Create a link from the menu
        add_tool('overlayNode', createWindow, title);
 
        // Enable/Disable the menu option whenever the username changes,
        // including log out.
        Meteor.autorun(function() {
            var user = Meteor.user();
            
            // Only logged in users get to do this because we use their username
            // to send an email.
            if (user) {
                $trigger.removeClass('disabled');
            } else {
                $trigger.addClass('disabled');
            }
        });

    }
})(app);
