// hexagram.js
// Run the hexagram visualizer client.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

var userDebug = false; // Turn user debugging on/off

// The map width and height in pixels
var map_size_pix = 256;

var rpc; // holds the remote procedure call object

// This is a mapping from coordinates [x][y] in initHthe global hex grid to signature
// name
var signature_grid = [];

// This holds a global list of layer pickers in layer order. It is also the
// authority on what layers are currently selected.
var layer_pickers = [];

// This holds a list of layer objects by name.
// Layer objects have:
// A downloading function "downloader"
// A data object (from hex name to float) "data"
// A magnitude "magnitude"
// A boolean "selection" that specifies whether this is a user selection or not.
// (This may be absent, which is the same as false.)
// Various optional metadata fields
layers = {};

// List of layer types
cont_layers = [];
binary_layers = [];
categorical_layers =[];

// This is a list of layer names maintained in sorted order.
var layer_names_sorted = [];

// This holds an array of layer names that the user has added to the "shortlist"
// They can be quickly selected for display.
var shortlist = [];

// This holds an object form shortlisted layer names to jQuery shortlist UI
// elements, so we can efficiently tell if e.g. one is selected.
var shortlist_ui = {};

// Records number of set-operation clicks
var set_operation_clicks = 0;

// Records number of comparison-stats clicks
var comparison_stats_clicks = 0;

// Records number of sort attribute clicks
var sort_attributes_clicks = 0;

// Hack: Keep global variable to tell when load session computation is complete
var set_operation_complete = false;

// Records the Mutual Information Value from Query
var mutual_information_value = 0;

// Records Layer by which Mutual Information is ranked
var mutual_information_sorted_against = [];

// Records whether mutual information is filtered. TODO: We need a better way to
// keep track of stats state for recomputing on layout change!
var mutual_information_filtered = undefined;

// Records Stats Value from Query
var stats_value = 0;

// Boolean stating whether this is the first time the set operation popup & stats query
// has been created so that "Select Layer" Default is added only once
var first_opening = true;
var first_opening_stats = true;
var first_opening_comparison_stats = true;

// Whether the data is ranked by Mutual Information. If the layout changes, the stats 
// must be updated. 
var mutual_information_ranked = false;

// Boolean for Creating Layer from Filter
var created = false;

// Stores the layer names according to their ascribed indices in "layers.tab"
var layer_names_by_index;

// Stores the Index of the Current Layout Selected. Default is 0 for default layout.
current_layout_index = 0;

// Stores the text that informs user what sorting mechanism has been employed
var current_sort_text = "Attributes Ranked by Frequency";

// Comparison Stats Layers
comparison_stats_l1 = "";
comparison_stats_l2 = "";

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

// This object holds info regardin the user's current TumorMap session.
// It will be stored to local storage as a string constructed with JSON.
var current_session = {
	'created_attr': [],
	'shortlist_attr': [],
	'display_attr': [],
	'selection_attr': []
};

// This holds the grid of hexagon polygons on that Google Map.
var polygon_grid = [];

// This holds an object of polygons by signature name
polygons = {};

// How big is a hexagon in google maps units? This gets filled in once we have 
// the hex assignment data. (This is really the side length.)
var hex_size;

// This holds a handle for the currently enqueued view redrawing timeout.
var redraw_handle;

// This holds the next selection number to use. Start at 1 since the user sees 
// these.
var selection_next_id = 1;

// What's the minimum number of pixels that hex_size must represent at the
// current zoom level before we start drawing hex borders?
var MIN_BORDER_SIZE = 10;

// And how thick should the border be when drawn?
var HEX_STROKE_WEIGHT = 2;

// How many layers do we know how to draw at once?
var MAX_DISPLAYED_LAYERS = 2;

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

