// download.js

import Ajax from './ajax.js';
import Pdf from '../viewport/pdf.js';
import Svg from '../viewport/svg.js';
import Tool from '../mapPage/tool.js';
import Util from '../common/util.js';

import '../viewport/pdf.html';

function initDownloadSelectTool () {

    // And a tool for exporting selections as lists of hexes
    // TODO this doesn't need to be modal, only tools mousing on the screen
    // need to be modal
    Tool.add("hexagonNames", function() {
        // Make the export form
        var export_form = $("<form/>").attr("title", 
            "Export Selection As List");
        
        export_form.append(
            $("<div/>").text("Select a selection to export:"));
        
        // Make a select box for picking from all selections.
        var select_box = $("<select/>");
        
        // Populate it with all existing selections
        for(var layer_name in layers) {
            if ((layers[layer_name].selection) ||
            (layers[layer_name].data && Util.is_continuous(layer_name))) {
                // This is a selection, so add it to the dropdown.
                select_box
                    .append($("<option/>")
                    .text(layer_name).attr("value", layer_name));
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
            if (!layers.hasOwnProperty('layer_name')) {

                // Not a real layer.
                // Probably just an empty select or something
                return;
            }

            var isContinuous = Util.is_continuous(layer_name);

            // This holds our list. We build it in a string so we can escape
            // it with one .text() call when adding it to the page.
            var exported = "";
            
            // Get the layer data to export
            var layer_data = layers[layer_name].data;
            for(var signature in layer_data) {
                if(layer_data[signature]) {
                    // It's selected, put it in
                    
                    if(exported !== "") {
                        // If there's already text, add a newline.
                        exported += "\n";
                    }
                    if (isContinuous){
                        //add the value
                        exported += signature + '\t' + layer_data[signature]
                    } else {
                        exported += signature;
                    }

                }
            }
            
            // Now we know all the signatures from the selection, so tell=
            // the page.
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
                Tool.activity(false);
            }
        });
    }, 'Export the selection as a list of hexagon IDs', 'mapShow');
}

function getDataUrl (prefix) {
    return HUB_URL + '/dataOk404/view/' + ctx.project
        + prefix + Session.get('layoutIndex') + '.tab';
}

exports.init = function () {

    // Add the link to the menu for XY coordinate download.
    var link = $('<a href=' + getDataUrl('xyPreSquiggle_') +
            ' title=' +
            '"Download xy positions of nodes before binning to hexagonal ' +
            'grid" download > XY Coordinates </>');
    $('.fileMenu .xyPreSquiggleAnchor').append(link);
    
    // Add the link to the menu for hexagon coordinate download.
    link = $('<a href=' + getDataUrl('assignments') +
        ' title="Download positions of nodes on the hexagonal grid"' +
        ' download > Hexagon Coordinates </>');
    $('.fileMenu .xyAssignmentAnchor').append(link);
}
