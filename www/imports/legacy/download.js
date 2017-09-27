// download.js

import Ajax from '/imports/ajax.js';
import Pdf from '/imports/legacy/pdf.js';
import Svg from '/imports/legacy/svg.js';
import Tool from '/imports/legacy/tool.js';
import Util from '/imports/legacy/util.js';

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

function menu_mousedown(type) {
    var id = type + Session.get('layoutIndex')

    // get the file.
    Ajax.get({
        id: id,
        raw: true,
        success: function(data) {
        
            // Download the file to the user
            exports.save(id, data);
        },
        error: function(error) {
            Util.banner('error', 'while downloading XY coordinates: ' +
                error );
        },
    });
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
    if (Session.equals('page', 'mapPage')) {
        initDownloadSelectTool();
        Pdf.init();
        Svg.init();
    }
    $('.fileMenu .xyPreSquiggle').on('click', function (ev) {
        menu_mousedown('xyPreSquiggle_');
    });
    $('.fileMenu .xyAssignment').on('click', function (ev) {
        menu_mousedown('assignments');
    });
}