complain = function (text) {
    // Display a temporary error message to the user.
    $("#error-notification").text(text);
    $(".error").show().delay(1250).fadeOut(1000);
    
    if(console && console.error) {
        // Inform the browser console of this problem.as
        console.error(text);
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
    
    // How far apart are hexagons on our grid, horizontally (world coordinate units)?
    var hex_padding_horizontal = 0;
    
    // And vertically (world coordinate units)?
    var hex_padding_veritcal = 0;
    
    // First, what are x and y in 0-256 world coordinates fo this grid position?
    var x = column * (hex_column_width + hex_padding_horizontal);
    var y = row * (hex_height + hex_padding_veritcal);
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
        strokeColor: "#000000",
        strokeOpacity: 1.0,
        // Only turn on the border if we're big enough
        strokeWeight: hex_size_pixels < MIN_BORDER_SIZE ? 0 : HEX_STROKE_WEIGHT, 
        fillColor: "#FF0000",
        fillOpacity: 1.0
    });
    
    // Attach the hexagon to the global map
    hexagon.setMap(googlemap);
    
    // Set up the click listener to move the global info window to this hexagon
    // and display the hexagon's information
    google.maps.event.addListener(hexagon, "click", function(event) {
        if(!oper.tool_selected) {
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

function set_hexagon_stroke_weight(hexagon, weight) {
    // Given a polygon, set the weight of hexagon's border stroke, in number of
    // screen pixels.
    
    hexagon.setOptions({
        strokeWeight: weight
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
    var current_layers = shortlist;
    
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
    layer_names_sorted.push(layer_name);
    
    // Don't sort because our caller does that when they're done adding layers.

}

function add_layer_data(layer_name, data, attributes) {
    // Add a layer with the given name, with the given data to the list of 
    // available layers.
    // Attributes is an object of attributes to copy into the layer.
    // May also be used to replace layers.
    
    // This holds a boolean for if we're replacing an existing layer.
    var replacing = (layers[layer_name] != undefined);
    
    // Store the layer. Just put in the data. with_layer knows what to do if the
    // magnitude isn't filled in.
    layers[layer_name] = {
        url: undefined,
        data: data,
        magnitude: undefined
    };
	
    for(var name in attributes) {
        // Copy over each specified attribute
        layers[layer_name][name] = attributes[name];
    }
    
    if(!replacing) {
        // Add it to the sorted layer list, since it's not there yet.
        layer_names_sorted.push(layer_name);
    }

    // Don't sort because our caller does that when they're done adding layers.
}

function with_layer(layer_name, callback) {
    // Run the callback, passing it the layer (object from hex label/signature
    // to float) with the given name.
    // This is how you get layers, and allows for layers to be downloaded 
    // dynamically. 
    // have_layer must return true for the given name.
    
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

function with_layers(layer_list, callback) {
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

function make_shortlist_ui(layer_name) {
    // Return a jQuery element representing the layer with the given name in the
    // shortlist UI.
    

    // This holds the root element for this shortlist UI entry
    var root = $("<div/>").addClass("shortlist-entry");
    root.data("layer", layer_name);
    
    // If this is a selection, give the layer a special class
    // TODO: Justify not having to use with_layer because this is always known 
    // client-side
    if(layers[layer_name].selection) {
        root.addClass("selection");
    }
    
    // We have some configuration stuff and then the div from the dropdown
    // This holds all the config stuff
    var controls = $("<div/>").addClass("shortlist-controls");
    
    // Add a remove link
    var remove_link = $("<a/>").addClass("remove").attr("href", "#").text("X");
    remove_link.attr("title", "Remove from Shortlist");
    controls.append(remove_link);

    
    // Add a checkbox for whether this is enabled or not
    var checkbox = $("<input/>").attr("type", "checkbox").addClass("layer-on");
    
    controls.append(checkbox);
    
    root.append(controls);

	// If this a selection, add a special delete attribute link
	// This will remove the attribute from the shortlist and list of layers
	// This is important for saving/loading so that the user is not constantly
	// confronted with a list of created attributes that they no longer want.
    if(layers[layer_name].selection) {
        delete_link = $("<a/>").addClass("delete").attr("href", "#").text("Ø");
    	delete_link.attr("title", "Delete Attribute");
		controls.append(delete_link);
    }
    
    var contents = $("<div/>").addClass("shortlist-contents");
    
    // Add the layer name
    contents.append($("<span/>").text(layer_name));
    
    // Add all of the metadata. This is a div to hold it
    var metadata_holder = $("<div/>").addClass("metadata-holder");
    
    // Fill it in
    fill_layer_metadata(metadata_holder, layer_name);
    
    contents.append(metadata_holder);

	// Add a div to hold the filtering stuff so it wraps together.
    var filter_holder = $("<div/>").addClass("filter-holder");
    
    // Add an image label for the filter control.
    // TODO: put this in a label    
	var filter_image = $("<img/>").attr("src", "filter.svg");
    filter_image.addClass("control-icon");
	filter_image.addClass("filter-image");
    filter_image.attr("title", "Filter on Layer");
    filter_image.addClass("filter");
    
    // Add a control for filtering
    var filter_control = $("<input/>").attr("type", "checkbox");
    filter_control.addClass("filter-on");
    
    filter_holder.append(filter_image);
    filter_holder.append(filter_control);
    
    // Add a text input to specify a filtering threshold for continuous layers
    var filter_threshold = $("<input/>").addClass("filter-threshold");
    // Initialize to a reasonable value.
    filter_threshold.val(0);
    filter_holder.append(filter_threshold);
    
    // Add a select input to pick from a discrete list of values to filter on
    var filter_value = $("<select/>").addClass("filter-value");
	filter_holder.append(filter_value);

	// Add a image for the save function
	var save_filter = $("<img/>").attr("src", "save.svg");
	save_filter.addClass("save-filter");
	save_filter.attr("title", "Save Filter as Layer");

	// Add all holders to the shortlist content pane
	contents.append(filter_holder);
	contents.append(save_filter);
   
    // Add a div to contain layer settings
    var settings = $("<div/>").addClass("settings");
    
    // Add a slider for setting the min and max for drawing
    var range_slider = $("<div/>").addClass("range range-slider");
    settings.append($("<div/>").addClass("stacker").append(range_slider));
    
    // And a box that tells us what we have selected in the slider.
    var range_display = $("<div/>").addClass("range range-display");
    range_display.append($("<span/>").addClass("low"));
    range_display.append(" to ");
    range_display.append($("<span/>").addClass("high"));
    settings.append($("<div/>").addClass("stacker").append(range_display));
    
    contents.append(settings);
    
    root.append(contents);
    
    // Handle enabling and disabling
    checkbox.change(function() {
        if($(this).is(":checked") && get_current_layers().length > 
            MAX_DISPLAYED_LAYERS) {
                
            // Enabling this checkbox puts us over the edge, so un-check it
            $(this).prop("checked", false);
            
            // Skip the redraw
            return;
        }
    
        refresh();
    });
    
    // Run the removal process
    remove_link.click(function() {
        // Remove this layer from the shortlist
        shortlist.splice(shortlist.indexOf(layer_name), 1);
        
        // Remove this from the DOM
        root.remove();

        // Make the UI match the list.
        update_shortlist_ui();
        if(checkbox.is(":checked") || filter_control.is(":checked")) {
            // Re-draw the view since we were selected (as coloring or filter) 
            // before removal.
            refresh();
        }

    });

	// Only peform delete link action if this is a "selection", a user
	// selection or a set theory defined attribute
    if(layers[layer_name].selection) {
		// Run the deletion process
		delete_link.click(function() {
		    // Remove this layer from the shortlist
		    shortlist.splice(shortlist.indexOf(layer_name), 1);
		    
		    // Remove this from the DOM
		    root.remove();

		    // Make the UI match the list.
		    update_shortlist_ui();
		    if(checkbox.is(":checked") || filter_control.is(":checked")) {
		        // Re-draw the view since we were selected (as coloring or filter) 
		        // before removal.
		        refresh();
		    }

			// Remove from layers list as well
			layer_names_sorted.splice(layer_names_sorted.indexOf(layer_name), 1);
			delete layers[layer_name];

			// Alter "keep" attribute from current_session
			for (var i = 0; i < current_session.created_attr.length; i++) {
				if (current_session.created_attr[i].l_name == layer_name) {
					current_session.created_attr[i].keep = false;
					break;
				}
			}
		
			// Update the browse UI with the new layer.
			if (mutual_information_ranked == true) {
		    	update_browse_ui("mutual_information");
			}
			else {
				update_browse_ui();
			}
		});
    }

    // Functionality for turning filtering on and off
    filter_control.change(function() {
        if(filter_control.is(":checked")) {
            // First, figure out what kind of filter settings we take based on 
            // what kind of layer we are.
            with_layer(layer_name, function(layer) {
                if(have_colormap(layer_name)) {
                    // A discrete layer.
                    // Show the value picker.
                    filter_value.show();
                    
                    // Make sure we have all our options
                    if(filter_value.children().length == 0) {
                        // No options available. We have to add them.
                        // TODO: Is there a better way to do this than asking 
                        // the DOM?
                        
                        for(var i = 0; i < layer.magnitude + 1; i++) {
                            // Make an option for each value.
                            var option = $("<option/>").attr("value", i);
                            
                            if(colormaps[layer_name].hasOwnProperty(i)) {
                                // We have a real name for this value
                                option.text(colormaps[layer_name][i].name);
                            } else {
                                // No name. Use the number.
                                option.text(i);
                            }
                            
                            filter_value.append(option);
                            
                        }
                        
                        // Select the last option, so that 1 on 0/1 layers will 
                        // be selected by default.
                        filter_value.val(
                            filter_value.children().last().attr("value"));
                        
                    }
                } else {
                    // Not a discrete layer, so we take a threshold.
                    filter_threshold.show();
                }
                
				save_filter.show ();
						
				save_filter.button().click(function() {
				// Configure Save Filter Buttons

					// Get selected value
					var selected = filter_value.prop("selectedIndex");
					var value = filter_value.val();

					var signatures = [];

					// Gather Tumor-ID Signatures with value and push to "signatures"
					for (hex in polygons){
						if (layer.data[hex] == value){
								signatures.push(hex);
						}		
					}

					// Create Layer
					if (created == false) {
						select_list (signatures, "user selection");	
						created = true;
					}
					created = false;			
				}); 	
			    
	
				// Now that the right controls are there, assume they have 
                refresh();

            });
        } else {
			created = false;
            // Hide the filtering settings
            filter_value.hide();
            filter_threshold.hide();
            save_filter.hide();
            // Draw view since we're no longer filtering on this layer.
            refresh();
        }
    });
    
    // Respond to changes to filter configuration
    filter_value.change(refresh);
    
    // TODO: Add a longer delay before refreshing here so the user can type more
    // interactively.
    filter_threshold.keyup(refresh);
    
    // Configure the range slider
    
    // First we need a function to update the range display, which we will run 
    // on change and while sliding (to catch both user-initiated and 
    //programmatic changes).
    var update_range_display = function(event, ui) {
        range_display.find(".low").text(ui.values[0].toFixed(3));
        range_display.find(".high").text(ui.values[1].toFixed(3));
    }
    
    range_slider.slider({
        range: true,
        min: -1,
        max: 1,
        values: [-1, 1],
        step: 1E-9, // Ought to be fine enough
        slide: update_range_display,
        change: update_range_display,
        stop: function(event, ui) {
            // The user has finished sliding
            // Draw the view. We will be asked for our values
            refresh();
        }
    });
    
    // When we have time, go figure out whether the slider should be here, and 
    // what its end values should be.
    reset_slider(layer_name, root)
    
    return root;
}


// Create GUI for Comparison Statistics 
function create_comparison_stats_ui () {
	// Returns a Jquery element that is then prepended to the existing 
	// set theory drop-down menu	

    // This holds the root element for this set operation UI 
    var root = $("<div/>").addClass("comparison-stats-entry");
	
	// Add Drop Downs to hold the selected layers and and selected data values 
    var comparison_stats_A = $("<select/>").addClass("comparison-stats-value");
	var comparison_stats_B = $("<select/>").addClass("comparison-stats-value");	

	// Compute Button
	var comparison_stats_button = $("<input/>").attr("type", "button");
	comparison_stats_button.addClass ("comparison-stats-button");
	comparison_stats_button.prop('value','Sort Attributes');

	// Append to Root
	root.append (comparison_stats_A);
	root.append (comparison_stats_B);
	root.append (comparison_stats_button);

	return root;
}

function show_comparison_stats_drop_down () {
	// Show Comparison Stats Drop Down Menu
	$(".comparison-stats.dropdown").show();
}

function hide_comparison_stats_drop_down () {
	// Hide Comparison Stats Drop Down Menu
	$(".comparison-stats.dropdown").hide();
}

function reset_comparison_stats_counter() {
	comparison_stats_clicks++;
}


update_comparison_stats_drop_down = function  () {

	// This is the onchange command for the drop down displaying the 
	// different stats query  functions. It is called whenever the user changes
	// the stats query operation.

	// Check if the selection value is that of one of set operation functions

	if (first_opening_comparison_stats == true) {
		var drop_downs = document.getElementsByClassName("comparison-stats-value");
		// Set the default value for the drop down, holding the selected layers
		var default_value = document.createElement("option");
		default_value.text = "All Tumors";
		default_value.value = 0;
		drop_downs[0].add(default_value);

		var default_value2 = document.createElement("option");
		default_value2.text = "All Tumors";
		default_value2.value = 0;
		drop_downs[1].add(default_value2);
				
		// Prevent from adding the default value again
		first_opening_comparison_stats = false;
	}
	
	// Make the drop downs that hold layer names and data values visible
	var drop_downs = document.getElementsByClassName("comparison-stats-value");
	drop_downs[0].style.visibility="visible";
	drop_downs[1].style.visibility="visible";

	var comparison_stats_button = document.getElementsByClassName("comparison-stats-button");
	comparison_stats_button[0].style.visibility = "visible";

}	



function update_comparison_stats_selections () {
	// This function is called when the shorlist is changed.
	// It appropriately updates the drop down containing the list of layers
	// to match the layers found in the shortlist.

	// Get the list of all layers
	var shortlist_layers = [];
	$("#shortlist").children().each(function(index, element) {
	 	// Get the layer name
        var layer_name = $(element).data("layer");
		shortlist_layers.push(layer_name);
	});

	// Get a list of all drop downs that contain layer names
	var drop_downs = document.getElementsByClassName("comparison-stats-value");

	// Remove all existing layer names from both dropdowns
	var length = drop_downs[0].options.length;
	do{
		drop_downs[0].remove(0);
		length--;		
	}
	while (length > 0);
	var length = drop_downs[1].options.length;
	do{
		drop_downs[1].remove(0);
		length--;		
	}
	while (length > 0);

	// Add the default values that were stripped in the last step.
	var default_value = document.createElement("option");
	default_value.text = "All Tumors";
	default_value.value = 0;
	drop_downs[0].add(default_value);

	var default_value2 = document.createElement("option");
	default_value2.text = "All Tumors";
	default_value2.value = 0;
	drop_downs[1].add(default_value2);

	// Prevent from adding the default value again
	first_opening_comparison_stats = false;
	
	// Add the layer names from the shortlist to the drop downs that store
	// layer names.		
	for (var i = 0; i < drop_downs.length; i++){
		for (var j = 0; j < shortlist_layers.length; j++) {
			var option = document.createElement("option");
			option.text = shortlist_layers[j];
			option.value = j+1;
			drop_downs[i].add(option);
		}
	}

}

// Replacement Code for New Consolidated Association Stats GUI
// Create GUI for Sort Attributes GUI
function create_sort_attributes_ui () {
	// Returns a Jquery element that is then prepended to the existing 
	// set theory drop-down menu	

    // This holds the root element for this set operation UI 
    var root = $("<div/>").addClass("sort-attributes-entry");

	// Load all attributes currently in the shortlist to the
	// picklist with the id 'sort-attributes-list' 
	update_sort_attributes_selections();
	
	// Set up the listener on that picklist
	$("#sort-attributes-list").change(update_sort_attributes_drop_down);

	// Hide the layout awareness controls
	$("#layout-awareness").hide();
	
	// Hide Layout (In)dependent Options
	hide_layout_independent();
	hide_layout_dependent();
	
	// Attach listeners for layout dependence option. Radio buttons only "change"
	// on selection, so we sort of need to think about all of them at once.
	$("input[name=layout-awareness]:radio").change(function() {
	    if($(this).val() == "true") {
	        // We want the layout dependent stuff.
	        hide_layout_independent();
	        show_layout_dependent();
	    } else {
	        // We want the layout independent stuff.
	        hide_layout_dependent();
	        show_layout_independent();
	    }
    });

	// Sort Button
	var sort_attributes_button = $("<input/>").attr("type", "button");
	sort_attributes_button.addClass ("sort-attributes-button");
	sort_attributes_button.prop('value','Sort Attributes');
	sort_attributes_button.hide();

	// Append User Inputs to jQuery Root
	root.append(sort_attributes_button);
	
	return root;
}

function show_sort_attributes_drop_down () {
	// Show "Sort Attributes" Popup GUI
	$(".sort-attributes.dropdown").show();

}

function hide_sort_attributes_drop_down () {
	// Hide "Sort Attributes" Popup GUI
	$(".sort-attributes.dropdown").hide();
	hide_layout_independent();
	hide_layout_dependent();

	reset_sort_attributes_panel();
}

function reset_sort_attributes_panel () {
	// Reset the sort attriubtes panel so that radio buttons are hidden,
	// the "layout aware" radio button is selected by default, hides the
	// "sort attributes" button, and sets the pick list to "select pivot".

	// TODO: Replacement code neede for new input mechanisms
	// Hide the Radio Buttons for "Layout Aware" & "Layout Independent"
	$("#layout-awareness").hide();
	// Uncheck them all.
	$("#layout-awareness > :checked").prop("checked", false);
	
	// Hide the "Sort Attributes" Button
	$(".sort-attributes-button").hide();

	// Hide Layout (In)dependent Options
	hide_layout_independent();
	hide_layout_dependent();

    // Set the "Select Pivot" drop down to the default value
    $("#sort-attributes-list").val("");
}

function reset_sort_attributes_counter() {
	sort_attributes_clicks++;
}

function get_sort_attributes_selection () {
	// For the new dop-down GUI for sort attributes selection
	// we neeed a function to determine which mutual information query is selected.
	// This way we can display the appropriate divs.	
	
	return $("#sort-attributes-list").val();
}

function update_sort_attributes_drop_down () {
	
	// This is the change handler for the drop down displaying the 
	// different sort attributes functions. 

	// Get the value of the attribute selection made by the user.
	var selection = get_sort_attributes_selection();
	
	if (selection == "") {
	    // Default Selected
		reset_sort_attributes_panel();
	} else {
	    // We've selected an actual layer
	    
	    // Set to default mode of layout aware.
	    $("#sort-layout-aware").prop("checked", true);
	    show_layout_dependent();
	    
		// Show radio buttons & text labels
		$("#layout-awareness").show();
		
		// Show the "Sort Attributes" Button
		$(".sort-attributes-button").show();
	}

}

function update_sort_attributes_selections () {
	// This function is called when the shortlist is changed and to initialize
	// the configuration of the "Select Pivot Attribute" picklist.
	// It appropriately updates the drop down containing the list of layers
	// to match the layers found in the shortlist.

	// Get the list of all layers in the shortlist except those that are
	// user creations (for which there are no stats).
	var shortlist_layers = [];
	$("#shortlist").children().each(function(index, element) {
	 	// Get the layer name
        var layer_name = $(element).data("layer");
		if (!layers[layer_name].selection) {
			shortlist_layers.push(layer_name);
		}
	});


	// Get a the "Select Pivot Attribute Dropdown"
	var pivot_dropdown = document.getElementById("sort-attributes-list");
	
	if(pivot_dropdown == undefined) {
        // Dropdown has not yet been created. Don't try and mess with it.
        // TODO: Why not just always have it exist?
        return;
    }
	
	// Remove all existing layer names
	var length = pivot_dropdown.options.length;
	do{
		pivot_dropdown.remove(0);
		length--;		
	}
	while (length > 0);

	// Add the default value that were stripped in the last step.
	var default_value = document.createElement("option");
	default_value.text = "Select Pivot Attribute";
	default_value.value = "";
	pivot_dropdown.add(default_value);
	
	// Add the layer names from the shortlist to the picklist. Make sure to put
	// layer names in the values since the text gets mangled by the html parser.
	for (var j = 0; j < shortlist_layers.length; j++) {
		var option = document.createElement("option");
		option.text = shortlist_layers[j];
		option.value = shortlist_layers[j];
		pivot_dropdown.add(option);
	}
}

function show_layout_independent () {
	// Show Layout Independent Options "All Attributes", "Categorical",
	// "Continuous", etc.

    // Show everything
	$("#layout-independent-options").show();
	
	// Re-enable everything
	$("#layout-independent-options > input").prop("disabled", false);

    // Disable the things that don't work with this layer.
    
    // This doesn't work with anything yet.
    $("#use-all-attributes").prop("disabled", true);
    
    // What layer is selected?
    var selected_layer = $("#sort-attributes-list").val();
    
    if (categorical_layers.indexOf(selected_layer) < 0 && 
        binary_layers.indexOf(selected_layer) < 0){
		
		$("#use-categorical").prop("disabled", true);	
	}
	if (cont_layers.indexOf(selected_layer) < 0) {
		$("#use-continuous").prop("disabled", true);
	}
    
    // TODO: Have a better layer type system than scanning huge arrays of all
    // the layers in each type.

	// TODO: Lift Restrictions on Checkboxes

}

function hide_layout_independent () {
	// Hide Layout Independent Options "All Attributes", "Categorical",
	// "Continuous", etc.
	
	// Hide everything
	$("#layout-independent-options").hide();
	
	// Uncheck all the checked things
	$("#layout-independent-options > :checked").prop("checked", false);
	
}

function show_layout_dependent() {
    // Show options for layout dependent pivot sort
    $("#layout-dependent-options").show();
}

function hide_layout_dependent() {
    // Hide options for layout dependent pivot sort
    $("#layout-dependent-options").hide();
    
    // Uncheck all the checked things
	$("#layout-dependent-options > :checked").prop("checked", false);
}


// Set Operation GUI
function get_set_operation_selection () {
	// For the new dop-down GUI for set operation selection
	// we neeed a function to determine which set operation is selected.
	// This way we can display the appropriate divs.	
	
	// Drop Down List & Index for Selected Element
	var drop_down = document.getElementById("set-operations-list");
	var index = drop_down.selectedIndex;
	var selection = drop_down.options[index];
	
	return selection;	
}

function show_set_operation_drop_down () {
	// Show Set Operation Drop Down Menu
	$(".set-operation.dropdown").show();

}


hide_set_operation_drop_down = function () {
	// Hide Set Operation Drop Down Menu
	$(".set-operation.dropdown").hide();

	var drop_downs = document.getElementsByClassName("set-operation-value");
	for (var i = 0; i < drop_downs.length; i++) {
		drop_downs[i].style.visibility="hidden";
	}

	// Hide the Data Values for the Selected Layers
	var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");
	for (var i = 0; i < drop_downs_layer_values.length; i++) {
		drop_downs_layer_values[i].style.visibility="hidden";
	}

	// Hide the Compute Button
	var compute_button = document.getElementsByClassName("compute-button");
	compute_button[0].style.visibility = "hidden";

	// Set the "Select Layer" drop down to the default value
	var list = document.getElementById("set-operations-list");
	list.selectedIndex = 0;
	
	var list_value = document.getElementsByClassName("set-operation-value");
	list_value[0].selectedIndex = 0;
	list_value[1].selectedIndex = 0;

	// Remove all elements from drop downs holding the data values for the 
	// selected layers. This way there are no values presented when the user
	// clicks on the set operation button to open it again.
	var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");
	var length = set_operation_layer_values[0].options.length;
	do{
		set_operation_layer_values[0].remove(0);
		length--;		
	}
	while (length > 0);

	var length = set_operation_layer_values[1].options.length;
	do{
		set_operation_layer_values[1].remove(0);
		length--;		
	}
	while (length > 0);
	
}

function reset_set_operation_counter () {
	set_operation_clicks++;
}

function create_set_operation_ui () {
	// Returns a Jquery element that is then prepended to the existing 
	// set theory drop-down menu	

    // This holds the root element for this set operation UI 
    var root = $("<div/>").addClass("set-operation-entry");
	
	// Add Drop Downs to hold the selected layers and and selected data values 
    var set_theory_value1 = $("<select/>").addClass("set-operation-value");
	var set_theory_layer_value1 = $("<select/>").addClass("set-operation-layer-value");
	var set_theory_value2 = $("<select/>").addClass("set-operation-value");	
	var set_theory_layer_value2 = $("<select/>").addClass("set-operation-layer-value");

	var compute_button = $("<input/>").attr("type", "button");
	compute_button.addClass ("compute-button");

	// Append to Root
	root.append (set_theory_value1);
	root.append (set_theory_layer_value1);
	root.append (set_theory_value2);
	root.append (set_theory_layer_value2);
	root.append (compute_button);

	return root;
}

update_set_operation_drop_down = function () {
	// This is the onchange command for the drop down displaying the 
	// different set operation functions. It is called whenever the user changes
	// the selected set operation.

	// Get the value of the set operation selection made by the user.
	var selection = get_set_operation_selection();
	var value = selection.value;	
	// Check if the selectin value is that of one of set operation functions
	if (selection.value == 1 || selection.value == 2 
		|| selection.value == 3 || selection.value == 4
		|| selection.value == 5){
			// Make the drop downs that hold layer names and data values visible
			var drop_downs = document.getElementsByClassName("set-operation-value");
			var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");

			for (var i = 0; i < drop_downs.length; i++) {
				drop_downs[i].style.visibility="visible";
			}
			
			for (var i = 0; i < drop_downs_layer_values.length; i++) {
				drop_downs_layer_values[i].style.visibility="visible";
			}

			var compute_button = document.getElementsByClassName("compute-button");
			compute_button[0].style.visibility = "visible";
			compute_button[0].value = "Compute Set Operation";

			if (first_opening == true) {
				// Set the default value for the drop down, holding the selected layers
				var default_value = document.createElement("option");
				default_value.text = "Select Attribute 1";
				default_value.value = 0;
				drop_downs[0].add(default_value);

				var default_value2 = document.createElement("option");
				default_value2.text = "Select Attribute 2";
				default_value2.value = 0;
				drop_downs[1].add(default_value2);
				
				// Prevent from adding the default value again
				first_opening = false;
			}

			// Hide the second set of drop downs if "Not:" is selected
			if (selection.value == 5) {
				drop_downs[1].style.visibility="hidden";
				drop_downs_layer_values[1].style.visibility="hidden";
			}
	}	
	else {
		// If the user has the default value selected, hide all drop downs
		var drop_downs = document.getElementsByClassName("set-operation-value");
		for (var i = 0; i < drop_downs.length; i++) {
			drop_downs[i].style.visibility="hidden";
		}
		var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");
		for (var i = 0; i < drop_downs_layer_values.length; i++) {
				drop_downs_layer_values[i].style.visibility="hidden";
		}
		var compute_button = document.getElementsByClassName("compute-button");
			compute_button[0].style.visibility = "hidden";
	}
}

function update_set_operation_selections () {
	// This function is called when the shorlist is changed.
	// It appropriately updates the drop down containing the list of layers
	// to match the layers found in the shortlist.

	// Get the list of all layers
	var layers = [];
	$("#shortlist").children().each(function(index, element) {
	 	// Get the layer name
        var layer_name = $(element).data("layer");
		// If the attribute does not have continuous values add it to the drop
		// downs. (There is no set theory for continuous attributes).
        if (cont_layers.indexOf (layer_name) < 0) {
			layers.push(layer_name);
		}
	});

	// Get a list of all drop downs that contain layer names
	var drop_downs = document.getElementsByClassName("set-operation-value");

	// Remove all existing layer names from both dropdowns
	var length = drop_downs[0].options.length;
	do{
		drop_downs[0].remove(0);
		length--;		
	}
	while (length > 0);
	var length = drop_downs[1].options.length;
	do{
		drop_downs[1].remove(0);
		length--;		
	}
	while (length > 0);

	// Add the default values that were stripped in the last step.
	var default_value = document.createElement("option");
	default_value.text = "Select Attribute 1";
	default_value.value = 0;
	drop_downs[0].add(default_value);

	var default_value2 = document.createElement("option");
	default_value2.text = "Select Attribute 2";
	default_value2.value = 0;
	drop_downs[1].add(default_value2);
	
	first_opening = false;
	
	// Add the layer names from the shortlist to the drop downs that store
	// layer names.		
	for (var i = 0; i < drop_downs.length; i++){
		for (var j = 0; j < layers.length; j++) {
			var option = document.createElement("option");
			option.text = layers[j];
			option.value = j+1;
			drop_downs[i].add(option);
		}
	}

	// Remove all elements from drop downs holding the data values for the 
	// selected layers. This way there are no values presented when the user
	// clicks on the set operation button to open it again.
	var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");
	var length = set_operation_layer_values[0].options.length;
	do{
		set_operation_layer_values[0].remove(0);
		length--;		
	}
	while (length > 0);

	var length = set_operation_layer_values[1].options.length;
	do{
		set_operation_layer_values[1].remove(0);
		length--;		
	}
	while (length > 0);

	// Call the function containing onchange commands for these dropdowns.
	// This way the data values are updated according the the selected layer.
	update_set_operation_data_values ();
}

function update_set_operation_data_values () {
	// Define the onchange commands for the drop downs that hold layer names.
	// This way the data values are updated according the the selected layer.

	// Get all drop down elements
	var selected_function = document.getElementById ("set-operations-list");
	var drop_downs = document.getElementsByClassName("set-operation-value");
	var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");

	// The "Select Layer1" Dropdown onchange function
	drop_downs[0].onchange = function(){
		// Strip current values of the data value dropdown
		var length = set_operation_layer_values[0].options.length;
		do{
			set_operation_layer_values[0].remove(0);
			length--;		
		}
		while (length > 0);
	
		// Add the data values depending on the selected layer
		var selectedIndex = drop_downs[0].selectedIndex;
		var layer_name = drop_downs[0].options[selectedIndex].text;
		var set_operation_data_value_select = set_operation_layer_values[0];
		create_set_operation_pick_list(set_operation_data_value_select, layer_name);
	};

	// The "Select Layer2" Dropdown onchange function
	drop_downs[1].onchange = function(){
		// Strip current values of the data value dropdown
		var length = set_operation_layer_values[1].options.length;
		do{
			set_operation_layer_values[1].remove(0);
			length--;		
		}
		while (length > 0);

		// Add the data values depending on the selected layer
		var selectedIndex = drop_downs[1].selectedIndex;
		var layer_name = drop_downs[1].options[selectedIndex].text;
		var set_operation_data_value_select = set_operation_layer_values[1];
		create_set_operation_pick_list(set_operation_data_value_select, layer_name);
	};

}

function create_set_operation_pick_list(value,layer_object) {

	// We must create a drop down containing the data values for the selected
	// layer.

	// The Javascript "select" element that contains the data values
	// is passed as "value" and the selected layer is passed as "layer_object". 

	// First, figure out what kind of filter settings we take based on 
	// what kind of layer we are.
	with_layer(layer_object, function(layer) {
                    
             // No options available. We have to add them.
             for(var i = 0; i < layer.magnitude + 1; i++) {
             	// Make an option for each value;
				var option = document.createElement("option");
				option.value = i;
                            
                if(colormaps[layer_object].hasOwnProperty(i)) {
                	// We have a real name for this value
                    option.text = (colormaps[layer_object][i].name);
                 } else {
                     // No name. Use the number.
                     option.text = i;
                     }  
                 value.add(option);
     
                 // Select the last option, so that 1 on 0/1 layers will 
                 // be selected by default.
				 var last_index = value.options.length - 1;
                 value.selectedIndex = last_index;   
                }                
            // Now that the right controls are there, assume they have 
            refresh();
     });
}


function update_shortlist_ui() {
    // Go through the shortlist and make sure each layer there has an entry in 
    // the shortlist UI, and that each UI element has an entry in the shortlist.
    // Also make sure the metadata for all existing layers is up to date.
    
    // Clear the existing UI lookup table
    shortlist_ui = {};
    
    for(var i = 0; i < shortlist.length; i++) {
        // For each shortlist entry, put a false in the lookup table
        shortlist_ui[shortlist[i]] = false;
    }
    
    
    $("#shortlist").children().each(function(index, element) {
        if(shortlist_ui[$(element).data("layer")] === false) {
            // There's a space for this element: it's still in the shortlist
            
            // Fill it in
            shortlist_ui[$(element).data("layer")] = $(element);
            
            // Update the metadata in the element. It make have changed due to
            // statistics info coming back.
            fill_layer_metadata($(element).find(".metadata-holder"), 
                $(element).data("layer"));
        } else {
            // It wasn't in the shortlist, so get rid of it.
            $(element).remove();
        }
    });
    
    for(var layer_name in shortlist_ui) {
        // For each entry in the lookup table
        if(shortlist_ui[layer_name] === false) {
             // If it's still false, make a UI element for it.
             shortlist_ui[layer_name] = make_shortlist_ui(layer_name);
             $("#shortlist").prepend(shortlist_ui[layer_name]);
             
             // Check it's box if possible
             shortlist_ui[layer_name].find(".layer-on").click();
        }
    }
    
    // Make things re-orderable
    // Be sure to re-draw the view if the order changes, after the user puts 
    // things down.
    $("#shortlist").sortable({
        update: refresh,
        // Sort by the part with the lines icon, so we can still select text.
        handle: ".shortlist-controls" 
    });

	// Update Values for GUI Dropdowns
	update_set_operation_selections ();
	update_comparison_stats_selections ();
	update_sort_attributes_selections (); 
}	

function compute_intersection (values, intersection_layer_names, name) {
	// A function that will take a list of layer names
	// that have been selected for the intersection utility.
	// Fetches the respective layers and list of tumor ids.
	// Then compares data elements of the same tumor id
	// between both layers. Adds these hexes to a new layer
	// for visualization
	
	with_layers (intersection_layer_names, function (intersection_layers) {
		//Array of signatures that intersect 
		var intersection_signatures = [];

		// Gather Tumor-ID Signatures.
		for (hex in polygons)
		{
			if (intersection_layers[0].data[hex] == values[0] && intersection_layers[1].data[hex] == values[1]){
				intersection_signatures.push(hex);
			}		
		}

		// Store the recorded layer name for current_session info or utilize
		// the predetermined name (if loading a session).
		var layer_name;
		if (name != undefined) {
			layer_name = select_list (intersection_signatures, "intersection", undefined, name, false);
		}
		else {
			layer_name = select_list (intersection_signatures, "intersection");
		}
		// Store current session info about the newly created attributes
		var recorded_set_attr = [];
		for (var i = 0; i < current_session.created_attr.length; i++) {
			var existing_name = current_session.created_attr[i].l_name;
			recorded_set_attr.push(existing_name);
		}
		if (layer_name in recorded_set_attr == false && layer_name != undefined){
			current_session.created_attr.push({"set":"intersection", 
												"l_name":layer_name,
												"layers":intersection_layer_names,
												"val":values,
												"keep": true
												});
		}
	});
}

function compute_union (values, union_layer_names, name) {
	// A function that will take a list of layer names
	// that have been selected for the union utility.
	// Fetches the respective layers and list of tumor ids.
	// Then compares data elements of the same tumor id
	// between both layers. Adds these hexes to a new layer
	// for visualization
	
	with_layers (union_layer_names, function (union_layers) {
		//Array of signatures 
		var union_signatures = [];
		// Gather Tumor-ID Signatures.
		for (hex in polygons)
		{
			// Union Function
			if (union_layers[0].data[hex] == values[0] || union_layers[1].data[hex] == values[1]){
				union_signatures.push(hex);
			}		
		}

		// Store the recorded layer name for current_session info or utilize
		// the predetermined name (if loading a session).
		if (name != undefined) {
			var layer_name = select_list (union_signatures, "union", undefined, name, false);
		}
		else {
			var layer_name = select_list (union_signatures, "union");
		}

		// Store current session info about the newly created attributes
		var recorded_set_attr = [];
		for (var i = 0; i < current_session.created_attr.length; i++) {
			var existing_name = current_session.created_attr[i].l_name;
			recorded_set_attr.push(existing_name);
		}
		if (layer_name in recorded_set_attr == false && layer_name != undefined){
			current_session.created_attr.push({"set":"union", 
												"l_name":layer_name,
												"layers":union_layer_names,
												"val":values,
												"keep": true
												});
		}
	});
}

function compute_set_difference (values, set_difference_layer_names, name) {
	// A function that will take a list of layer names
	// that have been selected for the set difference utility.
	// Fetches the respective layers and list of tumor ids.
	// Then compares data elements of the same tumor id
	// between both layers. Adds these hexes to a new layer
	// for visualization
	
	with_layers (set_difference_layer_names, function (set_difference_layers) {
		//Array of signatures  
		var set_difference_signatures = [];
	
		// Gather Tumor-ID Signatures.
		for (hex in polygons)
		{
			// Set Difference Function
			if (set_difference_layers[0].data[hex] == values[0] && 
				set_difference_layers[1].data[hex] != values[1]){
				set_difference_signatures.push(hex);
			}
		}

		// Store the recorded layer name for current_session info or utilize
		// the predetermined name (if loading a session).
		var layer_name;
		if (name != undefined) {
			layer_name = select_list (set_difference_signatures, "set difference", undefined, name, false);
		}
		else {
			layer_name = select_list (set_difference_signatures, "set difference");
		}

		// Store current session info about the newly created attributes
		var recorded_set_attr = [];
		for (var i = 0; i < current_session.created_attr.length; i++) {
			var existing_name = current_session.created_attr[i].l_name;
			recorded_set_attr.push(existing_name);
		}
		if (layer_name in recorded_set_attr == false && layer_name != undefined){
			current_session.created_attr.push({"set":"set difference", 
												"l_name":layer_name,
												"layers":set_difference_layer_names,
												"val":values,
												"keep": true
												});
		}
	});
}

function compute_symmetric_difference (values, symmetric_difference_layer_names, name) {
	// A function that will take a list of layer names
	// that have been selected for the set difference utility.
	// Fetches the respective layers and list of tumor ids.
	// Then compares data elements of the same tumor id
	// between both layers. Adds these hexes to a new layer
	// for visualization

	with_layers (symmetric_difference_layer_names, function (symmetric_difference_layers) {
		//Array of signatures 
		var symmetric_difference_signatures = [];
	
		// Gather Tumor-ID Signatures.
		for (hex in polygons)
		{
			// Symmetric Difference Function
			if (symmetric_difference_layers[0].data[hex] == values[0] && 
				symmetric_difference_layers[1].data[hex] != values[1]){
				symmetric_difference_signatures.push(hex);
			}
			if (symmetric_difference_layers[0].data[hex] != values[0] &&
				symmetric_difference_layers[1].data[hex] == values[1]){
				symmetric_difference_signatures.push(hex);
			}
		}
		// Store the recorded layer name for current_session info or utilize
		// the predetermined name (if loading a session).
		var layer_name;
		if (name != undefined) {
			layer_name = select_list (symmetric_difference_signatures, "symmetric difference", undefined, name, false);
		}
		else {
			layer_name = select_list (symmetric_difference_signatures, "symmetric difference");
		}

		// Store current session info about the newly created attributes
		var recorded_set_attr = [];
		for (var i = 0; i < current_session.created_attr.length; i++) {
			var existing_name = current_session.created_attr[i].l_name;
			recorded_set_attr.push(existing_name);
		}
		if (layer_name in recorded_set_attr == false && layer_name != undefined){
			current_session.created_attr.push({"set":"symmetric difference", 
												"l_name":layer_name,
												"layers":symmetric_difference_layer_names,
												"val":values,
												"keep": true
												});
		}
	});
}

function compute_absolute_complement (values, absolute_complement_layer_names, name) {
	// A function that will take a list of layer names
	// that have been selected for the set difference utility.
	// Fetches the respective layers and list of tumor ids.
	// Then compares data elements of the same tumor id
	// between both layers. Adds these hexes to a new layer
	// for visualization

	with_layers (absolute_complement_layer_names, function (absolute_complement_layers) {
		//Array of signatures 
		var absolute_complement_signatures = [];
	
		// Gather Tumor-ID Signatures.
		for (hex in polygons)
		{
			// Absolute Complement Function
			if (absolute_complement_layers[0].data[hex] != values[0]) {
				absolute_complement_signatures.push(hex);
			}
		}
	
		// Store the recorded layer name for current_session info or utilize
		// the predetermined name (if loading a session).
		var layer_name;
		if (name != undefined) {
			layer_name = select_list (absolute_complement_signatures, "absolute complement", undefined, name, false);
		}
		else {
			layer_name = select_list (absolute_complement_signatures, "absolute complement");
		}

		// Store current session info about the newly created attributes
		var recorded_set_attr = [];
		for (var i = 0; i < current_session.created_attr.length; i++) {
			var existing_name = current_session.created_attr[i].l_name;
			recorded_set_attr.push(existing_name);
		}
		if (layer_name in recorded_set_attr == false && layer_name != undefined){
			current_session.created_attr.push({"set":"absolute complement", 
											"l_name":layer_name,
											"layers":absolute_complement_layer_names,
											"val":values,
											"keep": true
											});
		}

	});
}

function layer_sort_order_clumpiness_value(a, b) {
    // A sort function defined on layer names.
    // Return <0 if a belongs before b, >0 if a belongs after
    // b, and 0 if their order doesn't matter.
    
    // Sort by selection status, clumpiness,
    // then (for binary layers that are not selections) the frequency of the
    // less common value, then alphabetically by name if all else fails.

    // Note that we can consult the layer metadata "n" and "positives" fields to
    // calculate the frequency of the least common value in binary layers,
    // without downloading them.
    
    if(layers[a].selection && !layers[b].selection) {
        // a is a selection and b isn't, so put a first.
        return -1;
    } else if(layers[b].selection && !layers[a].selection) {
        // b is a selection and a isn't, so put b first.
        return 1;
    }
		
	if(layers[a].clumpiness > layers[b].clumpiness) {
		// a has a higher clumpiness score, so put it first.
		return -1;
	} else if(layers[b].clumpiness > layers[a].clumpiness) {
		// b has a higher clumpiness score. Put it first instead.
		return 1;
	} else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
		// a has a clumpiness score and b doesn't, so put a first
		return -1;
	} else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
		// b has a clumpiness score and a doesn't, so put b first.
		return 1;
	}			
		
	if(!layers[a].selection && !isNaN(layers[a].positives) && layers[a].n > 0 &&
	!layers[b].selection && !isNaN(layers[b].positives) && 
	layers[b].n > 0) {
		    
	// We have checked to see each layer is supposed to be bianry layer
	// without downloading.  TODO: This is kind of a hack. Redesign the
	// whole system with a proper concept of layer type.
		    
	// We've also verified they both have some data in them. Otherwise we
	// might divide by 0 trying to calculate frequency.
		        
	// Two binary layers (not selections).
	// Compute the frequency of the least common value for each
		    
	// This is the frequency of the least common value in a (will be <=1/2)
	var minor_frequency_a = layers[a].positives / layers[a].n;
	if(minor_frequency_a > 0.5) {
		minor_frequency_a = 1 - minor_frequency_a;
	}
		    
	// And this is the same frequency for the b layer
	var minor_frequency_b = layers[b].positives / layers[b].n;
	if(minor_frequency_b > 0.5) {
		minor_frequency_b = 1 - minor_frequency_b;
	}

	if(minor_frequency_a > minor_frequency_b) {
		// a is more evenly split, so put it first
		return -1;
	} else if(minor_frequency_a < minor_frequency_b) {
		// b is more evenly split, so put it first
		return 1;
	} 
		   
	} else if (!layers[a].selection && !isNaN(layers[a].positives) && 
	layers[a].n > 0) {
		    
	// a is a binary layer we can nicely sort by minor value frequency, but
	// b isn't. Put a first so that we can avoid intransitive sort cycles.
		    
	// Example: X and Z are binary layers, Y is a non-binary layer, Y comes
	// after X and before Z by name ordering, but Z comes before X by minor
	// frequency ordering. This sort is impossible.
		    
	// The solution is to put both X and Z in front of Y, because they're
	// more interesting.
		    
	return -1;
		
	} else if (!layers[b].selection && !isNaN(layers[b].positives) && 
		layers[b].n > 0) {
		    
	// b is a binary layer that we can evaluate based on minor value
	// frequency, but a isn't. Put b first.
		    
	return 1;
		    
	}
    // We couldn't find a difference in selection status, p-value, or clumpiness
    // score, or the binary layer minor value frequency, or whether each layer
    // *had* a binary layer minor value frequency, so use lexicographic ordering
    // on the name.
    return a.localeCompare(b);
    
}

function layer_sort_order_p_value(a, b) {
    // A sort function defined on layer names.
    // Return <0 if a belongs before b, >0 if a belongs after
    // b, and 0 if their order doesn't matter.
    
    // Sort by selection status, then r_value, then p_value, then clumpiness,
    // then (for binary layers that are not selections) the frequency of the
    // less common value, then alphabetically by name if all else fails.

    // Note that we can consult the layer metadata "n" and "positives" fields to
    // calculate the frequency of the least common value in binary layers,
    // without downloading them.
    
    if(layers[a].selection && !layers[b].selection) {
        // a is a selection and b isn't, so put a first.
        return -1;
    } else if(layers[b].selection && !layers[a].selection) {
        // b is a selection and a isn't, so put b first.
        return 1;
    }

	if(layers[a].p_value < layers[b].p_value) {
		// a has a lower p value, so put it first.
		return -1;
	} else if(layers[b].p_value < layers[a].p_value) {
		// b has a lower p value. Put it first instead.
		return 1;
	} else if(isNaN(layers[b].p_value) && !isNaN(layers[a].p_value)) {
		// a has a p value and b doesn't, so put a first
		return -1;
	} else if(!isNaN(layers[b].p_value) && isNaN(layers[a].p_value)) {
		// b has a p value and a doesn't, so put b first.
		return 1;
	}
		
	if(layers[a].clumpiness > layers[b].clumpiness) {
		// a has a higher clumpiness score, so put it first.
		return -1;
	} else if(layers[b].clumpiness > layers[a].clumpiness) {
		// b has a higher clumpiness score. Put it first instead.
		return 1;
	} else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
		// a has a clumpiness score and b doesn't, so put a first
		return -1;
	} else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
		// b has a clumpiness score and a doesn't, so put b first.
		return 1;
	}	

		if(!layers[a].selection && !isNaN(layers[a].positives) && layers[a].n > 0 &&
		    !layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // We have checked to see each layer is supposed to be bianry layer
		    // without downloading.  TODO: This is kind of a hack. Redesign the
		    // whole system with a proper concept of layer type.
		    
		    // We've also verified they both have some data in them. Otherwise we
		    // might divide by 0 trying to calculate frequency.
		        
		    // Two binary layers (not selections).
		    // Compute the frequency of the least common value for each
		    
		    // This is the frequency of the least common value in a (will be <=1/2)
		    var minor_frequency_a = layers[a].positives / layers[a].n;
		    if(minor_frequency_a > 0.5) {
		        minor_frequency_a = 1 - minor_frequency_a;
		    }
		    
		    // And this is the same frequency for the b layer
		    var minor_frequency_b = layers[b].positives / layers[b].n;
		    if(minor_frequency_b > 0.5) {
		        minor_frequency_b = 1 - minor_frequency_b;
		    }

		    if(minor_frequency_a > minor_frequency_b) {
		        // a is more evenly split, so put it first
		        return -1;
		    } else if(minor_frequency_a < minor_frequency_b) {
		        // b is more evenly split, so put it first
		        return 1;
		    } 
		   
		} else if (!layers[a].selection && !isNaN(layers[a].positives) && 
		    layers[a].n > 0) {
		    
		    // a is a binary layer we can nicely sort by minor value frequency, but
		    // b isn't. Put a first so that we can avoid intransitive sort cycles.
		    
		    // Example: X and Z are binary layers, Y is a non-binary layer, Y comes
		    // after X and before Z by name ordering, but Z comes before X by minor
		    // frequency ordering. This sort is impossible.
		    
		    // The solution is to put both X and Z in front of Y, because they're
		    // more interesting.
		    
		    return -1;
		
		} else if (!layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // b is a binary layer that we can evaluate based on minor value
		    // frequency, but a isn't. Put b first.
		    
		    return 1;
		    
		}		
		
    // We couldn't find a difference in selection status, p-value, or clumpiness
    // score, or the binary layer minor value frequency, or whether each layer
    // *had* a binary layer minor value frequency, so use lexicographic ordering
    // on the name.
    return a.localeCompare(b);
    
}

function layer_sort_order_r_value(a, b) {
    // A sort function defined on layer names.
    // Return <0 if a belongs before b, >0 if a belongs after
    // b, and 0 if their order doesn't matter.
    
    // Sort by selection status, then r_value, then clumpiness, then (for binary
    // layers that are not selections) the frequency of the less common value,
    // then alphabetically by name if all else fails.

    // Note that we can consult the layer metadata "n" and "positives" fields to
    // calculate the frequency of the least common value in binary layers,
    // without downloading them.
    
    if(layers[a].selection && !layers[b].selection) {
        // a is a selection and b isn't, so put a first.
        return -1;
    } else if(layers[b].selection && !layers[a].selection) {
        // b is a selection and a isn't, so put b first.
        return 1;
    }

		if(layers[a]["r_value"] > layers[b]["r_value"]) {
		    // a has a greater r value, so put it first.
		    return -1;
		} else if(layers[b]["r_value"] > layers[a]["r_value"]) {
		    // b has a greater r value. Put it first instead.
		    return 1;
		} else if(isNaN(layers[b]["r_value"]) && !isNaN(layers[a]["r_value"])) {
		    // a has a r value and b doesn't, so put a first
		    return -1;
		} else if(!isNaN(layers[b]["r_value"]) && isNaN(layers[a]["r_value"])) {
		    // b has a r value and a doesn't, so put b first.
		    return 1;
		}
		
		if(layers[a].clumpiness < layers[b].clumpiness) {
		    // a has a lower clumpiness score, so put it first.
		    return -1;
		} else if(layers[b].clumpiness < layers[a].clumpiness) {
		    // b has a lower clumpiness score. Put it first instead.
		    return 1;
		} else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
		    // a has a clumpiness score and b doesn't, so put a first
		    return -1;
		} else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
		    // b has a clumpiness score and a doesn't, so put b first.
		    return 1;
		}			
		
		if(!layers[a].selection && !isNaN(layers[a].positives) && layers[a].n > 0 &&
		    !layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // We have checked to see each layer is supposed to be bianry layer
		    // without downloading.  TODO: This is kind of a hack. Redesign the
		    // whole system with a proper concept of layer type.
		    
		    // We've also verified they both have some data in them. Otherwise we
		    // might divide by 0 trying to calculate frequency.
		        
		    // Two binary layers (not selections).
		    // Compute the frequency of the least common value for each
		    
		    // This is the frequency of the least common value in a (will be <=1/2)
		    var minor_frequency_a = layers[a].positives / layers[a].n;
		    if(minor_frequency_a > 0.5) {
		        minor_frequency_a = 1 - minor_frequency_a;
		    }
		    
		    // And this is the same frequency for the b layer
		    var minor_frequency_b = layers[b].positives / layers[b].n;
		    if(minor_frequency_b > 0.5) {
		        minor_frequency_b = 1 - minor_frequency_b;
		    }

		    if(minor_frequency_a > minor_frequency_b) {
		        // a is more evenly split, so put it first
		        return -1;
		    } else if(minor_frequency_a < minor_frequency_b) {
		        // b is more evenly split, so put it first
		        return 1;
		    } 
		   
		} else if (!layers[a].selection && !isNaN(layers[a].positives) && 
		    layers[a].n > 0) {
		    
		    // a is a binary layer we can nicely sort by minor value frequency, but
		    // b isn't. Put a first so that we can avoid intransitive sort cycles.
		    
		    // Example: X and Z are binary layers, Y is a non-binary layer, Y comes
		    // after X and before Z by name ordering, but Z comes before X by minor
		    // frequency ordering. This sort is impossible.
		    
		    // The solution is to put both X and Z in front of Y, because they're
		    // more interesting.
		    
		    return -1;
		
		} else if (!layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // b is a binary layer that we can evaluate based on minor value
		    // frequency, but a isn't. Put b first.
		    
		    return 1;
		    
		}
    // We couldn't find a difference in selection status, p-value, or clumpiness
    // score, or the binary layer minor value frequency, or whether each layer
    // *had* a binary layer minor value frequency, so use lexicographic ordering
    // on the name.
    return a.localeCompare(b);
    
}

function layer_sort_order_mutual_information(a, b) {
    // A sort function defined on layer names.
    // Return <0 if a belongs before b, >0 if a belongs after
    // b, and 0 if their order doesn't matter.
    
    // Sort by selection status, then mutual information, then clumpiness, then (for binary
    // layers that are not selections) the frequency of the less common value,
    // then alphabetically by name if all else fails.

    // Note that we can consult the layer metadata "n" and "positives" fields to
    // calculate the frequency of the least common value in binary layers,
    // without downloading them.
    
    if(layers[a].selection && !layers[b].selection) {
        // a is a selection and b isn't, so put a first.
        return -1;
    } else if(layers[b].selection && !layers[a].selection) {
        // b is a selection and a isn't, so put b first.
        return 1;
    }

		if(layers[a]["mutual_information"] > layers[b]["mutual_information"]) {
		    // a has a greater mutual info value, so put it first.
		    return -1;
		} else if(layers[b]["mutual_information"] > layers[a]["mutual_information"]) {
		    // b has a greater mutual info value. Put it first instead.
		    return 1;
		} else if(isNaN(layers[b]["mutual_information"]) && !isNaN(layers[a]["mutual_information"])) {
		    // a has a mutual info value and b doesn't, so put a first
		    return -1;
		} else if(!isNaN(layers[b]["mutual_information"]) && isNaN(layers[a]["mutual_information"])) {
		    // b has a mutual info value and a doesn't, so put b first.
		    return 1;
		}
		
		if(layers[a].clumpiness < layers[b].clumpiness) {
		    // a has a lower clumpiness score, so put it first.
		    return -1;
		} else if(layers[b].clumpiness < layers[a].clumpiness) {
		    // b has a lower clumpiness score. Put it first instead.
		    return 1;
		} else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
		    // a has a clumpiness score and b doesn't, so put a first
		    return -1;
		} else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
		    // b has a clumpiness score and a doesn't, so put b first.
		    return 1;
		}			
		
		if(!layers[a].selection && !isNaN(layers[a].positives) && layers[a].n > 0 &&
		    !layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // We have checked to see each layer is supposed to be bianry layer
		    // without downloading.  TODO: This is kind of a hack. Redesign the
		    // whole system with a proper concept of layer type.
		    
		    // We've also verified they both have some data in them. Otherwise we
		    // might divide by 0 trying to calculate frequency.
		        
		    // Two binary layers (not selections).
		    // Compute the frequency of the least common value for each
		    
		    // This is the frequency of the least common value in a (will be <=1/2)
		    var minor_frequency_a = layers[a].positives / layers[a].n;
		    if(minor_frequency_a > 0.5) {
		        minor_frequency_a = 1 - minor_frequency_a;
		    }
		    
		    // And this is the same frequency for the b layer
		    var minor_frequency_b = layers[b].positives / layers[b].n;
		    if(minor_frequency_b > 0.5) {
		        minor_frequency_b = 1 - minor_frequency_b;
		    }

		    if(minor_frequency_a > minor_frequency_b) {
		        // a is more evenly split, so put it first
		        return -1;
		    } else if(minor_frequency_a < minor_frequency_b) {
		        // b is more evenly split, so put it first
		        return 1;
		    } 
		   
		} else if (!layers[a].selection && !isNaN(layers[a].positives) && 
		    layers[a].n > 0) {
		    
		    // a is a binary layer we can nicely sort by minor value frequency, but
		    // b isn't. Put a first so that we can avoid intransitive sort cycles.
		    
		    // Example: X and Z are binary layers, Y is a non-binary layer, Y comes
		    // after X and before Z by name ordering, but Z comes before X by minor
		    // frequency ordering. This sort is impossible.
		    
		    // The solution is to put both X and Z in front of Y, because they're
		    // more interesting.
		    
		    return -1;
		
		} else if (!layers[b].selection && !isNaN(layers[b].positives) && 
		    layers[b].n > 0) {
		    
		    // b is a binary layer that we can evaluate based on minor value
		    // frequency, but a isn't. Put b first.
		    
		    return 1;
		    
		}
    // We couldn't find a difference in selection status, p-value, or clumpiness
    // score, or the binary layer minor value frequency, or whether each layer
    // *had* a binary layer minor value frequency, so use lexicographic ordering
    // on the name.
    return a.localeCompare(b);
    
}

