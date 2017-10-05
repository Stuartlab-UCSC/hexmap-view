/**
 * Retrieve data.
 */

import Ajax from './ajax.js';
import Perform from '../common/perform.js';
import Util from '../common/util.js';

function dataTypesReceived (parsed, id) {

    // This is an array of rows with the following content:
    //	FirstAttribute		Layer6
    //	Continuous		Layer1	Layer2	Layer3 ...
    //	Binary	Layer4	Layer5	Layer6 ...
    //	Categorical	Layer7	Layer8	Layer9 ...
    Perform.log(id + '.tab_got');
    _.each(parsed, function (line) {
        if (line[0] === 'Binary') {
            ctx.bin_layers = line.slice(1);
        } else if (line[0] === 'Continuous') {
            ctx.cont_layers = line.slice(1);
        } else if (line[0] === 'Categorical') {
            ctx.cat_layers = line.slice(1);
        } else if (line[0] === 'FirstAttribute') {
            Session.set('first_layer', line.slice(1).join());
        } // skip any lines we don't know about
    });

    Session.set('initedLayerTypes', true);
}

function layerSummaryReceived (parsed, id) {

    // Layer index is tab-separated like so:
    // name file N-hex-value binary-ones layout0-clumpiness layout1-clumpiness
    //      ...

    // Initialize the layer list for sortable layers.
    Perform.log(id + '.tab_got');
    var sorted = [];
    
    // Initialize the static layer names-index lookup.
    ctx.static_layer_names = [];
    
    // If there are no static layers...
    if (parsed.length < 1) {
        Session.set('first_layer', 'noStaticLayers');
        Session.set('shortlist', []);
    }
    
    // Process each line of the file, one per layer.
    for (var i = 0; i < parsed.length; i++) {
    
        // Pull out the parts of the TSV entry
        // This is the name of the layer.
        var layer_name = parsed[i][0];
     
        // Skip any blank lines
        if (layer_name === "") { continue; }

        // Save this layer name in the static layer names-index
        // lookup. Extract the index, say '6', from a file name
        // like layer_6.tab.
        var file = parsed [i][1];
        ctx.static_layer_names[
            file.substring(
                file.lastIndexOf("_") + 1,
                file.lastIndexOf(".")
            )
        ] = parsed[i][0];
     
        // This array holds the layer's clumpiness scores under each layout,
        // by index. A greater clumpiness score indicates more clumpiness.
        var layer_clumpiness = [];
        for(var j = 4; j < parsed[i].length; j++) {
        
            // Each remaining column is the clumpiness score for a layout,
            // in layout order.
            // This is the layer's clumpiness score
            layer_clumpiness.push(parseFloat(parsed[i][j]));
        }
        
        // Number of hexes for which the layer has values
        var n = parseFloat(parsed[i][2]);
        
        // Add this to the global layers object.
        layers[layer_name] = {
        
            // The url from which to download this layers primary data.
            url: ctx.project + parsed[i][1],
            
            n: n,
            clumpiness_array: layer_clumpiness,
            
            // Clumpiness gets filled in with the appropriate value out
            // of the array, so out having a current layout index.
        };
        
        // Add this layer's data ID.
        // Remove any '.tab' extension because the Data object
        // does not want that there.
        var idx = parsed[i][1].indexOf('.tab');
        if (idx > -1 && idx === parsed[i][1].length - 4) {
            layers[layer_name].dataId = parsed[i][1].slice(0, -4);
        } else {
            layers[layer_name].dataId = parsed[i][1];
        }
        
        // Save the number of 1s, in a binary layer only
        var positives = parseFloat(parsed[i][3]);
        if (!(isNaN(positives))) {
            layers[layer_name].positives = positives;
        }
        
        // Add it to the sorted layer list.
        sorted.push(layer_name);
    }
    
    // Save sortable static (not dynamic) layer names.
    Session.set('sortedLayers', sorted);
    Session.set('layerIndexReceived', true);
}

function getLayoutNames () {

    // Download the layout names and save to the layouts array
    var id = 'layouts';
    Perform.log(id + '.tab_get');
    Ajax.get({
        id: id,
        ok404: true,
        success: function (parsed) {

            // This is an array of rows, with one element in each row:
            // layout name.
            Perform.log(id + '.tab_got');
            var layouts = [];
            for (var i = 0; i < parsed.length; i++) {
                var row = parsed[i];
                if (row.length === 0) {
                    // Skip any blank lines
                    continue;
                }
                layouts.push(row[0]);
            }
            
            // Determine the layout index whose map will be displayed.
            // Layout index takes precedent over layout name.
            // Layout name may be in the URL before we know the index.
            if (Session.equals('layoutIndex', undefined)) {
                Session.set('layoutIndex',
                    (Session.equals('layoutName', undefined) ? 0 :
                        layouts.indexOf(Session.get('layoutName')))
                );
            }
            Session.set('layouts', layouts);
        },
        error: function () {
            Util.projectNotFound(id);
        },
    });
}

function getDataTypes () {

    // Download info on which layer data types and first attribute.
    var id = 'Layer_Data_Types';
    Perform.log(id + '.tab_get');
    Ajax.get({
        id: id,
        error: function () {
            Util.projectNotFound(id);
        },
        success: function (parsed) {
            dataTypesReceived(parsed, id);
        },
    });
}
    
function getLayerSummary () {

    // Download the layer index.
    var id = 'layers';
    Perform.log(id + '.tab_get');
    Ajax.get({
        id: id,
        error: function () {
            Util.projectNotFound(id);
        },
        success: function (parsed) {
            layerSummaryReceived(parsed, id);
        },
    });
}

exports.init = function () {

    // Retrieve the data needed to determine the first layer to display.
    getLayerSummary();
    getDataTypes();
    getLayoutNames();
    Session.set('dataInitd', true);
    
    // TODO Authenticate & authorize for current project.
};
