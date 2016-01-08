// hexagram.js
// Run the hexagram visualizer client.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

var userDebug = false; // Turn user debugging on/off

// The map width and height in pixels
var map_size_pix = 256;

var rpc; // holds the remote procedure call object

// This holds a global list of layer pickers in layer order. It is also the
// authority on what layers are currently selected.
var layer_pickers = [];

// Records Stats Value from Query
var stats_value = 0;

// Boolean stating whether this is the first time the set operation popup & stats query
// has been created so that "Select Layer" Default is added only once
var first_opening = true;
var first_opening_stats = true;

// Boolean for Creating Layer from Filter
var created = false;

// Stores the Index of the Current Layout Selected. Default is 0 for default layout.
current_layout_index = 0;

// This holds colormaps (objects from layer values to category objects with a
// name and color). They are stored under the name of the layer they apply to.
colormaps = {}

// This holds an array of the available score matrix filenames
var available_matrices = [];

// This holds the Google Map that we use for visualization
googlemap = null;

// This is the global Google Maps info window. We only want one hex to have its
// info open at a time.
var info_window = null;

// This holds the signature name of the hex that the info window is currently
// about.
var selected_signature = undefined;

// This is a mapping from coordinates [x][y] in in the global hex grid to signature
// name
var signature_grid = [];

// This holds the grid of hexagon polygons on that Google Map.
var polygon_grid = [];

// This holds an object of polygons by signature name
polygons = {};

// How big is a hexagon in google maps units? This gets filled in once we have 
// the hex assignment data. (This is really the side length.)
var hex_size;

// This holds a handle for the currently enqueued view redrawing timeout.
var redraw_handle;

// What's the minimum number of pixels that hex_size must represent at the
// current zoom level before we start drawing hex borders?
var MIN_BORDER_SIZE = 10;

// And how thick should the border be when drawn?
var HEX_STROKE_WEIGHT = 2;

// How many layer search results should we display at once?
var SEARCH_PAGE_SIZE = 10;

// How big is our color key in pixels?
var KEY_SIZE = 100;

// The google elements obtained to transform to svg
var googleElements;

print = function (text) {
    // Print some logging text to the browser console

    if(userDebug && console && console.log) {
        // We know the console exists, and we can log to it.
        console.log(text);
    }
}

function make_hexagon(row, column, hex_side_length, grid_offset) {
    // Make a new hexagon representing the hexagon at the given grid coordinates.
    // hex_side_length is the side length of hexagons in Google Maps world 
    // coordinate units. grid_offset specifies a distance to shift the whole 
    // grid down and right from the top left corner of the map. This lets us 
    // keep the whole thing away from the edges of the "earth", where Google 
    // Maps likes to wrap.
    // Returns the Google Maps polygon.
    
    // How much horizontal space is needed per hex on average, stacked the 
    // way we stack them (wiggly)?
    var hex_column_width = 3.0/2.0 * hex_side_length;

    // How tall is a hexagon?
    var hex_height = Math.sqrt(3) * hex_side_length;

    // First, what are x and y in 0-256 world coordinates for this grid position?
    var x = column * hex_column_width;
    var y = row * hex_height;
    if(column % 2 == 1) {
        // Odd columns go up
        y -= hex_height / 2; 
    }
    
    // Apply the grid offset to this hex
    x += grid_offset;
    y += grid_offset;
    
    // That got X and Y for the top left corner of the bounding box. Shift to 
    // the center.
    x += hex_side_length;
    y += hex_height / 2;
    
    // Offset the whole thing so no hexes end up off the map when they wiggle up
    y += hex_height / 2;
    
    // This holds an array of all the hexagon corners
    var coords = [
        get_LatLng(x - hex_side_length, y),
        get_LatLng(x - hex_side_length / 2, y - hex_height / 2),
        get_LatLng(x + hex_side_length / 2, y - hex_height / 2),
        get_LatLng(x + hex_side_length, y),
        get_LatLng(x + hex_side_length / 2, y + hex_height / 2),
        get_LatLng(x - hex_side_length / 2, y + hex_height / 2),
    ];
    
    // We don't know whether the hex should start with a stroke or not without 
    // looking at the current zoom level.
    // Get the current zoom level (low is out)
    var zoom = googlemap.getZoom();
        
    // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
    // So this holds the number of pixels that the global length hex_size 
    // corresponds to at this zoom level.
    var hex_size_pixels = hex_size * Math.pow(2, zoom);
    
    // Construct the Polygon
    var hexagon = new google.maps.Polygon({
        paths: coords,
        strokeOpacity: 1.0,
        fillColor: "#FF0000",
        fillOpacity: 1.0,
        zIndex: 1,
    });
    set_hexagon_stroke(hexagon);
    
    // Attach the hexagon to the global map
    hexagon.setMap(googlemap);
    
    // Set up the click listener to move the global info window to this hexagon
    // and display the hexagon's information
    google.maps.event.addListener(hexagon, "click", function(event) {
        if(!tool_activity()) {
            // The user isn't trying to use a tool currently, so we can use
            // their clicks for the infowindow.
            
            // Remove the window from where it currently is
            info_window.close();

            // Place the window in the center of this hexagon.
            info_window.setPosition(get_LatLng(x, y));
            
            // Record that this signature is selected now
            selected_signature = hexagon.signature;
            
            // Calculate the window's contents and make it display them.
            redraw_info_window();
        }
    });
    
    // Subscribe the tool listeners to events on this hexagon
    subscribe_tool_listeners(hexagon);
    
    return hexagon;
} 

function set_hexagon_signature(hexagon, text) {
    // Given a polygon representing a hexagon, set the signature that the
    // hexagon represents.
    hexagon.signature = text;
}

function set_hexagon_color(hexagon, color) {
    // Given a polygon, set the hexagon's current background 
    // color.
    
    hexagon.setOptions({
        fillColor: color
    });
}

function set_hexagon_stroke(hexagon) {
    // Given a polygon, set the weight of hexagon's border stroke, in number of
    // screen pixels, and the border color.

    // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
    // So this holds the number of pixels that the global length hex_size 
    // corresponds to at this zoom level.
    var weight = (hex_size * Math.pow(2, ctx.zoom) >= MIN_BORDER_SIZE)
            ? HEX_STROKE_WEIGHT
            : 0;

    hexagon.setOptions({
        strokeWeight: weight,
        strokeColor: Session.get('background'),
    });
}