function sort_layers(layer_array, type_value) {
    // Given an array of layer names, sort the array in place as we want layers
    // to appear to the user.
    // We should sort by p value, with NaNs at the end. But selections should be
    // first.
    
	if (type_value == "r_value") {
    	layer_array.sort(layer_sort_order_r_value);
	}
	else if (type_value == "mutual_information") {
    	layer_array.sort(layer_sort_order_mutual_information);
	}
	else {
		layer_array.sort(layer_sort_order_p_value);
	}
}

function fill_layer_metadata(container, layer_name) {
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
            clumpiness: "Density score"
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
    var metadata_container = $("<div/>").addClass("layer-metadata-container");
    
    fill_layer_metadata(metadata_container, layer_name);
    
    root.append(metadata_container);
    
    return root;
}

update_browse_ui = function(type_value) {
    // Make the layer browse UI reflect the current list of layers in sorted
    // order.
    
    // Re-sort the sorted list that we maintain
    sort_layers(layer_names_sorted, type_value);

    // Set the "Sorting Text" Label
	$("#ranked-against").text(current_sort_text);
    
    // Close the select if it was open, forcing the data to refresh when it
    // opens again.
    $("#search").select2("close");
}

function get_slider_range(layer_name) {
    // Given the name of a layer, get the slider range from its shortlist UI 
    // entry.
    // Assumes the layer has a shortlist UI entry.
    return shortlist_ui[layer_name].find(".range-slider").slider("values");
}

