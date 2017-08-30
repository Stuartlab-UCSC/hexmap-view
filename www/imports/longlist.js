// layerLists.js
// Manage the layer lists.

import React, { Component } from 'react';
import { render } from 'react-dom';
import Select2 from './select2React.js';

import Longlist from './longlist.js';

// How many layer results should we display at once?
var SEARCH_PAGE_SIZE = 10,
    $search,
    reactComponent;

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
    sort_layers();

    // Close the select if it was open, forcing the data to refresh when it
    // opens again.
    $("#search").select2("close");
}

function handleSelecting (event) {

    // The select2 id of the thing clicked (the layer's name) is event.val
    var layer_name = event.val;
    
    // User chose this layer. Add it to the global shortlist.
    Shortlist.ui_and_list_add(layer_name);
    
    // Don't actually change the selection.
    // This keeps the dropdown open when we click.
    event.preventDefault();
    }

exports.init = function () {

    $search = $("#search");

    // Set up the layer search
    reactComponent = render(
        <Select2
            select2-selecting = {handleSelecting}
            select2options = {{
                data: {id: '', text: ''},
                dropdownParent: $search,
                placeholder: "Search Attributes...",
                width: '29em',
                value: null,
                initSelection: function (element, callback) {
                    var data = [];
                    $(element.val().split(",")).each(function () {
                        data.push({id: '', text: ''});
                    });
                    callback(data);
                },
                nextSearchTerm: function (selectedObject, currentSearchTerm) {
                    console.log('currentSearchTerm', currentSearchTerm);
                },
                query: function(query) {
                    // Given a select2 query object, call query.callback with an object
                    // with a "results" array.
                    
                    // This is the array of result objects we will be sending back.
                    var results = [];
                
                    // Get where we should start in the layer list, from select2's
                    // infinite scrolling.
                    var start_position = 0;
                    if(query.context != undefined) {
                        start_position = query.context;
                    }

                    var displayLayers = Session.get('displayLayers'),
                        sortedLayers = Session.get('sortedLayers');
                    for (var i = start_position; i < sortedLayers.length; i++) {

                        // Check for the sort layer being in the display layers
                        // and the sort term in the layer name
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
                            
                            if(results.length >= SEARCH_PAGE_SIZE) {
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
                },
                formatResult: function(result, container, query) {
                    // Given a select2 result record, the element that our results go
                    // in, and the query used to get the result, return a jQuery element
                    // that goes in the container to represent the result.
                    
                    // Get the layer name, and make the browse UI for it.
                    return make_browse_ui(result.id);
                },
            }}
        />, $search[0]);
    
    // Make the dropdown close if there is a click anywhere on the screen
    // other than the dropdown and search box
    $(window).on('mousedown', function (ev) {
        $("#search").select2("close");
    });
};