function redraw_info_window() {
    // Set the contents of the global info window to reflect the currently 
    // visible information about the global selected signature. 
    
    if(selected_signature == undefined) {
        // No need to update anything
        return;
    }

    // Go get the infocard that goes in the info_window and, when it's 
    // prepared, display it.
    with_infocard(selected_signature, function(infocard) {
        // The [0] is supposed to get the DOM element from the jQuery 
        // element.
        info_window.setContent(infocard[0]);
        
        // Open the window. It may already be open, or it may be closed but 
        // properly positioned and waiting for its initial contents before 
        // opening.
        info_window.open(googlemap);
    });
}

function with_infocard(signature, callback) {
    // Given a signature, call the callback with a jQuery element representing 
    // an "info card" about that signature. It's the contents of the infowindow 
    // that we want to appear when the user clicks on the hex representing this 
    // signature, and it includes things like the signature name and its values
    // under any displayed layers (with category names if applicable).
    // We return by callback because preparing the infocard requires reading 
    // from the layers, which are retrieved by callback.
    // TODO: Can we say that we will never have to download a layer here and 
    // just directly access them? Is that neater or less neat?
    
    // Using jQuery to build this saves us from HTML injection by making jQuery
    // do all the escaping work (we only ever set text).
    
    function row(key, value) {
        // Small helper function that returns a jQuery element that displays the
        // given key being the given value.
        
        // This holds the root element of the row
        var root = $("<div/>").addClass("info-row");
        
        // Add the key and value elements
        root.append($("<div/>").addClass("info-key").text(key));
        root.append($("<div/>").addClass("info-value").text(value));
        
        return root;
    }
    
    // This holds a list of the string names of the currently selected layers,
    // in order.
    // Just use everything on the shortlist.
    var current_layers = Session.get('shortlist');
    
    // Obtain the layer objects (mapping from signatures/hex labels to colors)
    with_layers(current_layers, function(retrieved_layers) { 
        
        // This holds the root element of the card.
        var infocard = $("<div/>").addClass("infocard");
        
        infocard.append(row("Name", signature).addClass("info-name"));
    
        for(var i = 0; i < current_layers.length; i++) {
            // This holds the layer's value for this signature
            var layer_value = retrieved_layers[i].data[signature];
            
            if(have_colormap(current_layers[i])) {
                // This is a color map
                
                // This holds the category object for this category number, or
                // undefined if there isn't one.
                var category = colormaps[current_layers[i]][layer_value];
                
                if(category != undefined) {
                    // There's a specific entry for this category, with a 
                    // human-specified name and color.
                    // Use the name as the layer value
                    layer_value = category.name;
                }
            }
            
            if(layer_value == undefined) {
                // Let the user know that there's nothing there in this layer.
                layer_value = "<undefined>";
            }
            
            // Make a listing for this layer's value
            infocard.append(row(current_layers[i], layer_value));
        }
        
        // Return the infocard by callback
        callback(infocard);
    }); 
    
}

function add_layer_url(layer_name, layer_url, attributes) {
    // Add a layer with the given name, to be downloaded from the given URL, to
    // the list of available layers.
    // Attributes is an object of attributes to copy into the layer.
    
    // Store the layer. Just keep the URL, since with_layer knows what to do
    // with it.
    layers[layer_name] = {
        url: layer_url,
        data: undefined,
        magnitude: undefined,
    };
    
    for(var name in attributes) {
        // Copy over each specified attribute
        layers[layer_name][name] = attributes[name];
    }
    
    // Add it to the sorted layer list.
    var sorted = Session.get('sortedLayers').slice();
    sorted.push(layer_name);
    Session.set('sortedLayers', sorted);

    // Don't sort because our caller does that when they're done adding layers.

}

with_layer = function (layer_name, callback) {
    // This is how you get layers, and allows for layers to be downloaded
    // dynamically. 
    // have_layer must return true for the given name.
    // Run the callback, passing it the layer (object from hex label/signature
    // to float) with the given name.

    // First get what we have stored for the layer
    var layer = layers[layer_name];
    
		var data_val = layer.data;
		if(layer.data == undefined) {
		    // We need to download the layer.
		    print("Downloading \"" + layer.url + "\"");
		    
		    // Go get it (as text!)
		    $.get(layer.url, function(layer_tsv_data) {

		        // This is the TSV as parsed by our TSV-parsing plugin
		        var layer_parsed = $.tsv.parseRows(layer_tsv_data);

                if (projectNotFound(layer_parsed)) return;

		        // This is the layer we'll be passing out. Maps from
		        // signatures to floats on -1 to 1.
		        var layer_data = {};

		        for(var j = 0; j < layer_parsed.length; j++) {
		            // This is the label of the hex
		            var label = layer_parsed[j][0];
		            
		            if(label == "") {
		                // Skip blank lines
		                continue;
		            }
		            
		            // This is the heat level (-1 to 1)
		            var heat = parseFloat(layer_parsed[j][1]);
		            
		            // Store in the layer
		            layer_data[label] = heat;
		        }
		
		        // Save the layer data locally
		        layers[layer_name].data = layer_data;
	 
		        // Now the layer has been properly downloaded, but it may not have
		        // metadata. Recurse with the same callback to get metadata.
		        with_layer(layer_name, callback);
		    }, "text");
		} else if(layer.magnitude == undefined || layer.minimum == undefined || 
		    layer.maximum == undefined) {
		    // We've downloaded it already, or generated it locally, but we don't
		    // know the min/max statistics. Compute them, and also check if the
		    // layer is a colormap (i.e. discrete nonnegative integers).
		   
		    // Grab the data, which we know is defined.
		    var layer_data = layers[layer_name].data;
		   
		    // Store the maximum value
		    var maximum = -Infinity;
		    
		    // And the minimum value
		    var minimum = Infinity;
		    
		    // We also want to know if all layer entries are non-negative 
		    // integers (and it is thus valid as a colormap).
		    // If so, we want to display it as a colormap, so we will add an 
		    // empty entry to the colormaps object (meaning we should 
		    // auto-generate the colors on demand).
		    // This stores whether the layer is all integrs
		    all_nonnegative_integers = true;
		    
		    for(var signature_name in layer_data) {
		        // Look at every value in the layer
		        
		        if(layer_data[signature_name] > maximum) {
		            // Take the value as new max if it's bigger than the current one
		            maximum = layer_data[signature_name]
		        }
		        
		        if(layer_data[signature_name] < minimum) {
		            // Similarly for new minimums
		            minimum = layer_data[signature_name]
		        }
		        
		        if(layer_data[signature_name] % 1 !== 0 || 
		            layer_data[signature_name] < 0 ) {
		            
		            // If we have an illegal value for a colormap, record that
		            // fact
		            // See http://stackoverflow.com/a/3886106
		            
		            all_nonnegative_integers = false;
		        }
		    }
		    
		    // Save the layer bounds for later.
		    layer.maximum = maximum;
		    layer.minimum = minimum;
		    // Keep track of the unsigned magnitude which gets used a lot.
		    layer.magnitude = Math.max(Math.abs(minimum), maximum);
		    
		    if(!have_colormap(layer_name) && all_nonnegative_integers) {
		        // Add an empty colormap for this layer, so that 
		        // auto-generated discrete colors will be used.
		        // TODO: Provide some way to override this if you really do want
		        // to see integers as a heatmap?
		        // The only overlap with the -1 to 1 restricted actual layers
		        // is if you have a data set with only 0s and 1s. Is it a
		        // heatmap layer or a colormap layer?
		        colormaps[layer_name] = {};
		        print("Inferring that " + layer_name + 
		            " is really a colormap");
		    }
		    
		    // Now layer metadata has been filled in. Call the callback.
		    callback(layer);
		} else {
		    // It's already downloaded, and already has metadata.
		    // Pass it to our callback
		    callback(layer);
		}
}