function reset_slider(layer_name, shortlist_entry) {
    // Given a layer name and a shortlist UI entry jQuery element, reset the 
    // slider in the entry to its default values, after downloading the layer. 
    // The default value may be invisible because we decided the layer should be
    // a colormap.
        
    // We need to set its boundaries to the min and max of the data set
    with_layer(layer_name, function(layer) {
        if(have_colormap(layer_name)) {
            // This is a colormap, so don't use the range slider at all.
            // We couldn't know this before because the colormap may need to be 
            // auto-detected upon download.
            shortlist_entry.find(".range").hide();
            return;
        } else {
            // We need the range slider
            shortlist_entry.find(".range").show();
        
            // We want to do some fancy layer bounds guessing. In general, the
            // bounds should be at +/- the largest-magnitude value.
            var minBound = -layer.magnitude;
            var maxBound = layer.magnitude;
            
            if(layer.maximum <= 1) {
                if(layer.minimum >= 0) {
                    // If it's a 0 to 1 layer, set bounds at 0 and 1
                    minBound = 0;
                    maxBound = 1;
                } else if(layer.minimum >= -1) {
                    // If it's a -1 to 1 layer, set bounds at -1 and 1
                    minBound = -1;
                    maxBound = 1;
                }
            }
            
            // Else, leave bounds at +/- magnitude.
            
            // Set the min and max.
            shortlist_entry.find(".range-slider").slider("option", "min", 
                minBound);
            shortlist_entry.find(".range-slider").slider("option", "max", 
                maxBound);
            
            // Set slider to autoscale to detected range.
            shortlist_entry.find(".range-slider").slider("values", 
                [minBound, maxBound]);
                
            print("Scaled to range " + minBound + " to " + maxBound);
                
            // Redraw the view in case this changed anything
            refresh();
        }
        
    });
}

