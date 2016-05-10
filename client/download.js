// tools.js: Code to run all the tools in the menu bar.
// References globals in hexagram.js to actually do the tools' work.

// To add a tool:
// * Make a $(function() {...}); block to hold your code.
// * Add a tool with add_tool with your tool code as the callback.
// * Add at least one tool listener with add_tool_listener. Give it cleanup code
//   if necessary to remove temporary UI elements.
// * Make sure to call tool_activity with false when your tool's normal
//   workflow completes, so that the infowindow can use click events again.
//   (it got set to your tool's name by the code prepended to your callback).

var app = app || {}; // jshint ignore:line

(function (hex) {
    //'use strict';

    initDownloadSelectTool = function () {

        // And a tool for exporting selections as lists of hexes
        // TODO this doesn't need to be modal, only tools mousing on the screen
        // need to be modal
        add_tool("hexagonNames", function() {
            // Make the export form
            var export_form = $("<form/>").attr("title", 
                "Export Selection As List");
            
            export_form.append($("<div/>").text("Select a selection to export:"));
            
            // Make a select box for picking from all selections.
            var select_box = $("<select/>");
            
            // Populate it with all existing selections
            for(var layer_name in layers) {
                if(layers[layer_name].selection) {
                    // This is a selection, so add it to the dropdown.
                    select_box.append($("<option/>").text(layer_name).attr("value",
                        layer_name));
                }
            }
            
            export_form.append(select_box);
            
            export_form.append($("<div/>").text("Exported data:"));
            
            // A big text box
            var text_area = $("<textarea/>").addClass("export");
            text_area.prop("readonly", true);
                export_form.append(text_area);

            // Add a download as file link. The "download" attribute makes the
            // browser save it, and the href data URI holds the data.
            var download_link = $("<a/>").attr("download", "selection.txt");
            download_link.attr("href", "data:text/plain;base64,");
            download_link.text("Download As Text");
            
            export_form.append(download_link);
            
            text_area.focus(function() {
                // Select all on focus.
                
                $(this).select();
            });
            
            text_area.mouseup(function(event) {
                // Don't change selection on mouseup. See
                // http://stackoverflow.com/a/5797700/402891 and
                // http://stackoverflow.com/q/3380458/402891
                event.preventDefault();
            });
            
            select_box.change(function() {
                // Update the text area with the list of hexes in the selected
                // layer.
                
                // Get the layer name.
                var layer_name = select_box.val();
                if(!have_layer(layer_name)) {
                    // Not a real layer.
                    // Probably just an empty select or something
                    return;
                }
                
                // This holds our list. We build it in a string so we can escape it
                // with one .text() call when adding it to the page.
                var exported = "";
                
                // Get the layer data to export
                var layer_data = layers[layer_name].data;
                for(var signature in layer_data) {
                    if(layer_data[signature]) {
                        // It's selected, put it in
                        
                        if(exported != "") {
                            // If there's already text, add a newline.
                            exported += "\n";
                        }
                        
                        exported += signature;
                    }
                }
                
                // Now we know all the signatures from the selection, so tell the
                // page.
                text_area.text(exported);
                
                // Also fill in the data URI for saving. We use the handy
                // window.bota encoding function.
                download_link.attr("href", "data:text/plain;base64," + 
                    window.btoa(exported));
            });
            
            // Trigger the change event on the select box for the first selected
            // thing, if any.
            select_box.change();
            
            export_form.dialog({
                dialogClass: 'dialog',
                modal: true,
                width: '20em',
                close: function() {
                    // They didn't want to use this tool.
                        tool_activity(false);
                }
            });
        }, 'Export the selection as a list of hexagons', 'mapShow');
    }

    function xyPreSquiggle_click(event) {

        // Initialize for the xy pre-squiggle positions file
        var file = 'xyPreSquiggle_' + Session.get('layoutIndex') +'.tab';
 
        Meteor.call('getTsvFile', file, ctx.project, true,
            function (error, tsv) {
            if (error || tsv.slice(0,5) === 'Error') {
                banner('error', 'Sorry, that XY position file cannot be found.');
            } else {
                $(event.target).attr({
                    'href': 'data:text/plain;base64,' + window.btoa(tsv),
                    'download': file,
                });
            }
        });
    }

    initDownload = function () {
 
        if (Session.equals('page', 'mapPage')) {
            initDownloadSelectTool();
            initPdf();
            initSvg();
        }
        $('#xyPreSquiggle').on('click', xyPreSquiggle_click);
    }

})(app);