with_layers = function (layer_list, callback) {
    // Given an array of layer names, call the callback with an array of the 
    // corresponding layer objects (objects from signatures to floats).
    // Conceptually it's like calling with_layer several times in a loop, only
    // because the whole thing is continuation-based we have to phrase it in
    // terms of recursion.
    
    // See http://marijnhaverbeke.nl/cps/
    // "So, we've created code that does exactly the same as the earlier 
    // version, but is twice as confusing."
    
    if(layer_list.length == 0) {
        // Base case: run the callback with an empty list
        callback([]);
    } else {
        // Recursive case: handle the last thing in the list
        with_layers(layer_list.slice(0, layer_list.length - 1), 
            function(rest) {
            
            // We've recursively gotten all but the last layer
            // Go get the last one, and pass the complete array to our callback.
            
            with_layer(layer_list[layer_list.length - 1], 
                function(last) {
            
                // Mutate the array. Shouldn't matter because it won't matter 
                // for us if callback does it.
                rest.push(last);
                
                // Send the complete array to the callback.
                callback(rest);
            
            });
            
        });
       
    }
}

have_layer = function (layer_name) {
    // Returns true if a layer exists with the given name, false otherwise.
    return layers.hasOwnProperty(layer_name);
}

fill_layer_metadata = function (container, layer_name) {
    // Empty the given jQuery container element, and fill it with layer metadata
    // for the layer with the given name.
    
    // Empty the container.
    container.html("");

    for(attribute in layers[layer_name]) {
        // Go through everything we know about this layer
        if(attribute == "data" || attribute == "url" || 
            attribute == "magnitude" || attribute == "minimum" || 
            attribute == "maximum" || attribute == "selection" || 
            attribute == "clumpiness_array") {
            
            // Skip built-in things
            // TODO: Ought to maybe have all metadata in its own object?
            continue;
        }
        
        // This holds the metadata value we're displaying
        var value = layers[layer_name][attribute];
        
        if(typeof value == "number" && isNaN(value)) {
            // If it's a numerical NaN (but not a string), just leave it out.
            continue;
        }
        
        if(value == undefined) {
            // Skip it if it's not actually defined for this layer
            continue;
        }
        
        // If we're still here, this is real metadata.
        // Format it for display.
        var value_formatted;
        if(typeof value == "number") {
            if(value % 1 == 0) {
                // It's an int!
                // Display the default way
                value_formatted = value;
            } else {
                // It's a float!
                // Format the number for easy viewing
                value_formatted = value.toExponential(2);
            }
        } else {
            // Just put the thing in as a string
            value_formatted = value;
        }
        
        // Do some transformations to make the displayed labels make more sense
        lookup = {
            n: "Number of non-empty values",
            positives: "Number of ones",
            inside_yes: "Ones in A",
            outside_yes: "Ones in background",
            clumpiness: "Density score",
            p_value: "Single test p-value",
            correlation: "Correlation",
            adjusted_p_value: "BH FDR",
            tags: "Tags",
        }
        
        if(lookup[attribute]) {
            // Replace a boring short name with a useful long name
            attribute = lookup[attribute];
        }
        
        // Make a spot for it in the container and put it in
        var metadata = $("<div\>").addClass("layer-metadata");
        metadata.text(attribute + " = " + value_formatted);
        
        container.append(metadata);

    }
}

function make_toggle_layout_ui(layout_name) {
    // Returns a jQuery element to represent the layer layout the given name in 
    // the toggle layout panel.
    
    // This holds a jQuery element that's the root of the structure we're
    // building.
    var root = $("<div/>").addClass("layout-entry");
    root.data("layout-name", layout_name);
    
    // Put in the layer name in a div that makes it wrap.
    root.append($("<div/>").addClass("layout-name").text(layout_name));
 
    return root;
}

update_browse_ui = function() {
    // Make the layer browse UI reflect the current list of layers in sorted
    // order.
    
    // Re-sort the sorted list that we maintain
    sort_layers();

    // Close the select if it was open, forcing the data to refresh when it
    // opens again.
    $("#search").select2("close");
}