function get_current_layers() { // XXX there are two functions of this name !!!
    // Returns an array of the string names of the layers that are currently
    // supposed to be displayed, according to the shortlist UI.
    // Not responsible for enforcing maximum selected layers limit.
    
    // This holds a list of the string names of the currently selected layers,
    // in order.
    var current_layers = [];
    
    $("#shortlist").children().each(function(index, element) {
        // This holds the checkbox that determines if we use this layer
        var checkbox = $(element).find(".layer-on");
        if(checkbox.is(":checked")) {
            // Put the layer in if its checkbox is checked.
            current_layers.push($(element).data("layer"));
        }
    });
    
    // Return things in reverse order relative to the UI.
    // Thus, layer-added layers will be "secondary", and e.g. selecting 
    // something with only tissue up behaves as you might expect, highlighting 
    // those things.
    current_layers.reverse();
    
    return current_layers;
}

function get_current_filters() {
    // Returns an array of filter objects, according to the shortlist UI.
    // Filter objects have a layer name and a boolean-valued filter function 
    // that returns true or false, given a value from that layer.
    var current_filters = [];
    
    $("#shortlist").children().each(function(index, element) {
        // Go through all the shortlist entries.
        // This function is also the scope used for filtering function config 
        // variables.
    
        // This holds the checkbox that determines if we use this layer
        var checkbox = $(element).find(".filter-on");
        if(checkbox.is(":checked")) {
            // Put the layer in if its checkbox is checked.
            
            // Get the layer name
            var layer_name = $(element).data("layer");
            
            // This will hold our filter function. Start with a no-op filter.
            var filter_function = function(value) {
                return true;
            }
            
            // Get the filter parameters
            // This holds the input that specifies a filter threshold
            var filter_threshold = $(element).find(".filter-threshold");
            // And this the element that specifies a filter match value for 
            // discrete layers
            var filter_value = $(element).find(".filter-value");
            
            // We want to figure out which of these to use without going and 
            // downloading the layer.
            // So, we check to see which was left visible by the filter config
            // setup code.
            if(filter_threshold.is(":visible")) {
                // Use a threshold. This holds the threshold.
                var threshold = parseInt(filter_threshold.val());
                
                filter_function = function(value) {
                    return value > threshold;
                }
            }
            
            if(filter_value.is(":visible")) {
                // Use a discrete value match instead. This hodls the value we
                // want to match.
                var desired = filter_value.val();
                
                filter_function = function(value) {
                    return value == desired;
                }
            }
            
            // Add a filter on this layer, with the function we've prepared.
            current_filters.push({
                layer_name: layer_name,
                filter_function: filter_function
            });
        }
    });
    
    return current_filters;
}

function get_current_layers() { // XXX there are two functions of this name !!!
    // Returns an array of the string names of the layers that are currently
    // supposed to be displayed, according to the shortlist UI.
    // Not responsible for enforcing maximum selected layers limit.
    
    // This holds a list of the string names of the currently selected layers,
    // in order.
    var current_layers = [];
    
    $("#shortlist").children().each(function(index, element) {
        // This holds the checkbox that determines if we use this layer
        var checkbox = $(element).find(".layer-on");
        if(checkbox.is(":checked")) {
            // Put the layer in if its checkbox is checked.
            current_layers.push($(element).data("layer"));
        }
    });
    
    // Return things in reverse order relative to the UI.
    // Thus, layer-added layers will be "secondary", and e.g. selecting 
    // something with only tissue up behaves as you might expect, highlighting 
    // those things.
    current_layers.reverse();
    
    return current_layers;
}

function with_filtered_signatures(filters, callback) {
    // Takes an array of filters, as produced by get_current_filters. Signatures 
    // pass a filter if the filter's layer has a value >0 for that signature. 
    // Computes an  array of all signatures passing all filters, and passes that
    // to the given callback.
    
    // TODO: Re-organize this to do filters one at a time, recursively, like a 
    // reasonable second-order filter.
    
    // Prepare a list of all the layers
    var layer_names = [];
    
    for(var i = 0; i < filters.length; i++) {
        layer_names.push(filters[i].layer_name);
    }
    
    with_layers(layer_names, function(filter_layers) {
        // filter_layers is guaranteed to be in the same order as filters.
        
        // This is an array of signatures that pass all the filters.
        var passing_signatures = [];
    
        for(var signature in polygons) {
            // For each signature
            
            // This holds whether we pass all the filters
            var pass = true;
            
            for(var i = 0; i < filter_layers.length; i++) {
                // For each filtering layer
                if(!filters[i].filter_function(
                    filter_layers[i].data[signature])) {
                    
                    // If the signature fails the filter function for the layer,
                    // skip the signature.
                    pass = false;
                    break;
                }
            }
            
            if(pass) {
                // Record that the signature passes all filters
                passing_signatures.push(signature);
            }
        }
        
        // Now we have our list of all passing signatures, so hand it off to the
        // callback.
        callback(passing_signatures);
    });
}

