// infoWindow.js
// Handle the google maps infoWindow objects.

import InfoWindow from '/imports/infoWindow.js';

// This is the global Google Maps info window. We only want one hex to have its
// info open at a time.
var info_window = null;

// This holds the signature name of the hex that the info window is currently
// about.
var selected_signature = undefined,
    justNodeId = false;

function row(key, value, gMap) {

    // Small helper function that returns a jQuery element that displays the
    // given key being the given value.
    // Using jQuery to build this saves us from HTML injection by making jQuery
    // do all the escaping work (we only ever set text).

    // This holds the root element of the row
    var root = $("<div/>").addClass("info-row"),
        newValue = value;

    if (_.isNaN(newValue) || _.isUndefined(newValue)) {
        newValue = 'NA';

    } else if (_.isUndefined(gMap) && ctx.cont_layers.indexOf(key) > -1) {
        try {
            newValue = value.toExponential(1);
        }
        catch (error) {
            newValue = 'NA';
        }
    }
    
    // Add the key and value elements
    root.append($("<div/>").addClass("info-key").text(key));
    root.append($("<div/>").addClass("info-value").text(newValue));

    return root;
}

function get_signature_search_url() {
    var default_url = "https://www.google.com/search?q=";
    var mapMeta = Session.get("mapMeta");
    if (mapMeta === "404" || _.isUndefined(mapMeta['nodeIdSearchUrl']) ){
        return default_url;
    } else {
        return mapMeta['nodeIdSearchUrl']
    }
}

function add_signature(signature) {

    // Small helper function that returns a jQuery element that displays the
    // given key being the given value.
    // Using jQuery to build this saves us from HTML injection by making jQuery
    // do all the escaping work (we only ever set text).


    // This holds the root element of the row
    var root = $("<div/>").addClass("info-row");
    var url = get_signature_search_url();
    url += signature;
    // Add the key and value elements
    if (!justNodeId) {
        root.append($("<div/>").addClass("info-key").text("ID"));
    }
    var $infoValue = $("<div/>").addClass("info-value");
    root.append($infoValue);
    if (justNodeId) {
        $infoValue.text(signature);
    } else {
        $infoValue.append($('<a href="' + url + '" target="_blank">' +
            signature + '</a>'));
    }
    return root;
}

function with_infocard(signature, callback, gMap) {
    // Given a signature, call the callback with a jQuery element representing
    // an "info card" about that signature. It's the contents of the infowindow 
    // that we want to appear when the user clicks on the hex representing this 
    // signature, and it includes things like the signature name and its values
    // under any displayed layers (with category names if applicable).
    // We return by callback because preparing the infocard requires reading 
    // from the layers, which are retrieved by callback.
    // TODO: Can we say that we will never have to download a layer here and 
    // just directly access them? Is that neater or less neat?

    if (gMap) {
        var infocard = $("<div/>").addClass("infocard");
        callback(infocard);
        return;
    }

    // This holds a list of the string names of the currently selected layers,
    // in order.
    // Just use everything on the shortlist.
    var current_layers = Session.get('shortlist').slice();
    
    // Obtain the layer objects (mapping from signatures/hex labels to colors)
    Layer.with_layers(current_layers, function(retrieved_layers) { 
        
        // This holds the root element of the card.
        var infocard = $("<div/>").addClass("infocard");
        
        // Display the hexagon name
        infocard.append(add_signature(signature).addClass("info-name"));

        if (!justNodeId) {
            if (SHOW_COORDS) {
                // Display the honeycomb coordinates
                infocard.append(row('xyHex',
                    polygons[signature].xHex.toString() + ', ' +
                    polygons[signature].yHex.toString()));
            }

            for(var i = 0; i < current_layers.length; i++) {
                // This holds the layer's value for this signature
                var layer_value = retrieved_layers[i].data[signature];
                
                if (have_colormap(current_layers[i])) {
                    // This is a color map
                    
                    // This holds the category object for this category number, or
                    // undefined if there isn't one.
                    var category = colormaps[current_layers[i]][layer_value];
                    
                    if (category != undefined) {
                        // There's a specific entry for this category, with a 
                        // human-specified name and color.
                        // Use the name as the layer value
                        layer_value = category.name;
                    }
                }
                
                if (layer_value == undefined) {
                    // Let the user know that there's nothing there in this layer.
                    layer_value = 'NA';
                }
                
                // Make a listing for this layer's value
                infocard.append(row(current_layers[i], layer_value));
            }
        }
        
        // Return the infocard by callback
        callback(infocard);
    });
}

function mapKeyup (e) {

    var code = (e.keyCode ? e.keyCode : e.which);
    if (code === 27) { // 27 = ESC key
        InfoWindow.close();
    }
}

exports.close = function (mouseout) {
    if (!info_window || (mouseout && !justNodeId)) {
        return;
    }

    justNodeId = false;
    
    info_window.close();
    
    // Also make sure that the selected signature is no longer selected,
    // so we don't pop the info_window up again.
    selected_signature = undefined;
    
    
    // Also un-focus the search box
    $("#search").blur();
}

exports.redraw = function (gMap, callback1) {

    // Set the contents of the global info window to reflect the currently
    // visible information about the global selected signature. 
    
    if (selected_signature == undefined) {
        // No need to update anything
        return;
    }

    // Go get the infocard that goes in the info_window and, when it's 
    // prepared, display it.
    with_infocard(selected_signature, function(infocard) {
        // The [0] is supposed to get the DOM element from the jQuery 
        // element.
        if (callback1) callback1(infocard, row);
        info_window.setContent(infocard[0]);

        // Open the window. It may already be open, or it may be closed but 
        // properly positioned and waiting for its initial contents before 
        // opening. Give the contents a chance to update.
        setTimeout(function () {
            info_window.open(gMap ? gMap : googlemap);
        }, 0);
    }, gMap);
}

exports.show = function (event, hexagon, gMap, callback1, justNodeId_in) {

    if (!info_window) return;

    if (tool_activity()) {
        // The user is using a tool currently, so we cannot use
        // their clicks for the info window.
        return;
    }

    // Remove the window from where it currently is
    InfoWindow.close();
    
    // Save the justNodeId boolean, whatever was passed in.
    justNodeId = justNodeId_in;

    // Place the window point in the center of this hexagon.
    info_window.setPosition(get_LatLng(hexagon.xy.x, hexagon.xy.y));
    
    // Record that this signature is selected now
    selected_signature = hexagon.signature;

    // Calculate the window's contents and make it display them.
    InfoWindow.redraw(gMap, callback1);
}

exports.init = function (gMap) {

    // Make the global info window
    info_window = new google.maps.InfoWindow({
        content: "No Signature Selected",
        position: get_LatLng(0, 0)
    });

    // Attach a listener for the ESC key to close the info_window
    // TODO use session var
    google.maps.event.addDomListener(document, 'keyup', InfoWindow.mapKeyup);
    
    // Add an event to close the info window when the user clicks outside of any
    // any hexagon
    var map = googlemap;
    if (gMap) map = gMap;
    google.maps.event.addListener(map, "click", InfoWindow.close);

    // And an event to clear the selected hex when the info_window closes.
    // TODO use session var
    google.maps.event.addListener(info_window, "closeclick", InfoWindow.close);
}