find_polygons_in_rectangle = function (start, end) {
    // Given two Google Maps LatLng objects (denoting arbitrary rectangle 
    // corners), add a new selection layer containing all the hexagons 
    // completely within that rectangle.
    // Only looks at hexes that are not filtered out by the currently selected 
    // filters.
    
    // Sort out the corners to get the rectangle limits in each dimension
    var min_lat = Math.min(start.lat(), end.lat());
    var max_lat = Math.max(start.lat(), end.lat());
    var min_lng = Math.min(start.lng(), end.lng());
    var max_lng = Math.max(start.lng(), end.lng());
    
    // This holds an array of all signature names in our selection box.
    var in_box = [];
    
    // Start it out with 0 for each signature. Otherwise we wil have missing 
    // data for signatures not passing the filters.
    for(var signature in polygons) {
         // Get the path for its hex
        var path = polygons[signature].getPath();
        
        // This holds if any points of the path are outside the selection
        // box
        var any_outside = false;
        
        path.forEach(function(point, index) {
            // Check all the points. Runs synchronously.
            
            if(point.lat() < min_lat || point.lat() > max_lat || 
                point.lng() < min_lng || point.lng() > max_lng) {
                
                // This point is outside the rectangle
                any_outside = true;
                
            }
        });
        
        // Select the hex if all its corners are inside the selection
        // rectangle.
        if(!any_outside) {
            in_box.push(signature);
        }
    }
    return in_box;
}

function get_current_layout_index (layout_name) {
	// Parse the File "matrixnames.tab". Each layout is listed in the file's
	// first column. Extract these in an array and search for the 
	// layout_name. Return the index at which this layout name sits.

	var layout_index;
	$.get(ctx.project + "matrixnames.tab", function(tsv_data) {
		var parsed = $.tsv.parseRows(tsv_data);
		
        if (projectNotFound(parsed)) return;

		for (var i = 0; i < parsed.length; i++){
			if (parsed[i][0] == layout_name) {
				layout_index = i;
			}
		}
	}, "text")
	.done(function() {
		current_layout_index = layout_index;
        // TODO recompute any stats sort that was in effect for the last layout
	})
 	.fail(function() {
		alert("Error Determining Selected Layout Index");
	});
}

initialize_view = function () {
    // Initialize the global Google Map.

    var mapOptions = {
        center: ctx.center,
        //center: Session.get('center'),
        zoom: ctx.zoom,
        mapTypeId: "blank",
        // Don't show a map type picker.
        mapTypeControlOptions: {
            mapTypeIds: []
        },
        /*
        // TODO This does not force the large zoom control to show even if
        // the google maps docs says it does
        zoomControl:true,
        zoomControlOptions: {
            style:google.maps.ZoomControlStyle.LARGE
        },
        */
        // Or a street view man that lets you walk around various Earth places.
        streetViewControl: false
    };

    // Create the actual map
    googlemap = new google.maps.Map(document.getElementById("visualization"),
        mapOptions);
        
    // Attach the blank map type to the map
    googlemap.mapTypes.set("blank", new BlankMapType());

    // Make the global info window
    info_window = new google.maps.InfoWindow({
        content: "No Signature Selected",
        position: get_LatLng(0, 0)
    });
    
    // Add an event to close the info window when the user clicks outside of any
    // hexagon
    google.maps.event.addListener(googlemap, "click", function(event) {
        info_window.close();
        
        // Also make sure that the selected signature is no longer selected,
        // so we don't pop the info_window up again.
        selected_signature = undefined;
        
        // Also un-focus the search box
        $("#search").blur();
    });
    
    
    // And an event to clear the selected hex when the info_window closes.
    google.maps.event.addListener(info_window, "closeclick", function(event) {
        selected_signature = undefined;
    });

    google.maps.event.addListener(googlemap, "center_changed", function(event) {
        ctx.center = googlemap.getCenter();
        //Session.set('center', googlemap.getCenter());
    });
    
    // We also have an event listener that checks when the zoom level changes,
    // and turns off hex borders if we zoom out far enough, and turns them on
    // again if we come back.
    google.maps.event.addListener(googlemap, "zoom_changed", function(event) {
        // Get the current zoom level (low is out)
        ctx.zoom = googlemap.getZoom();
        for(var signature in polygons) {
            set_hexagon_stroke(polygons[signature]);
        }
    });
    
    // Subscribe all the tool listeners to the map
    subscribe_tool_listeners(googlemap);
    
}
re_initialize_view = function () { // swat
	// Re_initialize the view because something changed that requires it

    // Save current map settings
    print ('ctx:');
    print (ctx);
    print ('googlemap:');
    print (googlemap);
    ctx.zoom = googlemap.getZoom();

    initialize_view ();
    recreate_map();
    refresh ();
}

have_colormap = function (colormap_name) {
    // Returns true if the given string is the name of a colormap, or false if 
    // it is only a layer.

    return (colormap_name in colormaps)
}

function get_range_position(score, low, high) {
    // Given a score float, and the lower and upper bounds of an interval (which
    // may be equal, but not backwards), return a number in the range -1 to 1
    // that expresses the position of the score in the [low, high] interval.
    // Positions out of bounds are clamped to -1 or 1 as appropriate.
    
    // This holds the length of the input interval
    var interval_length = high - low;
    
    if(interval_length > 0) {
        // First rescale 0 to 1
        score = (score - low) / interval_length
        
        // Clamp
        score = Math.min(Math.max(score, 0), 1);
            
        // Now re-scale to -1 to 1
        score = 2 * score - 1;
    } else {
        // The interval is just a point
        // Just use 1 if we're above the point, and 0 if below.
        score = (score > low)? 1 : -1
    }
    
    return score;
}

refresh = function () {
    // Schedule the view to be redrawn after the current event finishes.
    
    // Get rid of the previous redraw request, if there was one. We only want 
    // one.
    window.clearTimeout(redraw_handle);
    
    // Make a new one to happen as soon as this event finishes
    redraw_handle = Meteor.setTimeout(redraw_view, 0);
}