function select_list(to_select, function_type, layer_names, new_layer_name, shortlist_push) {
    // Given an array of signature names, add a new selection layer containing
    // just those hexes. Only looks at hexes that are not filtered out by the
    // currently selected filters.
	
	// function_type is an optional parameter. If no variable is passed for the 
	// function_type undefined then the value will be undefined and the
	// default "selection + #" title will be assigned to the shortlist element.
	// If layer_names is undefined, the "selection + #" will also apply as a
	// default. However, if a value i.e. "intersection" is passed 
	// for function_type, the layer_names will be used along with the 
	// function_type to assign the correct title. 
    
    // Make the requested signature list into an object for quick membership
    // checking. This holds true if a signature was requested, undefined
    // otherwise.
    var wanted = {};
    
    for(var i = 0; i < to_select.length; i++) {
        wanted[to_select[i]] = true;
    }
    
    // This is the data object for the layer: from signature names to 1/0
    var data = {};
    
    // How many signatures will we have any mention of in this layer
    var signatures_available = 0;
    
    // Start it out with 0 for each signature. Otherwise we wil have missing 
    // data for signatures not passing the filters.
    for(var signature in polygons) {
        data[signature] = 0;
        signatures_available += 1;
    }
    
    // This holds the filters we're going to use to restrict our selection
    var filters = get_current_filters();

    // Go get the list of signatures passing the filters and come back.
    with_filtered_signatures(filters, function(signatures) { 

		// Make up a name for the layer
		var layer_name;
  
        // How many signatures get selected?
        var signatures_selected = 0;
     
        for(var i = 0; i < signatures.length; i++) {
            if(wanted[signatures[i]]) {
                // This signature is both allowed by the filters and requested.
                data[signatures[i]] = 1;
                signatures_selected++;           
            }
        }

		// Default Values for Optional Parameters
		if (function_type == undefined && layer_names == undefined){		
        	layer_name = "Selection " + selection_next_id;
        	selection_next_id++;
		}


		if (new_layer_name == undefined) {
			// If a name hasn't already been prescribed through a previous
			// session.
			if (function_type == "user selection"){
				 var text = prompt("Please provide a label for your selection",
				 "Selection " + selection_next_id);
				 // Give a different suggested name each time.
				 // TODO: what if they start naming their things the same on
				 // purpose? Validate layer names.
				 selection_next_id++;
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
				current_session.selection_attr.push({"l_name":layer_name,
													"signatures": to_select,
													"keep": true
													});
							
			}
			
			// intersection for layer name
			if (function_type == "intersection"){

				 var text = prompt("Please provide a label for your Intersection",
				 "L1 ∩ L2");
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
			}

			// union for layer name
			if (function_type == "union"){
				 var text = prompt("Please provide a label for your Union",
				 "L1 U L2");
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
			}

			// set difference for layer name
			if (function_type == "set difference"){
				 var text = prompt("Please provide a label for your Intersection",
				 "L1 \\ L2");
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
			}

			// symmetric difference for layer name
			if (function_type == "symmetric difference"){
				 var text = prompt("Please provide a label for your Symmetric Difference",
				 "L1 ∆ L2");
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
			}
		    
			// absolute complement for layer name
			if (function_type == "absolute complement"){
				 var text = prompt("Please provide a label for your Absolute Complement",
				 "Not: L1");
				 if (text != null){
				 	layer_name = text;
				 }
				 if (!text)
				 {
					return;
				 }
			}

			// saved filter for layer name
			if (function_type == "save"){
				layer_name =  "(" + layer_names[0] + ")";
			}
		}
		else {
			// Layer name already exists. User is loading a previous session.
			layer_name = new_layer_name;
			if (function_type == "intersection" || function_type == "union"
					|| function_type == "set difference"
					|| function_type == "symmetric difference"
					|| function_type == "absolute complement"){
					set_operation_complete = true;
				}
		}
		
        // Add the layer. Say it is a selection
        add_layer_data(layer_name, data, {
            selection: true,
            selected: signatures_selected, // Display how many hexes are in
            n: signatures_available // And how many have a value at all
        });
        
        // Update the browse UI with the new layer.
		if (mutual_information_ranked == true) {
        	update_browse_ui("mutual_information");
		}
		else {
			update_browse_ui();
		}
        		
		if (shortlist_push != false) {
		    // Immediately shortlist it if the attribute is being created for
			// the first time.
		    shortlist.push(layer_name);
		    update_shortlist_ui();
		}

		if (shortlist_push == false && shortlist.indexOf(layer_name)>=0) {
		    // Immediately update shortlist it if the attribute is being loaded
			// and has been declared as part of the shortlist.
		    update_shortlist_ui();
		}

		new_layer_name = layer_name;
    });
	return (new_layer_name);
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

select_rectangle = function (start, end) {
    // Now we have an array of the signatures that ought to be in the selection
    // (if they pass filters). Hand it off to select_list.
    var in_box = find_polygons_in_rectangle(start, end),
        select_function_type = "user selection";
    select_list(in_box, select_function_type);
    
}

function with_association_stats(layer_name, callback) {
    // Download the association statistics values for the given layer against
    // all other continuous or binary layers, as appropriate, and call the
    // callback with an object from layer name to statistic value. The statistic
    // is a p value from a chi-squared test (of some description) for binary
    // & categorical layers, and an r correlation value for continuous layers.
    
    // Get the layer index
    layer_index = layer_names_by_index.indexOf(layer_name);
    
    if(binary_layers.indexOf(layer_name) != -1 && categorical_layers.indexOf(layer_name) != -1) {
        // It's a binary or categorical layer. Get the layer file
        var filename = ctx.project + "layer_" + layer_index + "_chi2.tab";
    } else if(cont_layers.indexOf(layer_name) != -1) {
        // It's a continuous layer. Get the layer file
        var filename = ctx.project + "layer_" + layer_index + "_pear.tab";
    }
        
    $.get(filename, function(tsv_data) {        
	    // This is an array of rows, which are arrays of values:
	    //
		//    Layer1	Layer2	Layer 3...
		//    value	value	value
	    //
	    // Parse the file

	    var parsed = $.tsv.parseRows(tsv_data);
	    row_header = parsed[0];

	    stats_values = parsed[1];
	    
	    // Make an object to fill with the stat values by layer name
	    var stat_values = {};

	    for (var i = 0; i < row_header.length; i++){
	        // Parse all the other layer names and the values against them.
		    compare_layer_name = row_header[i];
            value = parseFloat(stats_values[i]);
            
            // Populate the object to call back with
		    stat_values[compare_layer_name] = value;			
	    }
	    
	    // Call the callback
	    callback(stat_values);

    }, "text")
}

function get_association_stats_values(layer_name, drop_down_val, single_stat, layer_names){
	// Download the Association Statistics file and fill in values for
	// Each layer depending on the layer_name
	// e.g. fill all pearson correlation values from tests ran between
	// layer_name and all other layers
	
	// TODO: rewrite in terms of with_association_stats

	// If single_stat == true, then the user is only requesting one value 
	// from the query. 

	if (single_stat == false) {

		// Determine if the selected layer has continuous or binary data values
		var continuous_type = false;

		// Determine if the selected layer has continuous or binary data values
		layer_index = cont_layers.indexOf(layer_name);
		if (layer_index >= 0) {
			continuous_type = true;
		}

		// drop_down_val == 1, indicates that the user wants to compare
		// the selected attribute to other continuous values
		if (drop_down_val == 1 && continuous_type == true) {
            layer_index = layer_names_by_index.indexOf(layer_name);
			$.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
				// This is an array of rows, which are arrays of values:
				//
				//	Layer1	Layer2	Layer 3...
				//	value	value	value
				//
				// Parse the file

				var parsed = $.tsv.parseRows(tsv_data);
				row_header = parsed[0];
		
				stats_values = parsed[1];

				for (var i = 0; i < row_header.length; i++){
					compare_layer_name = row_header[i];
		            value = parseFloat(stats_values[i]);
					layers[compare_layer_name].r_value = value;			
				}

			}, "text")
			.done(function() {
				current_sort_text = "(LI) Attributes Ranked According to: " + layer_name;
				update_browse_ui("r_value");
                mutual_information_ranked = false;

			})
 			.fail(function() {
				complain("Association Stats Weren't Precomputed!");
			});
		}

		// drop_down_val == 0, indicates that the user wants to compare
		// the selected attribute to other binary values
		if (drop_down_val == 0 && continuous_type == false) {
			$.get(ctx.project + layer_name + "_b_b.tab", function(tsv_data) {
				// This is an array of rows, which are arrays of values:
				//
				//	Layer1	Layer2	Layer 3...
				//	value	value	value
				//
				// Parse the file

				var parsed = $.tsv.parseRows(tsv_data);
				row_header = parsed[0];
				layer_index = row_header.indexOf(layer_name);
		
				stats_values = parsed[1];

				for (var i = 0; i < row_header.length; i++){
					compare_layer_name = row_header[i];
		            value = parseFloat(stats_values[i]);
					layers[compare_layer_name].p_value = value;
			
				}
			
			}, "text")
			.done(function() {
				current_sort_text = "(LI) Attributes Ranked According to: " + layer_name;
		 		update_browse_ui();
                mutual_information_ranked = false;


			})
 			.fail(function() {
				complain("Association Stats Weren't Precomputed!");
				// var ranked_against_label = document.getElementById("ranked-against").style.visibility="hidden";
                mutual_information_ranked = false;
			});
		}
	}

	// For Stats Query
	if (single_stat == true) {
		// Determine if layer 1 has continuous or binary data values
		var layer1_cont = false
		layer_index = cont_layers.indexOf(layer_names[0]);
		if (layer_index > 0) {
			layer1_cont = true;
		}

		// Determine if layer 2 has continuous or binary values
		var layer2_cont = false
		layer_index = cont_layers.indexOf(layer_names[1]);
		if (layer_index > 0) {
			layer2_cont = true;
		}
		
		// Look in Continuous_Continuous file if they are both Continuous
		if (layer1_cont == true & layer2_cont == true) {
			layer_index = layer_names_by_index.indexOf(layer_names[0])
			$.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
				// This is an array of rows, which are arrays of values:
				//
				//	id		Layer1	Layer2	Layer 3...
				//	Layer1	value	value	value
				//	Layer2	value	value	value
				//	Layer3	value	value	value
				//
				// Parse the file

				var parsed = $.tsv.parseRows(tsv_data);	
				var row_header = parsed[0];
				var layer2_index = row_header.indexOf(layer_names[1]);	
				stats_value = parsed[1][layer2_index];	

			}, "text")
			.done(function() {

			})
 			.fail(function() {
				complain("Association Stats Weren't Precomputed!");
			});

			var type = "R-Coefficient: ";
			return type;
		}		

		// Look in b_b files if both are binary
		if (layer1_cont == false & layer2_cont == false) {
		
		$.get(ctx.project + layer_names[0] + "_b_b.tab", function(tsv_data) {
				// This is an array of rows, which are arrays of values:
				//
				//	id		Layer1	Layer2	Layer 3...
				//	Layer1	value	value	value
				//	Layer2	value	value	value
				//	Layer3	value	value	value
				//
				// Parse the file

				parsed = $.tsv.parseRows(tsv_data);	
				row_header = parsed[0];
				layer2_index = row_header.indexOf(layer_names[1]);	
				stats_value = parsed[1][layer2_index];	
			
			}, "text")
			.done(function() {

			})
 			.fail(function() {
				complain("Association Stats Weren't Precomputed!");
			});

			var type = "P-Value: ";
			return type;
		}
		
	}
}

function get_mutual_information_statistics (layout_number, layer_names, function_index, anticorrelated_only) {
	// Retrieve the appropraite mutual information values and return either
	// a sorted list or a specific value, via alert box.
	// All mutual information values are stored in files of the format
	// "mi_<layout_number>_<layer_number>.tab". 
	// If anticorrelated_only is true, only updates anticorrelated layers.

	// First we must retrieve the file indices for the respective layer_names.
	
	var layer_indices = [];
	
	for (var i = 0; i < layer_names.length; i++) {
	    // Go get the index for each layer we asked for.
	    layer_index = layer_names_by_index.indexOf(layer_names[i]);
        layer_indices.push(layer_index);
    }
	
	// What file should we get?
	// Open up the file mi_<layout_number>_<layer_indices[0]>.tab
	var filename = ctx.project + "mi_"+ layout_number + "_"+ layer_indices[0] +".tab";
	print("Fetching " + filename);

	// function_index = 2 indicates a rank query
	// Column 1 is a list of layer/attribute names
	// Column 2 is a list of mutual information values
	// Assign the mutual information values to the layer elements
	// When this done, update the browse ui via the mutual information
	// sort.
	$.get(filename, function(tsv_data) { 
		// Parsed object contains mutual information stats       
		var parsed = $.tsv.parseRows(tsv_data);

		// Pair Query
		if (function_index == 1) {
			for (var i = 0; i < parsed.length - 1; i++) {
				if (layer_names[1] == parsed[i][0]) {
					mutual_information_value = parsed[i][1];
				}
			}
		}
	
		// Ranking Query
		if (function_index == 2) {
		
		    var callback = function(layer_stats) {
                // Given an object from layer name to layer statistic (p
                // value for binary, correlation for continuous), update the
                // mutual_information fields on the layers that, according
                // to the statistics, are anticorrelated with this one. If
                // layer_stats is undefined, just updates all layers.
                
                    
                // Seems like parsed.length is picking up an extraneous line
                // Debugger states that there is an extra element ""
                // (nothing)
		        for (var i = 0; i < parsed.length - 1; i++) {
			        // First element of each row is the layer name
			        // to which the selected layer is being compared against.
			        var compare_layer_name = parsed[i][0];
			        // Extract the value - 2nd element of each row 
                	var value = parseFloat(parsed[i][1]);
                	
                	if(layer_stats != undefined) {
                	
                	    if(!layer_stats.hasOwnProperty(
                	        compare_layer_name)) {
                            // Skip anything we haven't heard of. TODO: We
                            // could probably safely keep anything we never
                            // calculated a correlation for.
                            continue;
                	    }
                	    
            	        // We need to check if this layer passed the filter,
            	        // and continue otherwise.
            	        
            	        // Grab the stat value
            	        var stat = layer_stats[compare_layer_name];
            	        
                        if(binary_layers.indexOf(layer_names[0]) != -1) {
                            // We're doing a binary layer. Reject anything
                            // with a significant score. TODO: Is this just
                            // going to throw out anticorrelated things as
                            // well as correlated things?
                            if(stat < 0.05) {
                                // Skip anything significantly chi-squared
                                // to this layer.
                                continue;
                            }
                        } else if(cont_layers.indexOf(layer_names[0]) !=
                            -1) {
                            
                            // We're doing a continuous layer. Reject
                            // anything with a non-negative correlation.
                            if(stat >= 0) {
                                continue;
                            }
                        }
                	}
                	
                	// Set the mutual information for this layer against the 
                	// pivot layer.
			        layers[compare_layer_name].mutual_information = value;
		        }
                  
                  
                // Now we're done getting the MIs, update the UI
                current_sort_text = "(LA) Attributes Ranked According to: " + layer_names[0];
                update_browse_ui("mutual_information");
                
                // Save the parameters we were called with, so we can be called
                // again if someone changes the layout. TODO: This is a massive
                // hack.
                mutual_information_ranked = true;
			    mutual_information_sorted_against [0] = layer_names[0];
			    mutual_information_filtered = anticorrelated_only;
                
		    };
		
			
			
			if(anticorrelated_only) {
                // Restrict to anticorrelated layers (of the same type). Go
                // get a dict from layer name to p value with this layer,
                // and pass it to the callback defined above.
			    with_association_stats(layer_names[0], callback)
			} else {
			    // No restrictions. Call the callback directly on undefined.
			    callback();
			}
			
			
			
		}

	}, "text")
	.fail(function() {
		if (function_index ==2) {
			complain("Mutual Information Stats Were Not Pre-Computed!");

			// $("#ranked-against").text("(MI) Attributes Ranked According to: " + layer_names[0]);
			// var ranked_against_label = document.getElementById("ranked-against").style.visibility="hidden";
		}
	});
} 

function clear_current_stats_values () {
	// For a specific layer, delete all stats values:
	// density, p_value, r_value, mutual_information.
    for(var layer_name in layers) {
		delete layers[layer_name].clumpiness;
    	delete layers[layer_name].r_value;
        delete layers[layer_name].p_value;
        delete layers[layer_name].mutual_information;
     }
	current_sort_text = "Attributes Ranked According to Frequency";
	update_browse_ui();	
}

function get_current_layout_index (layout_name, recompute_stats) {
	// Parse the File "matrixnames.tab". Each layout is listed in the file's
	// first column. Extract these in an array and search for the 
	// layout_name. Return the index at which this layout name sits.

	// recompute_stats is a boolean variable, when true the function
	// will call the get_mutual_information_statisics function

	var layout_index;
	$.get(ctx.project + "matrixnames.tab", function(tsv_data) {
		var parsed = $.tsv.parseRows(tsv_data);
		
		for (var i = 0; i < parsed.length; i++){
			if (parsed[i][0] == layout_name) {
				layout_index = i;
			}
		}
	}, "text")
	.done(function() {
		current_layout_index = layout_index;
		if (recompute_stats == true) {
		    // We need to re-run stats given this new layout. Go grab our global variables where we kept what stats we ran.
		    // TODO: Fix this to not be terrible.
			get_mutual_information_statistics (current_layout_index, mutual_information_sorted_against, 2, mutual_information_filtered);
		}
	})
 	.fail(function() {
		alert("Error Determining Selected Layout Index");
	});
}

function recalculate_statistics(passed_filters) {
    // Interrogate the UI to determine signatures that are "in" and "out", and
    // run an appropriate statisical test for each layer between the "in" and
    // "out" signatures, and update all the "p_value" fields for all the layers
    // with the p values. Takes in a list of signatures that passed the filters,
    // and ignores any signatures not on that list.
    
    // Build an efficient index of filter-passing signatures
    var passed = {};
    for(var i = 0; i < passed_filters.length; i++) {
        passed[passed_filters[i]] = true;
    }

    // Figure out what the in-list should be (statistics group A) using new GUI
	var drop_down_data_values = document.getElementsByClassName(
	    "comparison-stats-value");

	var layer_a_name;

	var selected_index1 = drop_down_data_values[0].selectedIndex;	
	if (selected_index1 != 0) {
		layer_a_name = drop_down_data_values[0].options[selected_index1].text;
		comparison_stats_l1 = layer_a_name;
	}

	var layer_b_name;
	var selected_index2 = drop_down_data_values[1].selectedIndex;	
	if (selected_index2 != 0) {
		layer_b_name = drop_down_data_values[1].options[selected_index2].text;
		comparison_stats_l2 = layer_b_name;
	}

	// Hide Drop Down From User
	comparison_stats_clicks = 0;
	hide_comparison_stats_drop_down ();	

    print("Running statistics between " + layer_a_name + " and " + 
        layer_b_name);
    
    if(!layer_a_name) {
        complain("Can't run statistics without an \"A\" group.");
        
        // Get rid of the throbber
        // TODO: Move this UI code out of the backend code.
        $(".recalculate-throbber").hide();
        $(".recalculate-progress").hide();

        $("#comparison-stats").show();
        
        return;
    }
    
    // We know the layers have data since they're selections, so we can just go
    // look at them.
    
    // This holds the "in" list: hexes from the "A" group.
    var in_list = [];
    
    for(var signature in layers[layer_a_name].data) {
        if(passed[signature] && layers[layer_a_name].data[signature]) {
            // Add all the signatures in the "A" layer to the in list.
            in_list.push(signature);
        }
    }
    
    if(in_list.length == 0) {
        complain("Can't run statistics with an empty \"A\" group.");
        
        // Get rid of the throbber
        // TODO: Move this UI code out of the backend code.
        $(".recalculate-throbber").hide();
        $(".recalculate-progress").hide();
        
        $("#comparison-stats").show();
        
        return;
    }
    
    // This holds the "out" list: hexes in the "B" group, or, if that's not
    // defined, all hexes. It's a little odd to run A vs. a set that includes
    // some members of A, but Prof. Stuart wants that and it's not too insane
    // for a Binomial test (which is the only currently implemented test
    // anyway).
    var out_list = [];
    
    if(layer_b_name) {
        // We have a layer B, so take everything that's on in it.
        for(var signature in layers[layer_b_name].data) {
            if(passed[signature] && layers[layer_b_name].data[signature]) {
                // Add all the signatures in the "B" layer to the out list.
                out_list.push(signature);
            }
        }
    } else {
        // The out list is all hexes
        for(var signature in polygons) {
            if(passed[signature]) {
                // Put it on the out list.
                out_list.push(signature);
            }
        }
    }
    
    // So now we have our in_list and our out_list
    
    // Say we're about to launch an RPC batch of statistics jobs. Cancel any
    // running jobs from the last batch.
    rpc.new_batch();
    
    for(var layer_name in layers) {
        // Do the stats on each layer between those lists. This only processes
        // layers that don't have URLs. Layers with URLs are assumed to be part
        // of the available matrices.
        recalculate_statistics_for_layer(layer_name, in_list, out_list,
            passed_filters);
    }
    
    // Now do all the layers with URLs. They are in the available score
    // matrices.
    for(var i = 0; i < available_matrices.length; i++) {
        recalculate_statistics_for_matrix(available_matrices[i], in_list, 
            out_list, passed_filters);
    }
    
    print("Statistics jobs launched.");
	alert ("The Differential Contrast Statistics Tool has been launched. This test may take up to 40 minutes, depending on the number of attributes present. The attributes will automatically be resorted, and you will be notified when the computation is complete.");
    
}

