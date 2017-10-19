// layerLists.js
// Manage the layer lists.

import React from 'react';
import { render } from 'react-dom';
import Layer from '/imports/mapPage/longlist/layer.js';
import Select2 from '/imports/component/select2wrap.js';
import Shortlist from '/imports/mapPage/shortlist/shortlist.js';
import Sort from '/imports/mapPage/longlist/sort.js';

// How many layer results should we display at once?
var SEARCH_PAGE_SIZE = 10,
    $search;

function make_browse_ui(layer_name) {
    // Returns a jQuery element to represent the layer with the given name in
    // the browse panel.
    
    // This holds a jQuery element that's the root of the structure we're
    // building.
    var root = $("<div/>").addClass("layer-entry");
    root.data("layer-name", layer_name);
    
    // Put in the layer name in a div that makes it wrap.
    root.append($("<div/>").addClass("layer-name").text(layer_name));
    
    // Put in a layer metadata container div
    var metadata_container = $("<div/>");
    
    Layer.fill_metadata(metadata_container, layer_name);
    
    root.append(metadata_container);
    
    return root;
}

exports.update = function() {

    // Make the layer browse UI reflect the current list of layers in sorted
    // order.
    
    // Re-sort the sorted list that we maintain
    Sort.sort_layers();

    // Close the select if it was open, forcing the data to refresh when it
    // opens again.
    $("#search").select2("close");
};

function handleSelecting (event) {

    // The select2 id of the thing clicked (the layer's name) is event.val
    var layer_name = event.val;
    
    // User chose this layer. Add it to the global shortlist.
    Shortlist.ui_and_list_add(layer_name);
    
    // Don't actually change the selection.
    // This keeps the dropdown open when we click.
    event.preventDefault();
}

function query (query) {

    // Given a select2 query object, call query.callback with an object
    // with a "results" array.
    
    // This is the array of result objects we will be sending back.
    var results = [];

    // Get where we should start in the layer list, from select2's
    // infinite scrolling.
    var start_position = 0;
    if (query.context != undefined) {
        start_position = query.context;
    }

    var displayLayers = Session.get('displayLayers'),
        sortedLayers = Session.get('sortedLayers');
    for (var i = start_position; i < sortedLayers.length; i++) {

        // Check for the sort layer being in the display layers
        // and the search term in the layer name
        if (displayLayers.indexOf(sortedLayers[i]) > -1
            && sortedLayers[i].toLowerCase().indexOf(
            query.term.toLowerCase()) > -1) {
            
            // Query search term is in this layer's name. Add a select2
            // record to our results. Don't specify text: our custom
            // formatter looks up by ID and makes UI elements
            // dynamically.
            results.push({
                id: sortedLayers[i]
            });
            
            if (results.length >= SEARCH_PAGE_SIZE) {
            
                // Page is full. Send it on.
                break;
            }
            
        }
    }
    
    // Give the results back to select2 as the results parameter.
    query.callback({
        results: results,
        
        // Say there's more if we broke out of the loop.
        more: i < Session.get('sortedLayers').length,
        
        // If there are more results, start after where we left off.
        context: i + 1
    });
}

function formatResult (result) {
    
    // Given a select2 result record, the element that our results go
    // in, and the query used to get the result, return a jQuery element
    // that goes in the container to represent the result.
    
    // Get the layer name, and make the browse UI for it.
    return make_browse_ui(result.id);
}

exports.layerSummaryLoaded = function (parsed) {

    // Layer index is tab-separated like so:
    // name file N-hex-value binary-ones layout0-clumpiness layout1-clumpiness
    //      ...

    // Initialize the layer list for sortable layers.
    var sorted = [];
    
    // Initialize the static layer names-index lookup.
    ctx.static_layer_names = [];
    
    // If there are no static layers...
    if (parsed.length < 1) {
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
    
    // Initialize the display layers resulting from filtering to all layers.
    Session.set('displayLayers', Session.get('sortedLayers'));

    Session.set('layerSummaryLoaded', true);
};

exports.layerTypesReceived = function (parsed) {

    // This is an array of rows with the following content:
    //    FirstAttribute        Layer6
    //    Continuous        Layer1    Layer2    Layer3 ...
    //    Binary    Layer4    Layer5    Layer6 ...
    //    Categorical    Layer7    Layer8    Layer9 ...
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

    Session.set('layerTypesLoaded', true);
};

exports.init = function () {
    $search = $("#search");

    // Set up the layer search.
    render(
        <Select2
            // Options for the original non-react select2.
            select2options = {{
                data: {id: '', text: ''},
                placeholder: "Search Attributes...",
                width: '29em',
                value: null,
                query: query,
                formatResult: formatResult,
                dropdownCssClass: 'longlist',
            }}
            select2-selecting = {handleSelecting}
        />, $search[0]);
    
    // Make the dropdown close if there is a click anywhere on the screen
    // other than the dropdown and search box
    $(window).on('mousedown', function () {
        $("#search").select2("close");
    });
};
