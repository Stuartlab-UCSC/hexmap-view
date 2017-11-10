// download.js

import Pdf from '/imports/mapPage/viewport/pdf.js';
import Svg from '/imports/mapPage/viewport/svg.js';
import Tool from '/imports/mapPage/head/tool.js';
import Util from '/imports/common/util.js';

import '/imports/mapPage/viewport/pdf.html';
import Colors from '/imports/mapPage/color/colorEdit.js';
import Shortlist from '/imports/mapPage/shortlist/shortlist.js';

function initDownloadSelectTool () {

    // And a tool for exporting selections as lists of hexes
    // TODO this doesn't need to be modal, only tools mousing on the screen
    // need to be modal
    Tool.add("hexagonNames", function() {
        // Make the export form
        var export_form = $("<form/>").attr("title", "Attribute Download");
        
        //export_form.append(
            //$("<div/>").text("Select an attribute to download:"));
        
        // Make a select box for picking from all selections.
        var WIDTH = 275;
        var select_box = $("<select/>").width(WIDTH+6);
        
        // Populate it with all entries in the shortlist.
        var activeLayers = Shortlist.getAllLayerNames();
        activeLayers.map(
            function(layerName) {
                select_box
                    .append($("<option/>")
                        .text(layerName).attr("value", layerName));
        });

        
        export_form.append(select_box);
        
        //export_form.append($("<div/>").text("Exported data:"));
        
        // A big text box
        var text_area = $("<textarea/>").addClass("export")
            .width(WIDTH)
            .height(WIDTH);
        text_area.prop("readonly", true);
            export_form.append(text_area);

        // Add a download as file link. The "download" attribute makes the
        // browser save it, and the href data URI holds the data.
        var download_link = $("<a/>").attr("download", "attribute.txt");
        download_link.attr("href", "data:text/plain;base64,");
        download_link.html("<button type='button'>Download</button>");
        download_link.css({
            "position": "relative",
            "left": "67%",
            });

        //download_link.text("Download");
        
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
            if (!layers.hasOwnProperty(layer_name)) {

                // Not a real layer.
                // Probably just an empty select or something
                return;
            }

            var isContinuous = Util.is_continuous(layer_name);
            var isCategorical = Util.is_categorical(layer_name);
            var isBinary = Util.is_binary(layer_name);
            var isSelection = layers[layer_name].selection;
            
            // This holds our list. We build it in a string so we can escape
            // it with one .text() call when adding it to the page.
            var exported = "";
            
            // Get the layer data to export
            var layer_data = layers[layer_name].data;
            for(var signature in layer_data) {
                if(!_.isUndefined(layer_data[signature])) {
                    // It's selected, put it in
                    
                    if(exported !== "") {
                        // If there's already text, add a newline.
                        exported += "\n";
                    }

                    if (isSelection) {
                        exported += signature;
                    } else if (isContinuous || isBinary){
                        //add the value
                        exported += signature + '\t' + layer_data[signature]
                    } else if (isCategorical) {
                        var catString = Colors.getCategoryString(
                            layer_name,
                            layer_data[signature]
                        );
                        exported += signature + '\t' + catString
                    } else {
                        // If hit not good.
                        // TODO: throw an error or do something instructive
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

exports.save = function (filename, data) {
    var blob = new Blob([data], {type: 'text/csv'});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

exports.init = function () {
    initDownloadSelectTool();
    Svg.init();
    Pdf.init();

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