function recalculate_statistics_for_layer(layer_name, in_list, out_list, all) {
    // Re-calculate the stats for the layer with the given name, between the
    // given in and out arrays of signatures. Store the re-calculated statistics
    // in the layer. all is a list of "all" signatures, from which we can
    // calculate pseudocounts.
    
    // All we do is send the layer data or URL (whichever is more convenient) to
    // the workers. They independently identify the data type and run the
    // appropriate test, returning a p value or NaN by callback.
    
    // This holds a callback for setting the layer's p_value to the result of
    // the statistics.
    var callback = function(reply) {
    //var callback = function(results) {

        var results = reply.results,
            jobs_running = reply.jobs_running; // TODO replace with pub-sub or something meteor
        
        // The statistics code really sends back a dict of updated metadata for
        // each layer. Copy it over.
        for(var metadata in results) {
            layers[layer_name][metadata] = results[metadata];
        }
        
        if(jobs_running == 0) {
            // All statistics are done!
            // TODO: Unify this code with similar callback below.
            // Re-sort everything and draw all the new p values.

			current_sort_text = "Attributes Ranked by Contrast between " + comparison_stats_l1 + " & " + comparison_stats_l2;
            update_browse_ui();
            update_shortlist_ui();
            
            // Get rid of the throbber and progress bar, and put the button
            // back.
            $(".recalculate-throbber").hide();
            $(".recalculate-progress").hide();
            $(".recalculate-finished").show();
            $("#comparison-stats").show();
        }
    };
    
    if(layers[layer_name].data != undefined) {
        // Already have this downloaded. A local copy to the web worker is
        // simplest, and a URL may not exist anyway.
        
        rpc.call("statistics_for_layer", [layers[layer_name].data, in_list,
            out_list, all], callback);
    } else if(layers[layer_name].url != undefined) {
        // We have a URL, so the layer must be in a matrix, too.
        // Skip it here.
    } else {
        // Layer has no data and no way to get data. Should never happen.
        complain("Layer " + layer_name + " has no data and no url.");
    }
}

function recalculate_statistics_for_matrix(matrix_url, in_list, out_list, all) {
    // Given the URL of one of the visualizer generator's input score matrices,
    // download the matrix, calculate statistics for each layer in the matrix
    // between the given in and out lists, and update the layer p values. all is
    // a list of "all" signatures, from which we can calculate pseudocounts.

    rpc.call("statistics_for_matrix", [matrix_url, in_list, out_list, all],
        function(reply) {
        //function(result) {

        var results = reply.results,
            jobs_running = reply.jobs_running; // TODO replace with pub-sub or something meteor

        // The return value is p values by layer name
        for(var layer_name in result) {
            // The statistics code really sends back a dict of updated metadata
            // for each layer. Copy it over.
            for(var metadata in result[layer_name]) {
                layers[layer_name][metadata] = result[layer_name][metadata];
            }
        }
        
        if(jobs_running == 0) {
            // All statistics are done!
            // TODO: Unify this code with similar callback above.
            // Re-sort everything and draw all the new p values.

			current_sort_text = "Attributes Ranked by Contrast between " + comparison_stats_l1 + " & " + comparison_stats_l2;
            update_browse_ui();
            update_shortlist_ui();

            
            // Get rid of the throbber and progress bar, and put the button
            // back.
            $(".recalculate-throbber").hide();
            $(".recalculate-progress").hide();
            $(".recalculate-finished").show();
            $("#comparison-stats").show();

        }
    }, function(progress) {
        // The progress value is a float progress bar position to display. Show
        // the progress bar as being that full.
        $("#recalculate-progress").progressbar({
            max: 1.0,
            value: progress
        });
    });    
    
}

