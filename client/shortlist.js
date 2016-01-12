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

    // This holds the next selection number to use. Start at 1 since the user
    // sees these.
    var selection_next_id = 1;

    var scrollTop = 0; // Save scroll position while select from filter
    var filterControl = new ReactiveDict(); // To show or hide the filter area
    var filterSelector = new ReactiveDict(); // Discrete data-type filter value
    var filterThreshold = new ReactiveDict(); // Continuous data-type filter value

    var firstLayerAutorun; // Runs when the first layer is set or shortlist layers changes

    // Boolean for Creating Layer from Filter
    var created = false;

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

    function createFilterSelector (layer_name, layer, filter_value) {

        // Create the value filter dropdown for discrete values
        if (USE_SELECT2_FOR_FILTER) {
            var option,
                selData = [];
            for (var i = 0; i < layer.magnitude + 1; i++) {

                // Make an option for each value.
                option = {id: String(i), text: String(i)};

                if (colormaps[layer_name].hasOwnProperty(i)) {

                    // We have a real name for this value
                    option.text = colormaps[layer_name][i].name;
                }
                selData.push(option);
            }
            
            // Select the last option, so that 1 on 0/1 layers will 
            // be selected by default.
            filterSelector.set(layer_name, String(i-1));
            createOurSelect2(filter_value, {data: selData}, filterSelector.get(layer_name));

            // Define the event handler for selecting an item
            filter_value.on('change', function (ev) {
                filterSelector.set(layer_name, parseInt(ev.target.value));
                $('#shortlist').scrollTop(scrollTop);
                refresh();
            });

            // On opening the drop-down save the scroll position
            filter_value.parent().on('select2-open', function () {
                scrollTop = $('#shortlist').scrollTop();
            });

        } else {

            // Make sure we have all our options
            if (filter_value.children().length == 0) {

                // No options available. We have to add them.
                for (var i = 0; i < layer.magnitude + 1; i++) {

                    // Make an option for each value.
                    var option = $("<option/>").attr("value", i);
                    if (colormaps[layer_name].hasOwnProperty(i)) {

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

                // Define the event handler for selecting an item
                filter_value.on('change', function (ev) {
                    filterSelector.set(layer_name, parseInt(ev.target.value));
                    refresh();
                });
            }
        }
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

     function filterControlChanged (ev, filter_value, filter_threshold, save_filter) {

        // Functionality for turning filtering on and off
        var layer_name = $(ev.target).data().layer_name;
        filterControl.set(layer_name, ev.target.checked);
        if(filterControl.equals(layer_name, true)) {

            // First, figure out what kind of filter settings we take based on 
            // what kind of layer we are.
            with_layer(layer_name, function(layer) {
                if(have_colormap(layer_name)) {

                    // A discrete layer so show the value picker.

                    // If the select2 has not been created yet, create it
                    if (!filter_value.hasClass('select2-offscreen')) {
                        createFilterSelector(layer_name, layer, filter_value);
                    }
                    if (USE_SELECT2_FOR_FILTER) {
                        filter_value.select2("container").show();
                    } else {
                        filter_value.show();
                    }
                    filter_threshold.hide();
                } else {

                    // Not a discrete layer, so we take a threshold.
                    filter_threshold.show();
                    if (USE_SELECT2_FOR_FILTER) {
                        filter_value.select2("container").hide();
                    } else {
                        filter_value.hide();
                    }
                }
                
                save_filter.show();
                        
                save_filter.button().click(function() {

                    // Configure Save Filter Buttons

                    // Get selected value
                    var value = filterSelector.get(layer_name);
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
                    // TODO the below is negating the above
                    created = false;			
                });
    
                // Now that the right controls are there, assume they have 
                refresh();
            });
        } else {

            created = false;
            // Hide the filtering settings
            if (USE_SELECT2_FOR_FILTER) {
                filter_value.select2("container").hide();
            } else {
                filter_value.hide();
            }
            filter_threshold.hide();
            save_filter.hide();

            // Draw view since we're no longer filtering on this layer.
            refresh();
        }
    }

    function createFilterUi (layer_name) {
        // Add a div to hold the filtering stuff so it wraps together.
        var filter_holder = $("<div/>").addClass("filter-holder");
        
        // Add an image label for the filter control.
        // TODO: put this in a label
        var filter_image = $("<img/>").attr("src", Session.get('proxPre') + "filter.svg");
        filter_image.attr("title", "Filter on Layer");
        filter_image.addClass("filter");
        
        // Add a control for filtering
        var filter_control = $("<input/>").attr("type", "checkbox");
        filter_control.addClass("filter-on");
        filter_control.data('layer_name', layer_name);
        filter_holder.append(filter_image);
        filter_holder.append(filter_control);
        filterControl.set(layer_name, false);

        // Add a text input to specify a filtering threshold for continuous layers
        var filter_threshold = $("<input/>").addClass("filter-threshold");
        // Initialize to a reasonable value.
        filter_threshold.val(0);
        filter_holder.append(filter_threshold);
        filter_threshold.hide();

        // TODO: Add a longer delay before refreshing here so the user can type more
        // interactively.
        filter_threshold.keyup(function (ev) {
            filterThreshold.set(layer_name, parseInt(ev.target.value));
            refresh();
        });

        // Add a select input to pick from a discrete list of values to filter on
        if (USE_SELECT2_FOR_FILTER) {
            var filter_value = $("<div/>").addClass("filter-value");
        } else {
            var filter_value = $("<select/>").addClass("filter-value");
        }

        filter_holder.append(filter_value);
        filter_value.hide();

        // Create a handler for the filter control being turned on and off
        filter_control.change(function (ev) {
            filterControlChanged(ev, filter_value, filter_threshold, save_filter);
        });

        // Add a image for the save function
        var save_filter = $("<img/>").attr("src", Session.get('proxPre') + "file-new.svg");
        save_filter.addClass("save-filter");
        save_filter.addClass("file-new");
        save_filter.attr("title", "Save Filter as Layer");
        filter_holder.append(save_filter);

        return filter_holder;
    }

    function make_shortlist_ui (layer_name) {

        // Skip this if the layers data does not yet exist for this layer
        if (!layers[layer_name]) return;

        // Return a jQuery element representing the layer with the given name in
        // the shortlist UI.

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
        var moveIcon = Session.get('proxPre') + 'resize-vertical.svg';
        controls.css('background-image', 'url(' + moveIcon + ')');
        
        // Add a remove link
        var remove_link = $("<a/>").addClass("remove").attr("href", "#").text("X");
        remove_link.attr("title", "Remove from Shortlist");
        controls.append(remove_link);

        // Add a checkbox for whether this is enabled or not
        var checkbox = $("<input/>").attr("type", "checkbox").addClass("layer-on");
        
        controls.append(checkbox);
        
        root.append(controls);

        /* TODO we no longer want to remove selections without also removing them 
                from the long list, use this logic for selections for the normal 
                remove button, and remove this section
        */
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

        // Create and add the filter holder to the shortlist content pane
        contents.append(createFilterUi(layer_name));

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
            var short = Session.get('shortlist').slice();
            short.splice(short.indexOf(layer_name), 1);
            Session.set('shortlist', short);
            
            // Remove this from the DOM
            root.remove();

            // Make the UI match the list.
            update_shortlist_ui();
            if(checkbox.is(":checked") || filterControl.equals(layer_name, true)) {
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
                var short = Session.get('shortlist').slice(); // var b = a.slice();
                short.splice(short.indexOf(layer_name), 1);
                Session.set('shortlist', short);

                // Remove this from the DOM
                root.remove();

                // Make the UI match the list.
                update_shortlist_ui();
                if(checkbox.is(":checked") || filterControl.equals(layer_name, true)) {
                    // Re-draw the view since we were selected (as coloring or filter) 
                    // before removal.
                    refresh();
                }

                // Remove from layers lists and data type list
                var sorted = Session.get('sortedLayers').slice();
                sorted.splice(sorted.indexOf(layer_name), 1);
                Session.set('sortedLayers', sorted);

                delete layers[layer_name];
                removeFromDataTypeList(layer_name);
                Session.set('sort', ctx.defaultSort());

                // Alter "keep" property of the created attribute
                for (var i = 0; i < ctx.created_attr.length; i++) {
                    if (ctx.created_attr[i].l_name == layer_name) {
                        ctx.created_attr[i].keep = false;
                        break;
                    }
                }
            
                // Update the browse UI with the new layer.
                update_browse_ui();
            });
        }

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
        reset_slider(layer_name, root);
        
        return root;
    }

    update_shortlist_ui = function () {
        // Go through the shortlist and make sure each layer there has an entry in 
        // the shortlist UI, and that each UI element has an entry in the shortlist.
        // Also make sure the metadata for all existing layers is up to date.

        // Clear the existing UI lookup table
        shortlist_ui = {};

        var shortlist = Session.get('shortlist');

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
                if (shortlist_ui[layer_name]) {
                 shortlist_ui[layer_name].find(".layer-on").click();
                }
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
    }

    function selectSetOperList(to_select, function_type, new_layer_name) {

        // Prepare the set operation selection for adding to the long & shortlists
        var layer_name,
            default_name = {
                "intersection": "L1 ∩ L2",
                "union": "L1 U L2",
                "set difference": "L1 \\ L2",
                "symmetric difference": "L1 ∆ L2",
                "absolute complement": "Not: L1",
            };

        // Give the user a chance to name the layer
        if (new_layer_name === undefined) {
            var text = prompt('Please provide a label for your ' + function_type,
                default_name[function_type]);
             if (text != null) {
                layer_name = text;
             }
             if (!text) {
                return undefined;
             }
        } else {
            layer_name = new_layer_name;
        }

        // Build the data for this layer with ones for those hexes in to_select
        // and zeros in the rest
        var data = {},
            signatures_available = 0;
        _.each(polygons, function (val, hex) {
            if (to_select.indexOf(hex) > -1) {
                data[hex] = 1;
            } else {
                data[hex] = 0;
            }
            signatures_available += 1;
        });

        return {layer_name: layer_name,
                data: data,
                signatures_available: signatures_available};
    }

    select_list = function (to_select, function_type, layer_names, new_layer_name,
        shortlist_push) {
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
        
        // Is this selection the result of a set operation?
        var setOperation = function_type === 'intersection'
            || function_type === 'union'
            || function_type === 'set difference'
            || function_type === 'symmetric difference'
            || function_type === 'absolute complement';

        if (to_select.length < 1) {
            banner('warn', setOperation
                ? "No hexagons were selected as a result of the set operation"
                : "No hexagons were selected. Maybe part of your selection area wrapped around googlemap's world"
                );
            return;
        }

        var layer_name;
        // How many signatures get selected?
        var signatures_selected = 0;

        // If this is the result of a set operation...
        if (setOperation) {

            // Exclude filters for set operation results
            var r = selectSetOperList(to_select, function_type, new_layer_name);
            if (_.isUndefined(r) || r.layer_name === null) return;

            layer_name = r.layer_name;
            data = r.data;
            signatures_available = r.signatures_available;
            signatures_selected = to_select.length;

        } else {
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
            
            // Start it out with 0 for each signature. Otherwise we will have missing
            // data for signatures not passing the filters.
            for(var signature in polygons) {
                data[signature] = 0;
                signatures_available += 1;
            }

            // This holds the filters we're going to use to restrict our selection
            var filters = get_current_filters();

            // Go get the list of signatures passing the filters and come back.
            with_filtered_signatures(filters, function(signatures) { 

                // How many signatures get selected?
                signatures_selected = 0;
             
                for(var i = 0; i < signatures.length; i++) {
                    if(wanted[signatures[i]]) {
                        // This signature is both allowed by the filters and requested.
                        data[signatures[i]] = 1;
                        signatures_selected++;           
                    }
                }

                // Complain if no hexagons were selected after applying the filters
                if (signatures_selected < 1) {
                    banner('warn', 'No hexagons are selected after applying the filters.');
                    return;
                }

                // Default Values for Optional Parameters
                if (function_type === undefined && layer_names === undefined){
                    layer_name = "Selection " + selection_next_id;
                    selection_next_id++;
                }

                if (new_layer_name === undefined) {
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
                    }

                    // saved filter for layer name
                    if (function_type == "save") {
                        layer_name =  "(" + layer_names[0] + ")";
                    }
                } else {
                    // Layer name already exists. User is loading a previous session.
                    layer_name = new_layer_name;
                }
            });
        }

        // Add the layer. Say it is a selection
        add_layer_data(layer_name, data, {
            selection: true,
                selected: signatures_selected, // Display how many hexes are in
            n: signatures_available // And how many have a value at all
        });
        
        // Update the browse UI with the new layer.
        update_browse_ui();
        var shortlist = Session.get('shortlist').slice();
        if (shortlist_push !== false) {
            // Immediately shortlist it if the attribute is being created for
            // the first time.
            shortlist.push(layer_name);
            Session.set('shortlist', shortlist);
            update_shortlist_ui();
        } else if (shortlist.indexOf(layer_name) >= 0) {
            // Immediately update shortlist it if the attribute is being loaded
            // and has been declared as part of the shortlist.
            update_shortlist_ui();
        }
        new_layer_name = layer_name;

        return (new_layer_name);
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

            // This is the checkbox value that determines if we use this layer's
            // filter
            if (filterControl.equals(layer_name, true)) {

                // Put the layer in if its checkbox is checked.
                
                // This will hold our filter function. Start with a no-op filter.
                var filter_function = function(value) {
                    return true;
                }

                // Define the functions and values to use for filtering
                // If this layer has a colormap it has discrete values
                if (have_colormap(layer_name)) {

                    // Use a discrete value match.
                    var desired = filterSelector.get(layer_name);
                    
                    filter_function = function(value) {
                        return value == desired;
                    }
                } else {

                     // Use a threshold for continuous values.
                    var threshold = filterThreshold.get(layer_name);

                    filter_function = function(value) {
                        return value > threshold;
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
            var first = Session.get('first_layer');
            if (!_.isUndefined(first) && Session.get('shortlist').length < 1) {
                Session.set('shortlist', [first]);
                update_shortlist_ui();
            }
        });
    }
})(app);