function redraw_view() {
    // Make the view display the correct hexagons in the colors of the current 
    // layer(s), as read from the values of the layer pickers in the global
    // layer pickers array.
    // All pickers must have selected layers that are in the object of 
    // layers.
    // Instead of calling this, you probably want to call refresh().
    
    // This holds a list of the string names of the currently selected layers,
    // in order.
    var current_layers = get_current_layers();
    
    // This holds all the current filters
    var filters = get_current_filters();
    
    // Obtain the layer objects (mapping from signatures/hex labels to colors)
    with_layers(current_layers, function(retrieved_layers) {  
        print("Redrawing view with " + retrieved_layers.length + " layers.");
        
        // This holds arrays of the lower and upper limit we want to use for 
        // each layer, by layer number. The lower limit corresponds to u or 
        // v = -1, and the upper to u or v = 1. The entries we make for 
        // colormaps are ignored.
        
        // We need to do this inside the callback, once we already have the
        // layers, so that we properly use the newest slider range endpoints,
        // which are updated asynchronously.
        var layer_limits = []
        for(var i = 0; i < current_layers.length; i++) {
            var range = get_slider_range(current_layers[i]);
            print("Layer range " + range[0] + " to " + range[1]);
            layer_limits.push(range);
        }
        
        
        // Turn all the hexes the filtered-out color, pre-emptively
        for(var signature in polygons) {
            set_hexagon_color(polygons[signature], noDataColor());
        }
        
        // Go get the list of filter-passing hexes.
        with_filtered_signatures(filters, function(signatures) {
            for(var i = 0; i < signatures.length; i++) {
                // For each hex passign the filter
                // This holds its signature label
                var label = signatures[i];
                
                // This holds the color we are calculating for this hexagon.
                // Start with the no data color.
                var computed_color = noDataColor();
                
                if(retrieved_layers.length >= 1) {
                    // We need to compute colors given the layers we found.

                    // Get the heat along u and v axes. This puts us in a square
                    // of side length 2. Fun fact: undefined / number = NaN, but
                    // !(NaN == NaN)
                    var u = retrieved_layers[0].data[label];
                    
                    if(!have_colormap(current_layers[0])) {
                        // Take into account the slider values and re-scale the 
                        // layer value to express its position between them.
                        u = get_range_position(u, layer_limits[0][0], 
                            layer_limits[0][1]);
                    }
                    
                    if(retrieved_layers.length >= 2) {
                        // There's a second layer, so use the v axis.
                        var v = retrieved_layers[1].data[label];
                        
                        if(!have_colormap(current_layers[1])) {
                            // Take into account the slider values and re-scale
                            // the layer value to express its position between
                            // them.
                            v = get_range_position(v, layer_limits[1][0], 
                                layer_limits[1][1]);
                        }
                        
                    } else {
                        // No second layer, so v axis is unused. Don't make it 
                        // undefined (it's not missing data), but set it to 0.
                        var v = 0;
                    }
                    
                    // Either of u or v may be undefined (or both) if the layer
                    // did not contain an entry for this signature. But that's
                    // OK. Compute the color that we should use to express this
                    // combination of layer values. It's OK to pass undefined
                    // names here for layers.
                    computed_color = get_color(current_layers[0], u, 
                        current_layers[1], v);
                }
                
                // Set the color by the composed layers.
                set_hexagon_color(polygons[label], computed_color);
            }
        });

        redraw_legend(retrieved_layers, current_layers);
    });
    
    // Make sure to also redraw the info window, which may be open.
    redraw_info_window();
}

get_color = function (u_name, u, v_name, v) {
    // Given u and v, which represent the heat in each of the two currently 
    // displayed layers, as well as u_name and v_name, which are the 
    // corresponding layer names, return the computed CSS color.
    // Either u or v may be undefined (or both), in which case the no-data color
    // is returned. If a layer name is undefined, that layer dimension is 
    // ignored.
    
    if(have_colormap(v_name) && !have_colormap(u_name)) {
        // We have a colormap as our second layer, and a layer as our first.
        // Swap everything around so colormap is our first layer instead.
        // Now we don't need to think about drawing a layer first with a 
        // colormap second.
        
        return get_color(v_name, v, u_name, u);
    }
    
    if(isNaN(u) || isNaN(v) || u == undefined || v == undefined) {
        // At least one of our layers has no data for this hex.
        return noDataColor();
    }
    
    if(have_colormap(u_name) && have_colormap(v_name) && 
        !colormaps[u_name].hasOwnProperty(u) && 
        !colormaps[v_name].hasOwnProperty(v) &&
        layers[u_name].magnitude <= 1 && layers[v_name].magnitude <= 1) {
        
        // Special case: two binary or unary auto-generated colormaps.
        // Use dark grey/yellow/blue/white color scheme
    
        if(u == 1) {
            if(v == 1) {    
                // Both are on
                return COLOR_BINARY_BOTH_ON;
            } else {
                // Only the first is on
                return COLOR_BINARY_ON;
            }
        } else {
            if(v == 1) {
                // Only the second is on
                return COLOR_BINARY_SECOND_ON;
            } else {
                // Neither is on
                return COLOR_BINARY_OFF;
            }
        }
    }
    
    if(have_colormap(u_name) && !colormaps[u_name].hasOwnProperty(u) && 
        layers[u_name].magnitude <= 1 && v_name == undefined) {
        
        // Special case: a single binary or unary auto-generated colormap.
        // Use dark grey/yellow to make 1s stand out.
        
        if(u == 1) {
            return COLOR_BINARY_ON;
        } else {
            return COLOR_BINARY_OFF;
        }
    }
   
    if(have_colormap(u_name)) {
        // u is a colormap
        if(colormaps[u_name].hasOwnProperty(u)) {
            // And the colormap has an entry here. Use it as the base color.
            var to_clone = colormaps[u_name][u].color;
            
            var base_color = Color({
                hue: to_clone.hue(),
                saturation: to_clone.saturationv(),
                value: to_clone.value()
            });
        } else if(layers[u_name].magnitude <= 1) {
            // The colormap has no entry, but there are only two options (i.e.
            // we're doing a binary layer against a continuous one.)
            
            // We break out of the base_color path and do a special case:
            // interpolate between one pair of colors for on, and a different
            // pair for off.
            
            if(u == 0) {
                // What color should we use for a 0 value?
                
                // Interpolate each component by itself. Invert directions so we
                // can define our colors in terms of actual layer value space,
                // and not key space. To change the colors here, look
                // vertically.
                
                // Interpolate grey to yellow.
                var red = mix(0x33, 0xFF, -v).toFixed(0);
                var green = mix(0x33, 0xFF, -v).toFixed(0);
                var blue = mix(0x33, 0x00, -v).toFixed(0);
                
            } else if (u == 1) {
                // And for a 1 value? Do a different set of interpolations.
                // Interpolate blue to green.
                var red = mix(0x00, 0x00, -v).toFixed(0);
                var green = mix(0x00, 0xFF, -v).toFixed(0);
                var blue = mix(0xFF, 0x00, -v).toFixed(0);
            }
            
             // Produce the color string
            var color = "rgb(" + red + "," + green + "," + blue + ")";
            
            return color;
            
        } else {
            // The colormap has no entry, and there are more than two options.
            // Assume we're calculating all the entries. We do this by splitting
            // the color circle evenly.
            
            // This holds the number of colors, which is 1 more than the largest
            // value used (since we start at color 0), which is the magnitude.
            // It's OK to go ask for the magnitude of this layer since it must 
            // have already been downloaded.
            var num_colors = layers[u_name].magnitude + 1;
            
            // Calculate the hue for this number.
            var hsv_hue = u / (num_colors + 1) * 360;
    
            // The base color is a color at that hue, with max saturation and 
            // value
            var base_color = Color({
                hue: hsv_hue, 
                saturation: 100,
                value: 100
            })
        }
        
        // Now that the base color is set, consult v to see what shade to use.
        if(v_name == undefined) {
            // No v layer is actually in use. Use whatever is in the base 
            // color
            // TODO: This code path is silly, clean it up.
            var hsv_value = base_color.value();
        } else if(have_colormap(v_name)) {
            // Do discrete shades in v
            // This holds the number of shades we need.
            // It's OK to go ask for the magnitude of this layer since it must 
            // have already been downloaded.
            var num_shades = layers[v_name].magnitude + 1;
            
            // Calculate what shade we need from the nonnegative integer v
            // We want 100 to be included (since that's full brightness), but we
            // want to skip 0 (since no color can be seen at 0), so we add 1 to 
            // v.
            var hsv_value = (v + 1) / num_shades * 100;
        } else {
            // Calculate what shade we need from v on -1 to 1, with a minimum
            // value of 20 to avoid blacks.
            // TODO should we also have a max value? & how does 30 min translate to the below? swat
            var hsv_value = 60 + v * 40;
        }
        
        // Set the color's value component.
        base_color.value(hsv_value);
        
        // Return the shaded color
        return base_color.hexString();
    }
    
    
    // If we get here, we only have non-colormap layers.
    
    // We want the same grey/yellow/blue/white scheme as for binary layers, but
    // interpolated.
    
    // Remember: u and v are backwards. I.e.  (-1, -1) is the upper left of the
    // key.
    
    if(v_name == undefined) {
        // No v layer present. Use the edge and not the middle.
        v = -1;
    }
    
    if(u_name == undefined) {
        // No u layer present. Use the edge and not the middle.
        u = -1;
    }
    
    // Interpolate each component by itself. Invert directions so we can define
    // our colors in terms of actual layer value space, and not key space.
    // To change the colors here, look vertically.
    var red = mix2(0x33, 0xFF, 0x00, 0x00, -u, -v).toFixed(0);
    var green = mix2(0x33, 0xFF, 0x00, 0xFF, -u, -v).toFixed(0);
    var blue = mix2(0x33, 0x00, 0xFF, 0x00, -u, -v).toFixed(0);
    
    // Produce the color string
    var color = "rgb(" + red + "," + green + "," + blue + ")";
    
    return color;
}