initialize_view = function () {
    // Initialize the global Google Map.

    // Configure a Google map
    if (_.isUndefined(ctx.center)) {
        ctx.center = new google.maps.LatLng(0,0);
    }
    mapOptions = {
        center: ctx.center,
        zoom: ctx.zoom,
        mapTypeId: "blank",
        // Don't show a map type picker.
        mapTypeControlOptions: {
              mapTypeIds: []
        },
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
    
    // We also have an event listener that checks when the zoom level changes,
    // and turns off hex borders if we zoom out far enough, and turns them on
    // again if we come back.
    google.maps.event.addListener(googlemap, "zoom_changed", function(event) {
        // Get the current zoom level (low is out)
        var zoom = googlemap.getZoom();
        ctx.zoom = zoom;
        
        // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
        // So this holds the number of pixels that the global length hex_size 
        // corresponds to at this zoom level.
        var hex_size_pixels = hex_size * Math.pow(2, zoom);
        
        if(hex_size_pixels < MIN_BORDER_SIZE) {
            // We're too small for borders
            for(var signature in polygons) {
                set_hexagon_stroke_weight(polygons[signature], 0);
            }
        } else {
            // We can fit borders on the hexes
            for(var signature in polygons) {
                set_hexagon_stroke_weight(polygons[signature], 
                    HEX_STROKE_WEIGHT);
            }
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
    ctx.center = googlemap.getCenter();

    initialize_view ();
    recreate_map(ctx.current_layout_name, 1);
    refresh ();
}

function have_colormap(colormap_name) {
    // Returns true if the given string is the name of a colormap, or false if 
    // it is only a layer.
    
    return !(colormaps[colormap_name] == undefined);
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

function refresh() {
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
            set_hexagon_color(polygons[signature], "black"); // TODO maybe this should be the current BG color
        }
        
        // Go get the list of filter-passing hexes.
        with_filtered_signatures(filters, function(signatures) {
            for(var i = 0; i < signatures.length; i++) {
                // For each hex passign the filter
                // This hodls its signature label
                var label = signatures[i];
                
                // This holds the color we are calculating for this hexagon.
                // Start with some arbitrary blank color.
                var computed_color = "grey";
                
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
        
        // Draw the color key.
        if(retrieved_layers.length == 0) {
            // No color key to draw
            $(".key").hide();
        } else {
            // We do actually want the color key
            $(".key").show();
        
            // This holds the canvas that the key gets drawn in
            var canvas = $("#color-key")[0];
            
            // This holds the 2d rendering context
            var context = canvas.getContext("2d");
            
            for(var i = 0; i < KEY_SIZE; i++) {
                // We'll use i for the v coordinate (-1 to 1) (left to right)
                var v = 0;
                if(retrieved_layers.length >= 2) {
                    v = i / (KEY_SIZE / 2) - 1;
                    
                    if(have_colormap(current_layers[1])) {
                        // This is a color map, so do bands instead. Make sure
                        // there are at least 2 bands.
                        v = Math.floor(i / KEY_SIZE * 
                            Math.max(retrieved_layers[1].magnitude + 1, 2));
                    }
                    
                }
                
                for(var j = 0; j < KEY_SIZE; j++) {
                    // And j specifies the u coordinate (bottom to top)
                    var u = 0;
                    if(retrieved_layers.length >= 1) {
                        u = 1 - j / (KEY_SIZE / 2);

                        if(have_colormap(current_layers[0])) {
                            // This is a color map, so do bands instead. Make
                            // sure there are at least 2 bands. Also make sure
                            // to flip sign, and have a -1 for the 0-based
                            // indexing.
                            u = Math.floor((KEY_SIZE - j - 1) / KEY_SIZE * 
                                Math.max(retrieved_layers[0].magnitude + 1, 2));
                        }
                    }
                    
                    // Set the pixel color to the right thing for this u, v
                    // It's OK to pass undefined names here for layers.
                    context.fillStyle = get_color(current_layers[0], u, 
                        current_layers[1], v);
                    
                    // Fill the pixel
                    context.fillRect(i, j, 1, 1);
                }
            }
        
        }
        
        if(have_colormap(current_layers[0])) {
            // We have a layer with horizontal bands
            // Add labels to the key if we have names to use.
            // TODO: Vertical text for vertical bands?
        
            // Get the colormap
            var colormap = colormaps[current_layers[0]]
            
            if(colormap.length > 0) {
                // Actually have any categories (not auto-generated)
                print("Drawing key text for " + colormap.length + 
                    " categories.");
                
                // How many pixels do we get per label, vertically
                var pixels_per_label = KEY_SIZE / colormap.length;
                
                // Configure for text drawing
                context.font = pixels_per_label + "px Arial";
                context.textBaseline = "top";
                
                for(var i = 0; i < colormap.length; i++) {
                    
                    // This holds the pixel position where our text goes
                    var y_position = KEY_SIZE - (i + 1) * pixels_per_label;
                    
                    // Get the background color here as a 1x1 ImageData
                    var image = context.getImageData(0, y_position, 1, 1);
                    
                    // Get the components r, g, b, a in an array
                    var components = image.data;
                    
                    // Make a Color so we can operate on it
                    var background_color = Color({
                        r: components[0],
                        g: components[1],
                        b: components[2]
                    });
                    
                    if(background_color.light()) {
                        // This color is light, so write in black.
                        context.fillStyle = "black";
                    } else {
                        // It must be dark, so write in white.
                        context.fillStyle = "white";
                    }
                
                    // Draw the name on the canvas
                    context.fillText(colormap[i].name, 0, y_position);
                }
            }
        }
        
        // We should also set up axis labels on the color key.
        // We need to know about colormaps to do this
        
        // Hide all the labels
        $(".label").hide();
        
        if(current_layers.length > 0) {
            // Show the y axis label
            $("#y-axis").text(current_layers[0]).show();
            
            if(!have_colormap(current_layers[0])) {
                // Show the low to high markers for continuous values
                $("#low-both").show();
                $("#high-y").show();
            }
        }
        
        if(current_layers.length > 1) {
            // Show the x axis label
            $("#x-axis").text(current_layers[1]).show();
            
            if(!have_colormap(current_layers[1])) {
                // Show the low to high markers for continuous values
                $("#low-both").show();
                $("#high-x").show();
            }
        }
        
        
    });
    
    // Make sure to also redraw the info window, which may be open.
    redraw_info_window();
}

function get_color(u_name, u, v_name, v) {
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
        return "black";
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
                return "#00FF00";
            } else {
                // Only the first is on
                return "#FFFF00";
            }
        } else {
            if(v == 1) {
                // Only the second is on
                return "#0000FF";
            } else {
                // Neither is on
                return "#333333";
            }
        }    
        
    }
    
    if(have_colormap(u_name) && !colormaps[u_name].hasOwnProperty(u) && 
        layers[u_name].magnitude <= 1 && v_name == undefined) {
        
        // Special case: a single binary or unary auto-generated colormap.
        // Use dark grey/yellow to make 1s stand out.
        
        if(u == 1) {
            // Yellow for on
            return "#FFFF00";
        } else {
            // Dark grey for off
            return "#333333";
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

FlatProjection = function () {
}
BlankMapType = function () {
}

mapTypeDef = function() {

    // Define a flat projection
    // See https://developers.google.com/maps/documentation/javascript/maptypes#Projections
    FlatProjection.prototype.fromLatLngToPoint = function(latLng) {
        // Given a LatLng from -90 to 90 and -180 to 180, transform to an x, y Point 
        // from 0 to 256 and 0 to 256   
        var point = new google.maps.Point((latLng.lng() + 180) * 256 / 360, 
            (latLng.lat() + 90) * 256 / 180);
        
        return point;

    }

    FlatProjection.prototype.fromPointToLatLng = function(point, noWrap) {
        // Given a an x, y Point from 0 to 256 and 0 to 256, transform to a LatLng from
        // -90 to 90 and -180 to 180
        var latLng = new google.maps.LatLng(point.y * 180 / 256 - 90, 
            point.x * 360 / 256 - 180, noWrap);
        
        return latLng;
    }

    // Define a Google Maps MapType that's all blank
    // See https://developers.google.com/maps/documentation/javascript/examples/maptype-base
    BlankMapType.prototype.tileSize = new google.maps.Size(256,256);
    BlankMapType.prototype.maxZoom = 19;

    BlankMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        // This is the element representing this tile in the map
        // It should be an empty div
        var div = ownerDocument.createElement("div");
        div.style.width = this.tileSize.width + "px";
        div.style.height = this.tileSize.height + "px";
        div.style.backgroundColor = ctx.background;
        
        return div;
    }

    BlankMapType.prototype.name = "Blank";
    BlankMapType.prototype.alt = "Blank Map";

    BlankMapType.prototype.projection = new FlatProjection();
},


get_LatLng = function (x, y) {
    // Given a point x, y in map space (0 to 256), get the corresponding LatLng
    return FlatProjection.prototype.fromPointToLatLng(
        new google.maps.Point(x, y));
}

assignment_values = function (layout_index, spacing) {
	// Download the signature assignments to hexagons and fill in the global 
    // hexagon assignment grid.
    $.get(ctx.project + "assignments" + layout_index +".tab", function(tsv_data) {

    
        // This is an array of rows, which are arrays of values:
        // id, x, y
        var parsed = $.tsv.parseRows(tsv_data);

        // This holds the maximum observed x
        var max_x = 0;
        // And y
        var max_y = 0;
        
        // Fill in the global signature grid and ploygon grid arrays.
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

			x = x * spacing;
			y = y * spacing;			


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
        // TODO: Do the algrbra to make this exact. Right now we just make a 
        // grid that we know to be small enough.
        // Divide the space into one column per column, and calculate 
        // side length from column width. Add an extra column for dangling
        // corners.
        var side_length_x = (256)/ (max_x + 2) * (2.0 / 3.0);
        
        print("Max hexagon side length horizontally is " + side_length_x);
        
        // Divide the space into rows and calculate the side length
        // from hex height. Remember to add an extra row for wggle.
        var side_length_y = ((256)/(max_y + 2)) / Math.sqrt(3);
        
        print("Max hexagon side length vertically is " + side_length_y);
        
        // How long is a hexagon side in world coords?
        // Shrink it from the biggest we can have so that we don't wrap off the 
        // edges of the map.
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

			x = x * spacing;
			y = y * spacing;			

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
        
        // Now that the ploygons exist, do the initial redraw to set all their 
        // colors corectly. In case someone has messed with the controls.
        // TODO: can someone yet have messed with the controlls?
        refresh();
        

    }, "text");
}

clumpiness_values = function (layout_index) {
    // Set the clumpiness scores for all layers to the appropriate values for
    // the given layout index. Just pulls from each layer's clumpiness_array
    // field.
    
    for(var i = 0; i < layer_names_sorted.length; i++) {
        // For each layer
        
        // Get the layer object
        layer = layers[layer_names_sorted[i]];
        
        if(layer.clumpiness_array != undefined) {
            // We have a set of clumpiness scores for this layer.
            // Switch the layer to the appropriate clumpiness score.
            layer.clumpiness = layer.clumpiness_array[layout_index];
        }
    }

	update_browse_ui();
}

// Function to create a new map based upon the the layout_name argument Find the
// index of the layout_name and pass it as the index to the assignment_values
// function as these files are indexed according to the appropriate layout.
// Also pass it to the clumpiness_values function to swap to the appropriate set
// of clumpiness scores.
function recreate_map(layout_name, spacing) {

	var layout_index = ctx.layout_names.indexOf(layout_name);
	assignment_values(layout_index, spacing);
	clumpiness_values(layout_index);

}

function create_indexed_layers_array () {
	$.get(ctx.project + "layers.tab", function(tsv_data) {
		// Create a list of layer names ordered by their indices
		layer_names_by_index = new Array (layer_names_sorted.length);
		parsed = $.tsv.parseRows(tsv_data);
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
			layer_names_by_index [index_value] = parsed[i][0];
		 }			     
    }, "text");

}
// Create GUI for show genes 
function create_show_genes_ui () {
    // Returns a Jquery element that is then prepended to the existing 
    // set theory drop-down menu    

    // This holds the root element for this set operation UI 
    var root = $("<div/>").addClass("show-genes-entry");
    var show_genes_button = $("<input/>").attr("type", "button");
    show_genes_button.addClass ("show-genes-button");
    root.append (show_genes_button);
    return root
}
initHex = function () {
    // Set up the RPC system for background statistics
    rpc = rpcCreate();

    // Set up the Google Map
    mapTypeDef();
    initialize_view();
    
    // Set up the layer search
    $("#search").select2({
        placeholder: "Select Attribute...",
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
        
            for(var i = start_position; i < layer_names_sorted.length; i++) {
                // For each possible result
                if(layer_names_sorted[i].toLowerCase().indexOf(
                    query.term.toLowerCase()) != -1) {
                    
                    // Query search term is in this layer's name. Add a select2
                    // record to our results. Don't specify text: our custom
                    // formatter looks up by ID and makes UI elements
                    // dynamically.
                    results.push({
                        id: layer_names_sorted[i]
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
                more: i < layer_names_sorted.length,
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
        // We want our dropdown to be big enough to browse.
        dropdownCssClass: "results-dropdown"
    });

    // Handle result selection
    $("#search").on("select2-selecting", function(event) {
        // The select2 id of the thing clicked (the layer's name) is event.val
        var layer_name = event.val;
        
        // User chose this layer. Add it to the global shortlist.
        
        // Only add to the shortlist if it isn't already there
        // Was it already there?
        var found = false;
        for(var j = 0; j < shortlist.length; j++) {
            if(shortlist[j] == layer_name) {
                found = true;
                break;
            }
        }
        
        if(!found) {
            // It's new. Add it to the shortlist
            shortlist.push(layer_name);
            
            // Update the UI to reflect this. This may redraw the view.
            update_shortlist_ui();
            
        }
        
        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        event.preventDefault();
    });

    // Create Pop-Up UI for Show Genes
     $("#show-genes").prepend(create_show_genes_ui ());
     
	// Create Pop-Up UI for Comparison Statistics 
	$("#comparison-statistics").prepend(create_comparison_stats_ui ());

	// Action handler for display of comparison statistics query pop-up
	$("#comparison-stats").button().click(function() {
        

		comparison_stats_clicks++;

		// Hide other functions so that if one is visible, 
		// it disappears from sight. Reset the set operation counter so that 
		// if the user clicks on the function icon it will open immediately
		hide_set_operation_drop_down ();
		set_operation_clicks = 0;
		hide_sort_attributes_drop_down();
		sort_attributes_clicks = 0;

		if (comparison_stats_clicks % 2 != 0){
				show_comparison_stats_drop_down ();	
				// Update so that there are no repeated "All Tumor" Attrributes
				update_comparison_stats_selections (); 	
			}
		else {
			hide_comparison_stats_drop_down ();
		}		
	
	});

	// Create Pop-Up UI for Set Operations
	$("#set-operations").prepend(create_set_operation_ui ());

	// Action handler for display of set operation pop-up
	$("#set-operation").button().click(function() {
		set_operation_clicks++;

		// Hide other functions so that if one is visible, 
		// it disappears from sight. Reset the set operation counter so that 
		// if the user clicks on the function icon it will open immediately
		hide_comparison_stats_drop_down ();
		comparison_stats_clicks = 0;
		hide_sort_attributes_drop_down();
		sort_attributes_clicks = 0;

		if (set_operation_clicks % 2 != 0){
				show_set_operation_drop_down ();
				// Update so that there are no repeated "Select" Attrributes
				update_set_operation_selections ();
			}
		else {
			hide_set_operation_drop_down ();
		}		
	
	});

	// Create Pop-Up UI for Sorting Attributes by Association w/ Pivot Attribute
	$("#sort-attributes-queries").prepend(create_sort_attributes_ui());

	// Action handler for display of Sort Atttributes Pop-Up
	$("#sort-attributes").button().click(function() {
		sort_attributes_clicks++;

		// Hide other functions so that if one is visible, 
		// it disappears from sight. Reset the sort attributes counter so that 
		// if the user clicks on the function icon it will open immediately
		hide_set_operation_drop_down ();
		set_operation_clicks = 0;
		hide_comparison_stats_drop_down ();
		comparison_stats_clicks = 0;

		if (sort_attributes_clicks % 2 != 0){
				show_sort_attributes_drop_down ();	
				// Update so that there are no repeated "Select" Attrributes
				update_sort_attributes_selections (); 	
			}
		else {
			hide_sort_attributes_drop_down ();
		}			
	});

	// Computation of Comparison Statistics
	var comparison_stats_button = document.getElementsByClassName ("comparison-stats-button");
	comparison_stats_button[0].onclick = function () {
        // Re-calculate the statistics between the currently filtered hexes and
        // everything else.
        
        // Put up the throbber instead of us.
        $("#comparison-stats").hide();
        $(".recalculate-finished").hide();
        $(".recalculate-progress").show();
        
        // This holds the currently enabled filters.
        var filters = get_current_filters();
    
        with_filtered_signatures(filters, function(signatures) {
            // Find everything passing the filters and run the statistics.
            recalculate_statistics(signatures);
        });
        
		
	};

	// Computation of Set Operations
	var compute_button = document.getElementsByClassName ("compute-button");
	compute_button[0].onclick = function () {
		var layer_names = [];
		var layer_values = [];
		var layer_values_text = [];

		var drop_down_layers = document.getElementsByClassName("set-operation-value");
		var drop_down_data_values = document.getElementsByClassName("set-operation-layer-value");

		var function_type = document.getElementById("set-operations-list");
		var selected_function = function_type.selectedIndex;

		var selected_index = drop_down_layers[0].selectedIndex;
		layer_names.push(drop_down_layers[0].options[selected_index].text);	

		var selected_index = drop_down_data_values[0].selectedIndex;
		layer_values.push(drop_down_data_values[0].options[selected_index].value);	
		layer_values_text.push(drop_down_data_values[0].options[selected_index].text);

		if (selected_function != 5) {
			var selected_index = drop_down_data_values[1].selectedIndex;
			layer_values.push(drop_down_data_values[1].options[selected_index].value);	
			layer_values_text.push(drop_down_data_values[1].options[selected_index].text);
			var selected_index = drop_down_layers[1].selectedIndex;
			layer_names.push(drop_down_layers[1].options[selected_index].text);
		}
		
		switch (selected_function) {
			case 1:
				compute_intersection(layer_values, layer_names);
				break;
			case 2:
				compute_union(layer_values, layer_names);
				break;
			case 3:
				compute_set_difference(layer_values, layer_names);
				break;
			case 4:
				compute_symmetric_difference(layer_values, layer_names);
				break;
			case 5:
				compute_absolute_complement(layer_values, layer_names);
				break
			default:
				complain ("Set Theory Error");
		}
        
		print (current_session);
        hide_set_operation_drop_down ();
		set_operation_clicks = 0;
	};

	// New Consolidate Stats Fetching
	// Get the "Sort Attributes" Button. It will be the first indexed item in
	// the retured array
	var sort_buttons = document.getElementsByClassName ("sort-attributes-button");

	sort_buttons[0].onclick = function () {
		// Complaint Presented, if true do not close panel. User probalby wants
		// to adjust settings.
		var complaint_presented = false;

		// The Stats Query Operations were originally constructed to take
		// arrays. For the time being, we will work around this construction
		// by creation an array with the pivot attribute as the first and
		// only element.
		var pivot_attr = [];
		pivot_attr.push($("#sort-attributes-list").val());

		// Check to see which radio label is selected. 
		if($("#sort-layout-aware").is(":checked")) {
			print("The Mutual Information Stats Should Load Now...");
			clear_current_stats_values ();
			// The function to set the mututal information stats takes
			// the current layout index (global), the array containing
			// the name of the pivot attribute and 1 for pair ranking 
			// (we don't want this) and 2 for sorting attributes (we want).
			get_mutual_information_statistics (current_layout_index, pivot_attr, 2, $("#anticorrelated-only").is(":checked")); 
		}

		if($("#sort-layout-independent").is(":checked")) {
			clear_current_stats_values ();
			// Check to see which data type combination is selected
			
			if ($("#use-all-attributes").is(":checked")) {
				//TODO: Incoporate Stats Test So That This Is Possible
			} else if ($("#use-categorical").is(":checked")) {
				// Only compares against binary at the moment
				get_association_stats_values(pivot_attr[0], 0, false);
			} else if ($("#use-continuous").is(":checked")) {
				get_association_stats_values(pivot_attr[0], 1, false);
			}

		}

		// Keep Open if Complaint Presented (User Probably Wants to Tweak
		// and Rerun). Else close.
		if (complaint_presented == false) {
			hide_sort_attributes_drop_down();
			sort_attributes_clicks = 0;
		}

	};

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
        // Layer index is <name>\t<filename>\t<hexes with values>\t<ones in
        // binary layers>\t<clumpiness for layout 0>\t<clumpiness for layout
        // 1>\t...
        var parsed = $.tsv.parseRows(tsv_data);
        
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
        
		// Add Tissue or 1st Attribute as Default Select
        if (layers["tissue"] != undefined){
			with_layer("tissue", function(layer) {
    	    	shortlist.push("tissue");
				update_shortlist_ui();

			});
        }
        else if (layer_names_sorted.length > 0){
			with_layer(layer_names_sorted[0], function(layer) {
    	    	shortlist.push(layer_names_sorted[0]);
				update_shortlist_ui();

			});
	    }
        // Now we have added layer downloaders for all the layers in the 
        // index. Update the UI
        update_browse_ui();
        
         
    }, "text");
    
    // Download full score matrix index, which we later use for statistics. Note
    // that stats won't work unless this finishes first. TODO: enforce this.
    $.get(ctx.project + "matrices.tab", function(tsv_data) {
        // Matrix index is just <filename>
        var parsed = $.tsv.parseRows(tsv_data);
        
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
    

	// Download Information on what layers are continuous and which are binary
	$.get(ctx.project + "Layer_Data_Types.tab", function(tsv_data) {
        // This is an array of rows, which are arrays of values:
        //
		//	id		Layer1	Layer2	Layer 3...
		//	Layer1	value	value	value
		//	Layer2	value	value	value
		//	Layer3	value	value	value
		//

		// Parse the file
        var parsed = $.tsv.parseRows(tsv_data);
		cont_layers = parsed[0];
		binary_layers = parsed[1];	
        categorical_layers = parsed[2];	
        
	}, "text");  

    // Download color map information
    $.get(ctx.project + "colormaps.tab", function(tsv_data) {
        // Colormap data is <layer name>\t<value>\t<category name>\t<color>
        // \t<value>\t<category name>\t<color>...
        var parsed = $.tsv.parseRows(tsv_data);
        
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
        Session.set('colormaps', colormaps);

        // We may need to redraw the view in response to having new color map 
        // info, if it came particularly late.
        refresh();
            
    }, "text");

// Download the Matrix Names and pass it to the layout_names array
	$.get(ctx.project + "matrixnames.tab", function(tsv_data) {
        // This is an array of rows, which are strings of matrix names
        var parsed = $.tsv.parseRows(tsv_data);
        
        for(var i = 0; i < parsed.length; i++) {
            // Pull out the parts of the TSV entry
            var label = parsed[i][0];

			if(label == "") {
                // Skip any blank lines
                continue;
            }
            // Add layout names to global array of names
            ctx.layout_names.push(label);
            
            if(ctx.layout_names.length == 1) {
                // This is the very first layout. Pull it up.
                    
                // TODO: We don't go through the normal change event since we
                // never change the dropdown value actually. But we duplicate
                // user selection hode here.
                var current_layout = "Current Layout: " + ctx.layout_names[0];         
	 
		        $("#current-layout").text(current_layout);
		        ctx.current_layout_name = ctx.layout_names[0];
		        re_initialize_view ();
            }
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
        // We want our dropdown to be big enough to browse.
        dropdownCssClass: "results-dropdown"
    });
  
  	// Handle result selection
    $("#layout-search").on("select2-selecting", function(event) {
        // The select2 id of the thing clicked (the layout's name) is event.val
        var layout_name = event.val;		

		var current_layout = "Current Layout: " + layout_name;         
	 
		$("#current-layout").text(current_layout);
		re_initialize_view();

        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        event.preventDefault();

		// Update state // swat
        //ctx.current_layout_index = // swat
		ctx.current_layout_name = layout_name;
		
		// If currently sorted by mutual information, the mutual information
		// values must be added for the specific layout and must be resorted.
		// Function will update current_layout_index & reextract stats if needed
		get_current_layout_index (layout_name, mutual_information_ranked);

    });

	create_indexed_layers_array ();


    // Set Default Values for Clumpiness Stats (Layout Indexed at 0)
	// Update Dropdown to reflect appropriately
	clumpiness_values(0);
	update_browse_ui();
};
})(app);
