// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    var USE_SELECT2_FOR_FILTER = false;

    // This holds an object form shortlisted layer names to jQuery shortlist UI
    // elements, so we can efficiently tell if e.g. one is selected.
    shortlist_ui = {};

    // How many layers do we know how to draw at once?
    var MAX_DISPLAYED_LAYERS = 2;
    var initialized = false;

    var scrollTop = 0; // Save scroll position while select from filter
    var filterControl = new ReactiveDict(); // To show or hide the filter area
    var filterValue = new ReactiveDict(); // filter value(s)

    var firstLayerAutorun; // Runs when the first layer is set or shortlist layers changes

    function reset_slider(layer_name, shortlist_entry) {
        // Given a layer name and a shortlist UI entry jQuery element, reset the 
        // slider in the entry to its default values, after downloading the layer. 
        // The default value may be invisible because we decided the layer should be
        // a colormap.
            
        // We need to set its boundaries to the min and max of the data set
        with_layer(layer_name, function(layer) {
        
            // We need the range slider
            shortlist_entry.find(".range").show();
            
            var minBound = layer.minimum;
            var maxBound = layer.maximum;
/*
            // TODO What sort of bounds do we want?
            
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
*/
            // Set the min, max and current value.
            shortlist_entry.find(".range-slider")
                .slider("option", "min", minBound)
                .slider("option", "max",  maxBound)
                .slider("values", [minBound, maxBound]);
                
            // Initialize the values stored
            filterValue.set(layer_name, [minBound, maxBound]);
            refreshColors();
        });
    }

    function create_filter_select_options (layer_name, layer, filter_value) {

        // Create the value filter dropdown for discrete values,
        // If we have not yet created it.
        // Note that binary values without entries in the input colormap file
        // DO have a colormap entry in the code.
        if (filter_value.children().length == 0) {

            // Find the option codes and text
            var first = 0,
                preSort,
                data = [];
            if (layer_name in colormaps) {
                if (colormaps[layer_name].length > 0) {

                    // Categorical or binary with colors assigned by input file
                    preSort = _.map(colormaps[layer_name], function (cat, code) {
                        return {text: cat.name, code: code};
                    });
                    data = _.sortBy(preSort, function (cat) {
                        return cat.text;
                    });
                } else {

                    // Binary without colors assigned my input file
                    first = 1;
                    data = [
                        {text: 1, code: 1},
                        {text: 0, code: 0},
                    ];
                }
            } else { // No colormap categorical

                for (var i = 0; i < layer.magnitude + 1; i++) {
                    data.push({text: i, code: i});
                }
            }

            // Create the option elements
            _.each(data, function (cat) {
                var option = $("<option/>")
                    .attr('value', cat.code)
                    .text(cat.text);
                filter_value.append(option);
            });

            // Select the appropriate option on first opening and update the UI
            filter_value.val(first);
            filterValue.set(layer_name, parseInt(first));
            refreshColors();

            // Define the event handler for selecting an item
            filter_value.on('change', function (ev) {
                filterValue.set(layer_name, parseInt(ev.target.value));
                refreshColors();
            });
        }
    }

    add_layer_data = function(layer_name, data, attributes) {
        // Add a layer with the given name, with the given data to the list of 
        // available layers.
        // Used for selections... more broadly can be used for dynamic layers.
        // Attributes is an object of attributes to copy into the layer.
        // May also be used to replace layers.
        // This holds a boolean for if we're replacing an existing layer.
        // Note: layers is a global, for layers on the presented map

        var replacing = (layers[layer_name] !== undefined);
        
        // Store the layer. Just put in the data. with_layer knows what to do if the
        // magnitude isn't filled in.
        layers[layer_name] = {
            url: undefined, //points to layer datafile
            data: data,     //actual values
            magnitude: undefined  //not used for binary
        };
        
        for(var name in attributes) {
            // Copy over each specified attribute
            layers[layer_name][name] = attributes[name];
        }

        if (replacing) {

            // We want to remove it from the appropriate data type list
            removeFromDataTypeList(layer_name);
            Session.set('sort', ctx.defaultSort());
        } else {
        
            // Add it to the sorted layer list, since it's not there yet.
            var sorted = Session.get('sortedLayers').slice();
            sorted.push(layer_name);
            Session.set('sortedLayers', sorted);
        }

        // Add this layer to the appropriate data type list
        addToDataTypeList(layer_name, data);

        // Don't sort because our caller does that when they're done adding layers.
    }

    function filter_control_changed (ev, $filter_contents, save_filter) {

        // Functionality for turning filtering on and off
        var layer_name = $(ev.target).data().layer_name;
        filterControl.set(layer_name, !filterControl.get(layer_name));
        if (filterControl.equals(layer_name, true)) {

            // First, figure out what kind of filter settings we take based on 
            // what kind of layer we are.
            with_layer (layer_name, function (layer) {
            
                if(have_colormap(layer_name)) {

                    // A discrete layer so show the value picker.

                    // If the select2 has not been created yet, create it
                    var filter_value = $filter_contents.find('.filter-value');
                    if (!filter_value.hasClass('select2-offscreen')) {
                        create_filter_select_options(layer_name, layer, filter_value);
                    }
                }
                
                $filter_contents.show();

                save_filter.button().click(function() {

                    // Clicking on the save button creates a dynamic layer
                    var value = filterValue.get(layer_name),
                        layer = layers[layer_name],
                        nodeIds = [];
                    
                    if (ctx.cont_layers.indexOf(layer_name) > -1) {

                        // Get the range values
                        nodesIds = _.filter(_.keys(polygons), function (nodeId) {
                            return (layer.data[nodeId] >= value[0]
                                    && layer.data[nodeId] <= value[1]);
                        });
                        value = value[0].toString() + ' to ' + value[1].toString();

                    } else { // Binary and categorical layers
                    
                        // Gather Tumor-ID Signatures with the value
                        nodeIds = _.filter(_.keys(polygons), function (nodeId) {
                            return (layer.data[nodeId] === value);
                        });
 
                        // Find the category label for the new layer name
                        var category = colormaps[layer_name][value];
                        if (category) {
                            value = category.name;
                        }
                    }
                    
                    // Suggest a name for this new layer
                    var name = layer_name + ': ' + value.toString();
                    
                    // Create the dynamic layer
                    create_dynamic_binary_layer (nodeIds, name);
                });
     
                refreshColors();
            });
        } else {

            // Hide the filtering settings
            $filter_contents.hide();

            // Refresh the colors since we're no longer filtering on this layer.
            refreshColors();
        }
    }

    function create_selector (layer_name, root) {
 
        // Add a select input to pick from a discrete list of values to filter on
        if (USE_SELECT2_FOR_FILTER) {
            var filter_value = $("<div/>").addClass("filter-value");
        } else {
            var filter_value = $("<select/>").addClass("filter-value");
        }
 
        return filter_value;
    }

    function create_range_slider (layer_name, root) {
 
        // Add a slider for setting the min and max for drawing
        var slider = $("<div/>").addClass("range range-slider");
 
        // And a box that tells us what we have selected in the slider.
        var display = $("<div/>").addClass("range range-display");
        display.append($("<span/>").addClass("low"))
            .append(" to ")
            .append($("<span/>").addClass("high"));

        // Configure the range slider
        
        // First we need a function to update the range display, which we will run 
        // on change and while sliding (to catch both user-initiated and 
        // programmatic changes).
        var update_display = function(event, ui) {
 
            // Update the values below the slider
            display.find('.low').text(ui.values[0].toExponential(1));
            display.find('.high').text(ui.values[1].toExponential(1));
        }
 
        var update_filter = function (event, ui) {

            // The user has finished sliding
            var min = ui.values[0],
                max = ui.values[1],
                range = [min, max],
                $root = $(event.target).parents('.shortlist-entry'),
                layer_name = $root.data('layer');
            filterValue.set(layer_name, range);
            refreshColors();
        }
 
        slider.slider({
            range: true,
            min: -1,
            max: 1,
            height: 10,
            values: [-1, 1],
            step: 1E-9, // Ought to be fine enough
            slide: update_display,
            change: update_display,
            stop: update_filter,
        });
        
        // When we have time, go figure out whether the slider should be here, and 
        // what its end values should be.
        reset_slider(layer_name, root);
 
        var settings = $("<div/>").addClass("settings");
        settings
            .append($("<div/>").addClass("stacker").append(slider))
            .append($("<div/>").addClass("stacker").append(display));
 
        return settings;
    }

    function create_filter (layer_name, root) {
 
        // Add a div to hold the filtering stuff so it wraps together.
        var contents = root.find('.filter-contents-cell');
        contents.hide();

        // Add filter depending on layer data type
        if (ctx.cont_layers.indexOf(layer_name) > -1) {
            contents.append(create_range_slider(layer_name, root));
        } else {
            var filter_value = create_selector(layer_name, root);
            contents.append(filter_value);
        }

        // Add a image for the save function
        var save_filter = $("<img/>").attr("src", "file-new.svg");
        save_filter.addClass("save-filter");
        save_filter.attr("title", "Save Filter as Layer");
        contents.append(save_filter);
 
        // Add a control for toggling display of filter elements
        var filter_control = $('<img />');
        filter_control
            .attr({ src: 'filter.svg', title: 'Filter values' })
            .addClass("filter-on filter")
            .data('layer_name', layer_name)
            .click(function (ev) {
                    filter_control_changed(ev, contents, save_filter);
                })
            .button();
        root.find('.filter-controls-cell').append(filter_control);
        filterControl.set(layer_name, false);
    }

    function create_controls (layer_name, root) {

        // This is the button control panel of the shortlist
       var controls = $('<div />');
        root.find('.shortlist-controls-cell').append(controls);
        controls.addClass('shortlist-controls');
        
        // Add a remove link
        var remove_link = $("<a/>").addClass("remove").attr("href", "#").text("X");
        remove_link.attr("title", "Remove from Shortlist");
        controls.append(remove_link);

        // Add a checkbox for whether this is enabled or not
        var checkbox = $("<input/>").attr("type", "checkbox").addClass("layer-on");
        controls.append(checkbox);

        // Handle enabling and disabling the layer
        checkbox.change(function() {
            if($(this).is(":checked") && get_current_layers().length > 
                MAX_DISPLAYED_LAYERS) {
                    
                // Enabling this checkbox puts us over the edge, so un-check it
                $(this).prop("checked", false);
                
                // Skip the color refresh
                return;
            }
        
            refreshColors();
        });
        
        // Handle the removal from the short list
        remove_link.click(function() {

            // If this layer has a delete function, do that
            if (layers[layer_name].removeFx) {
                layers[layer_name].removeFx(layer_name);
            }

            // Remove this from the DOM
            root.remove();

            // Make the UI match the list.
            update_shortlist(layer_name, true);
            if(checkbox.is(":checked") || filterControl.equals(layer_name, true)) {
                // Refresh the colors since we were selected (as coloring or filter)
                // before removal.
                refreshColors();
            }
        
            // Handle dynamic layers
            if (layers[layer_name].selection) {
                delete layers[layer_name];
                removeFromDataTypeList(layer_name);
            }

        });
    }

    function create_shortlist_entry (layer_name) {
 
        // Makes a shortlist DOM element for one layer.

        // Skip this if this layer's data does not yet exist
        if (!layers[layer_name]) return;

        // This holds the root element for this shortlist UI entry
        var root = $("<div/>").addClass("shortlist-entry");
        root.data("layer", layer_name);
        
        // If this is a selection, give the layer a special class
        // TODO: Justify not having to use with_layer because this is always known 
        // client-side
        if(layers[layer_name].selection) {
            root.addClass("selection");
        }
 
        // Load the shortlist entry template
        Blaze.render(Template.shortlistEntryT, root[0]);

        // Create the button control panel
        create_controls(layer_name, root);

        // Make a handle for the contents cell
        var contents = root.find('.shortlist-contents-cell');
        
        // Add the layer name
        contents.append($("<span/>").text(layer_name));
        
        // Add all of the metadata
        var metadata_holder = $("<div/>").addClass("metadata-holder");
        fill_layer_metadata(metadata_holder, layer_name);
        contents.append(metadata_holder);
 
        // Create the histogram
        if (ctx.cont_layers.indexOf(layer_name) > -1) {
            var histogram = newHistogram(layer_name);
            contents.append(histogram);
        }

        // Create the filter control panel button and content
        create_filter(layer_name, root);

        return root;
    }

    update_shortlist = function (layer_name, remove) {
 
        // Go through the shortlist and make sure each layer there has an entry in 
        // the shortlist UI, and that each UI element has an entry in the shortlist.
        // Also make sure the metadata for all existing layers is up to date.
        // layer_name is optional. If layer_name is already in the list, we'll
        // update the short list with the layer's current data.
 
        // Update the shortlist layer names array
        var list = Session.get('shortlist').slice();
        if (remove) {
            list.splice(list.indexOf(layer_name), 1);
        } else if (layer_name && list.indexOf(layer_name) < 0) {
            list.push(layer_name);
        }
        Session.set('shortlist', list);

        // Clear the existing DOM list
        shortlist_ui = {};

        // Get the list of shortlist layer names
        var shortlist = Session.get('shortlist');

        // For each shortlist name, put a false in the DOM list
        for(var i = 0; i < shortlist.length; i++) {
            shortlist_ui[shortlist[i]] = false;
        }
 
        // For each DOM element in the DOM list...
        $("#shortlist").children().each(function(index, element) {
        
            // If the DOM element's layer name is still in the shortlist...
            if(shortlist_ui[$(element).data("layer")] === false) {
                
                // Save the element in the DOM list
                shortlist_ui[$(element).data("layer")] = $(element);
                
                // Update the metadata in the element. It make have changed due
                // to new statistics info.
                fill_layer_metadata($(element).find(".metadata-holder"), 
                    $(element).data("layer"));
            } else {
            
                // The DOM element isn't in the DOM list, so get rid of it.
                $(element).remove();
            }
        });
 
        // For each layer name in the DOM list...
        for(var layer_name in shortlist_ui) {
 
            // If the layer name does not have a DOM element...
            if(shortlist_ui[layer_name] === false) {

                 // Create a DOM element for this shortlist layer
                 shortlist_ui[layer_name] = create_shortlist_entry(layer_name);
                 $("#shortlist").prepend(shortlist_ui[layer_name]);
 
                if (shortlist_ui[layer_name]) {
 
                    // If the DOM element was created, show its colors on the
                    // map if the number showing is not yet maxed out.
                    shortlist_ui[layer_name].find(".layer-on").click();
                }
            }
        }
        
        // Make things re-orderable
        // Be sure to re-draw the view if the order changes, after the user puts 
        // things down.
        $("#shortlist").sortable({
            update: refreshColors,
            // Sort by the part with the lines icon, so we can still select text.
            handle: ".shortlist-controls" 
        });
    }

    function make_layer_name_unique (layer_name) {
 
        var name = layer_name,
            seq = 1;
 
        // Special case a default selection label
        if (layer_name === 'Selection 1') {
            seq = 2;
        }
 
        // Keep looking for a name until it is unique
        while (true) {
 
            // We're done if the name is unique
            if (layers[name] === undefined) break;
     
            // Remove the last sequence number applied if there was one
            var last_suffix = ' ' + String(seq - 1);
            start = name.length - last_suffix.length;
            if (name.slice(start) === last_suffix) {
                name = name.slice(0, start);
            }

            // Add the new sequence number.
            name = name + ' ' + String(seq);
            seq += 1;
        }
        return name;
    }
 
    function ask_user_to_name_layer(layer_name, dup_name) {
 
        // Give the user a chance to name the layer
        var promptString = (dup_name)
                            ? dup_name + ' is in use, how about this one?'
                            : 'Please provide a label for this new layer',
            text = prompt(promptString, layer_name);
        if (text) {
            return text.trim();
        } else {
            return undefined;
        }
    }
 
    function let_user_name_layer(layer_name) {
 
        var name = layer_name;
 
        // if no layer name was supplied, assume this is a selection
        if (!name) {
            name = 'Selection 1';
        } else {
            name = name.trim();
        }
 
        // Start with a unique name as a suggestion
        name = make_layer_name_unique(name);
 
        var unique_name,
            dup_name;
 
        // Keep asking the user for a name until it is unique or she cancels
        while (true) {
            name = ask_user_to_name_layer(name, dup_name);
            
            // We're done if she cancels
            if (name === undefined) break;
 
            unique_name = make_layer_name_unique(name);
            
            // We're done if the name is unique
            if (unique_name === name) break;

            // Suggest another unique name
            dup_name = name;
            name = unique_name;
        }
        return name;
    }
 
    create_dynamic_binary_layer = function (nodeIds, new_layer_name) {
 
        // Given an array of node IDs, add a new binary layer containing ones
        // for those nodes and zeroes for the rest. So every node will have a
        // value in this new layer.
        //
        // new_layer_name is an optional parameter. If no name is passed,
        // "selection + #" will be suggested as the layer name.

        if (nodeIds.length < 1) {
            banner('warn', "No hexagons were selected.");
            return;
        }

        // Build the data for this layer with ones for those nodeIDs in the
        // given node list and zeros in the rest
        var data = {};
        _.each(polygons, function (val, nodeID) {
            if (nodeIds.indexOf(nodeID) > -1) {
                data[nodeID] = 1;
            } else {
                data[nodeID] = 0;
            }
        });
 
        var positives = _.filter(data, function (nodeValue) {
                return nodeValue > 0;
            });

        var name = let_user_name_layer(new_layer_name);
 
        if (name) {
 
            // Add the layer
            add_layer_data(name, data, {
                selection: true,
                selected: positives.length, // Display how many hexes are in
                positives: positives.length, // TODO someday simplify selection, selected & positives
                n: _.keys(data).length // And how many have a value, which is all in this case
            });
            
            // Update the browse UI with the new layer.
            update_shortlist(name);
        }
 
        return (name);
    }

    create_dynamic_category_layer = function (layer_name, data, attributes,
            colormap) {
 
        // @param: layer_name: layer name for the global layers object
        // @param: data: data for the global layers
        // @param: attributes: attributes for the global layers. At least these
        //                     should be included for now:
        //                         selection
        //                         n
        //                         magnitude
        // @param: colormap: the colormap for this layer, required for now
 
        add_layer_data(layer_name, data, attributes);
        update_shortlist(layer_name);
        colormaps[layer_name] = colormap;
    }
 
    get_current_layers = function () {
        // Returns an array of the string names of the layers that are currently
        // supposed to be displayed, according to the shortlist UI.
        // Not responsible for enforcing maximum selected layers limit.
        // TODO why don't we keep track of this dynamically rather than when asked?
        
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

    with_filtered_signatures = function (filters, callback) {
        // Takes an array of filters, as produced by get_current_filters.
        // Computes an array of all signatures passing all filters, and passes that
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

    get_current_filters = function () {

        // Returns an array of filter objects, according to the shortlist UI.
        // Filter objects have a layer name and a boolean-valued filter function 
        // that returns true or false, given a value from that layer.
        var current_filters = [];
        
        $("#shortlist").children().each(function(index, element) {

            // Go through all the shortlist entries.
            // This function is also the scope used for filtering function config 
            // variables.

            // Get the layer name
            var layer_name = $(element).data("layer");

            // They 'on' checkbox and the filter checkbos must be checked
            // to apply a filter
            var $on = $(element).find(".layer-on");
            if (filterControl.equals(layer_name, true) && $on.is(":checked")) {

                // Put the layer in if its checkbox is checked.
                
                // This will hold our filter function. Start with a no-op filter.
                var filter_function = function(value) {
                    return true;
                }

                // Define the functions and values to use for filtering
                var desired = filterValue.get(layer_name);
                
                if (ctx.cont_layers.indexOf(layer_name) > -1) {
                
                     // Use a range for continuous values.
                    filter_function = function(value) {
                         return (value >= desired[0] && value <= desired[1]);
                    }
                } else {

                    // Use a discrete value match.
                    filter_function = function(value) {
                        return (value === desired);
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

    get_slider_range = function (layer_name) {
        // Given the name of a layer, get the slider range from its shortlist UI 
        // entry.
        // Assumes the layer has a shortlist UI entry.
        return shortlist_ui[layer_name].find(".range-slider").slider("values");
    }

    initShortlist = function () {
        if (initialized) return;
        initialized = true;
        
        firstLayerAutorun = Tracker.autorun(function () {
        
            var first = Session.get('first_layer'),
                shortlist = Session.get('shortlist');
                
            if (!_.isUndefined(first) && shortlist.length < 1) {
                update_shortlist(first);
             }
        });
    }
})(app);