function mix(a, b, amount) {
    // Mix between the numbers a and b, where an amount of -1 corresponds to a,
    // and an amount of +1 corresponds to b.
    
    // Convert to 0 to 1 range.
    var i = (amount + 1) / 2; 
    
    // Do the linear interpolation.
    return i * a + (1 - i) * b;
    
}

function mix2 (a, b, c, d, amount1, amount2) {
    // Mix between a and b (or c and d) on amount1, and then mix between the
    // results on amount2. Amounts are in range -1 to 1.
    
    return mix(mix(a, b, amount1), mix(c, d, amount1), amount2);
}

assignment_values = function (layout_index) {
	// Download the signature assignments to hexagons and fill in the global
    // hexagon assignment grid.
    $.get(ctx.project + "assignments" + layout_index +".tab", function(tsv_data) {
    
        // This is an array of rows, which are arrays of values:
        // id, x, y
        var parsed = $.tsv.parseRows(tsv_data);

        if (projectNotFound(parsed)) return;

        // This holds the maximum observed x
        var max_x = 0;
        // And y
        var max_y = 0;
        polygons = {};
        polygon_grid = signature_grid = [];

        // Fill in the global signature grid and polygon grid arrays.
        for(var i = 0; i < parsed.length; i++) {
            // Get the label
            var label = parsed[i][0];
            
            if(label == "") {
                // Blank line
                continue;
            }
            
            // Get the x coord
            var x = parseInt(parsed[i][1]);
            // And the y coord
            var y = parseInt(parsed[i][2]);

            // Update maxes
            max_x = Math.max(x, max_x);
            max_y = Math.max(y, max_y);

            // Make sure we have a row
            if(signature_grid[y] == null) {
                signature_grid[y] = [];
                // Pre-emptively add a row to the polygon grid.
                polygon_grid[y] = [];
            }
            
            // Store the label in the global signature grid.
            signature_grid[y][x] = label;
        }
        
        // We need to fit this whole thing into a 256x256 grid.
        // How big can we make each hexagon?
        // TODO: Do the algebra to make this exact. Right now we just make a
        // grid that we know to be small enough.
        // Divide the space into one column per column, and calculate 
        // side length from column width. Add an extra column for dangling
        // corners.
        var side_length_x = (256)/ (max_x + 2) * (2.0 / 3.0);

        print("Max hexagon side length horizontally is " + side_length_x);
        
        // Divide the space into rows and calculate the side length
        // from hex height. Remember to add an extra row for wiggle.
        var side_length_y = ((256)/(max_y + 2)) / Math.sqrt(3);

        print("Max hexagon side length vertically is " + side_length_y);
        
        // How long is a hexagon side in world coords?
        // Shrink it from the biggest we can have so that we don't wrap off the 
        // edges of the map. Divide by 2 to make it fit a 128x128 grid
        var hexagon_side_length = Math.min(side_length_x, side_length_y) / 2.0;

        // Store this in the global hex_size, so we can later calculate the hex
        // size in pixels and make borders go away if we are too zoomed out.
        hex_size = hexagon_side_length;

        // How far in should we move the whole grid from the top left corner of 
        // the earth?
        // Let's try leaving a 1/4 Earth gap at least, to stop wrapping in 
        // longitude that we can't turn off.
        // Since we already shrunk the map to half max size, this would put it 
        // 1/4 of the 256 unit width and height away from the top left corner.
        grid_offset = (256) / 4;
        
        // Loop through again and draw the polygons, now that we know how big 
        // they have to be
        for(var i = 0; i < parsed.length; i++) {
            // TODO: don't re-parse this info
            // Get the label
            var label = parsed[i][0];
            
            if(label == "") {
                // Blank line
                continue;
            }
            
            // Get the x coord
            var x = parseInt(parsed[i][1]);
            // And the y coord
            var y = parseInt(parsed[i][2]);

            // Make a hexagon on the Google map and store that.
            var hexagon = make_hexagon(y, x, hexagon_side_length, grid_offset);
            // Store by x, y in grid
            polygon_grid[y][x] = hexagon;
            // Store by label
            polygons[label] = hexagon;
            
            // Set the polygon's signature so we can look stuff up for it when 
            // it's clicked.
            set_hexagon_signature(hexagon, label);     
            
        }
        
        // Now that the polygons exist, do the initial redraw to set all their
        // colors corectly. In case someone has messed with the controls.
        // TODO: can someone yet have messed with the controlls?
        refresh();

        // Initialize tools requiring polygons to be drawn by triggering an
        // an idle event
        center = googlemap.getCenter()
        googlemap.setCenter(new google.maps.LatLng(center.lat(),
            center.lng() + .000000001));
        google.maps.event.addListener(googlemap, 'idle', initMapDrawn);

    }, "text");
}

// Function to create a new map based upon the the layout_name argument Find the
// index of the layout_name and pass it as the index to the assignment_values
// function as these files are indexed according to the appropriate layout.
// Also pass it to the set clumpiness function to swap to the appropriate set
// of clumpiness scores.
function recreate_map() {

	var layout_index = ctx.layout_names.indexOf(Session.get('current_layout_name'));
	assignment_values(layout_index);
	find_clumpiness_stats(layout_index);
}

function create_indexed_layers_array () {
	$.get(ctx.project + "layers.tab", function(tsv_data) {
		// Create a list of layer names ordered by their indices
		ctx.layer_names_by_index = new Array (Session.get('sortedLayers').length);
		parsed = $.tsv.parseRows(tsv_data);

        if (projectNotFound(parsed)) return;

		for (var i = 0; i < parsed.length; i++) {
		    if(parsed[i].length < 2) {
		        // Skip blank lines
		        continue;
		    }
		
		   	var file_name = parsed [i][1];
			// Locate the underscore index in the file name
			// index + 1 will be where the number starts
			var underscore_index = file_name.lastIndexOf("_");
			// Locate the period index in the file name
			// index will be where number ends
			var period_index =file_name.lastIndexOf(".");
			var index_value = file_name.substring(underscore_index+1, period_index);
			ctx.layer_names_by_index [index_value] = parsed[i][0];
		 }			     
    }, "text");

}
initHex = function () {
    // Set up the RPC system for background statistics
    //rpc = initRpc(); // TODO causing issues under meteor

    // Initialize some persistent store values

    // Attributes created via a select or set operation
	ctx.created_attr = []

    // Initialize some operating values

    // A list of layer names maintained in sorted order.
    Session.set('sortedLayers', []);

    // This is a count which is incremented every time the shortlist UI is
    // updated. We would rather use 'shortlist', but that produces an infinite
    // loop at times.
    Session.set('shortlistFilterUpdated', 0);

    // TODO we need to get this from the server before the attribute sort the
    // user sees on startup. We're lucky now. We need to guarantee this is done
    // first.
	// Download Information on what layers are continuous and which are binary
	$.get(ctx.project + "Layer_Data_Types.tab", function(tsv_data) {
        // This is an array of rows with the following content:
        //
		//	FirstAttribute		Layer6
		//	Continuous		Layer1	Layer2	Layer3 ...
		//	Binary	Layer4	Layer5	Layer6 ...
		//	Categorical	Layer7	Layer8	Layer9 ...
		//

		// Parse the file
        var parsed = $.tsv.parseRows(tsv_data);

        if (projectNotFound(parsed)) return;

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
	}, "text");  

    // Set up the Google Map type and projection
    mapTypeDef();

    initialize_view();
    initLayerLists();
    //initFilter();
    initSetOperations();
    initSortAttrs();
    //initDiffAnalysis(); // TODO shelf this feature for now.

	// Set up help buttons to open their sibling help dialogs.
	$(".help-button").each(function() {
	    // We need to attach the dialog to the button ourselves since .dialog()
	    // removes it from its home in the DOM.
	    $(this).data("dialog", $(this).siblings(".help-dialog"));
	    
	    // Set up the dialog
	    $(this).data("dialog").dialog({
	        width: "auto",
	        resizable: false,
	        modal: true,
	        autoOpen: false
	    });
	    
	    // Set up the open-the-dialog listener.
	    $(this).button().click(function () {
	        $(this).data("dialog").dialog("open");
	    });
	    
	});

    // Download the layer index
    $.get(ctx.project + "layers.tab", function(tsv_data) {
        // Layer index is tab-separated like so:
        // name  file  N-hex-value  binary-ones  layout0-clumpiness  layout1-clumpiness  ...
        var parsed = $.tsv.parseRows(tsv_data);
        
        if (projectNotFound(parsed)) return;

        for(var i = 0; i < parsed.length; i++) {
            // Pull out the parts of the TSV entry
            // This is the name of the layer.
            var layer_name = parsed[i][0];
            
            if(layer_name == "") {
                // Skip any blank lines
                continue;
            }
            
            // This is the URL from which to download the TSV for the actual 
            // layer.
            var layer_url = ctx.project + parsed[i][1];

            // This is the number of hexes that the layer has any values for.
            // We need to get it from the server so we don't have to download 
            // the layer to have it.
            var layer_count = parseFloat(parsed[i][2]);
            
            // This is the number of 1s in a binary layer, or NaN in other
            // layers
            var layer_positives = parseFloat(parsed[i][3]);
            
            // This array holds the layer's clumpiness scores under each layout,
            // by index. A greater clumpiness score indicates more clumpiness.
            var layer_clumpiness = [];
            
            for(var j = 4; j < parsed[i].length; j++) {
                // Each remaining column is the clumpiness score for a layout,
                // in layout order.
                // This is the layer's clumpiness score
                layer_clumpiness.push(parseFloat(parsed[i][j]));
            }    
                   
            // Add this layer to our index of layers
            add_layer_url(layer_name, layer_url, {
                clumpiness_array: layer_clumpiness,
                clumpiness: undefined, // This one gets filled in with the 
                                       // appropriate value out of the array, so
                                       // we can sort without having a current 
                                       // layout index.
                positives: layer_positives,
                n: layer_count,
            });

        }

		// Find the best 1st Attribute for sorts and initializing the shortlist
        // By now we assume the layers.tab file has been processed, which may
        // specify a first layer/attribute. If one was not supplied there, and
        // we find the standard sort layer, use that as first.
        if (_.isUndefined(Session.get('first_layer'))
                && (layers.hasOwnProperty('Tissue')
                || layers.hasOwnProperty('tissue'))) {
            Session.set('first_layer', layer_name);
        }
        update_shortlist_ui();

        // Now we have added layer downloaders for all the layers in the 
        // index. Update the UI
        update_browse_ui();

        // Sort attributes by the default sort
        find_clumpiness_stats(current_layout_index);

        // Announce that the initial layers have loaded.
        Session.set('initialLayersLoaded', true);
    }, "text");
    
    // Download full score matrix index, which we later use for statistics. Note
    // that stats won't work unless this finishes first. TODO: enforce this.
    $.get(ctx.project + "matrices.tab", function(tsv_data) {
        // Matrix index is just <filename>
        var parsed = $.tsv.parseRows(tsv_data);
        
        if (projectNotFound(parsed)) return;

        for(var i = 0; i < parsed.length; i++) {
            // Pull out the parts of the TSV entry
            // This is the filename of the matrix.
            var matrix_name = parsed[i][0];
            
            if(matrix_name == "") {
                // Not a real matrix
                continue;
            }
            
            // Add it to the global list
            available_matrices.push(ctx.project + matrix_name);
        }
    }, "text");
    
    // Download color map information
    $.get(ctx.project + "colormaps.tab", function(tsv_data) {
        // Colormap data is <layer name>\t<value>\t<category name>\t<color>
        // \t<value>\t<category name>\t<color>...
        var parsed = $.tsv.parseRows(tsv_data);
        
        if (projectNotFound(parsed)) return;

        for(var i = 0; i < parsed.length; i++) {
            // Get the name of the layer
            var layer_name = parsed[i][0];
            
            // Skip blank lines
            if(layer_name == "") {
                continue;
            }
            
            // This holds all the categories (name and color) by integer index
            var colormap = [];
            
            print("Loading colormap for " + layer_name);
            
            for(j = 1; j < parsed[i].length; j += 3) {
                // Store each color assignment.
                // Doesn't run if there aren't any assignments, leaving an empty
                // colormap object that just forces automatic color selection.
                
                // This holds the index of the category
                var category_index = parseInt(parsed[i][j]);
                
                // The colormap gets an object with the name and color that the
                // index number refers to. Color is stored as a color object.
                colormap[category_index] = {
                    name: parsed[i][j + 1],
                    color: Color(parsed[i][j + 2]), // operating color in map
                    fileColor: Color(parsed[i][j + 2]), // color from orig file
                };
                
                print( colormap[category_index].name + " -> " +  
                    colormap[category_index].color.hexString());
            }
            
            // Store the finished color map in the global object
            colormaps[layer_name] = colormap;
        }

        // We may need to redraw the view in response to having new color map 
        // info, if it came particularly late.
        refresh();
            
    }, "text");

    function layoutChange(changeToLayout) {

        if (changeToLayout) {
            Session.set('current_layout_name', changeToLayout);
        }
        $("#current-layout").text("Current Layout: " + Session.get('current_layout_name'));

        re_initialize_view ();
    }


    // Download the Matrix Names and pass it to the layout_names array
	$.get(ctx.project + "matrixnames.tab", function(tsv_data) {
        // This is an array of rows, which are strings of matrix names
        var parsed = $.tsv.parseRows(tsv_data);

        if (projectNotFound(parsed)) return;

        for(var i = 0; i < parsed.length; i++) {
            // Pull out the parts of the TSV entry
            var label = parsed[i][0];

			if(label == "") {
                // Skip any blank lines
                continue;
            }
            // Add layout names to global array of names
            ctx.layout_names.push(label);
        }
        if (Session.equals('current_layout_name', null)) {
            layoutChange(ctx.layout_names[0]);
        } else {
            layoutChange();
        }

    }, "text");

	$("#layout-search").select2({
        placeholder: "Select a Layout...",
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
        
            for(var i = start_position; i < ctx.layout_names.length; i++) {
                // For each possible result
                if(ctx.layout_names[i].toLowerCase().indexOf(
                    query.term.toLowerCase()) != -1) {
                    
                    // Query search term is in this layer's name. Add a select2
                    // record to our results. Don't specify text: our custom
                    // formatter looks up by ID and makes UI elements
                    // dynamically.
                    results.push({
                        id: ctx.layout_names[i]
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
                more: i < ctx.layout_names.length,
                // If there are more results, start after where we left off.
                context: i + 1
            });
        },
        formatResult: function(result, container, query) {
            // Given a select2 result record, the element that our results go
            // in, and the query used to get the result, return a jQuery element
            // that goes in the container to represent the result.
            
            // Get the layer name, and make the browse UI for it.
            return make_toggle_layout_ui(result.id);
        },
    });

    // Make the bottom of the list within the main window
    $('#layout-search').parent().on('select2-open', function () {
        var results = $('#select2-drop .select2-results');
        results.css('max-height', $(window).height() - results.offset().top - 15);
    });

  	// Handle result selection
    $("#layout-search").on("select2-selecting", function(event) {
        // The select2 id of the thing clicked (the layout's name) is event.val
        var layout_name = event.val;

		var current_layout = "Current Layout: " + layout_name;         
	 
		$("#current-layout").text(current_layout);

        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        // TODO only one layer at a time can be displayed, so we don't need to
        //      keep the dropdown open
        event.preventDefault();

		// If currently sorted by mutual information, the mutual information
		// values must be added for the specific layout and must be resorted.
		// Function will update current_layout_index & reextract stats if needed
		get_current_layout_index (layout_name);

        layoutChange(layout_name);
    });

	create_indexed_layers_array ();
};
})(app);
