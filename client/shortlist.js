// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    // This holds an object form shortlisted layer names to jQuery shortlist UI
    // elements, so we can efficiently tell if e.g. one is selected.
    shortlist_ui = {};

    // How many layers do we know how to draw at once?
    var MAX_DISPLAYED_LAYERS = 2;
    var initialized = false;

    var scrollTop = 0; // Save scroll position while select from filter
    var layerActive = new ReactiveDict(); // is this layer is active or not
    var filterShow = new ReactiveDict(); // To show or hide the filter area
    var filterValue = new ReactiveDict(); // filter value(s) for range or category
 
    var template = {}; // The template for each layer

    var firstLayerAutorun; // Runs when the first layer is set or shortlist layers changes
 
    function get_range_value (layer_name, i) {
        var vals = filterValue.get(layer_name.toString());
        if (vals && vals[i]) {
            return Number(vals[i]).toExponential(1);
        } else {
            return i ? 'low' : 'high';
        }
    }

    Template.shortlistEntryT.helpers({
        shortlist: function () {
            return Session.get('shortlist');
        },
        range_value_display: function () {
            return (is_continuous(this)) ? 'initial' : 'none';
        },
        filter_row_top: function () {
            return (is_continuous(this)) ? '0' : '0';
        },
        
        filter_image: function () {
            var name = this.toString();
            // TODO this should also check for this layer being active
            // for the orange filter to show
            return (filterShow.get(name)) 
                //&& get_current_layers().indexOf(name) > -1)
                        ? 'filterCaution.svg' : 'filter.svg';
        },
        filter_display: function () {
            return (filterShow.get(this)) ? 'initial' : 'none';
        },
        filter_value_display: function () {
            return (is_continuous(this)) ? 'none' : 'initial';
        },
        filter_value: function () {
            return filterValue.get(this);
        },
        range: function () {
            var vals = filterValue.get(this);
            return (_.isUndefined(vals)) ? [0,0] : vals;
        },
        slider_display: function () {
            return (is_continuous(this)) ? 'inline-block' : 'none';
        },
        low: function () {
            return get_range_value(this, 0);
        },
        high: function () {
            return get_range_value(this, 1);
        },
    })
/*
    // Unused. We may want this to set the bounds of the range slider if we 
    // want something other than the layer's min and max.
    function reset_slider(layer_name, shortlist_entry) {
        // Given a layer name and a shortlist UI entry jQuery element, reset the 
        // slider in the entry to its default values, after downloading the layer. 
        // The default value may be invisible because we decided the layer should be
        // a colormap.
            
        // We need to set its boundaries to the min and max of the data set
        with_layer(layer_name, function(layer) {
        
            var minBound = layer.minimum;
            var maxBound = layer.maximum;
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
            // Set the min, max and current value.
            shortlist_entry.find(".range-slider")
                .slider("option", "min", minBound)
                .slider("option", "max",  maxBound)
                .slider("values", [minBound, maxBound]);
                
            // Initialize the values stored
            refreshColors();
        });
    }
*/
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

    function filter_control_changed (ev) {

        // Functionality for turning filtering on and off
        var layer_name = $(ev.target).data().layer;
        var root = $(ev.target).parents('.shortlist-entry');
        var filter_contents = root.find('.filter-contents-cell')
        var save_filter = root.find('.save-filter');
        filterShow.set(layer_name, !filterShow.get(layer_name));
        if (filterShow.equals(layer_name, true)) {
 
            // Move the filter button down to the filter controls
            // to eliminate blank space betweeen main content and filter content
            //root.find('.filter-controls-cell').append(root.find('.filter'));

            // Figure out what kind of filter settings we take based on
            // what kind of layer we are.
            with_layer (layer_name, function (layer) {
            
                if (is_continuous(layer_name)) {
                
                    // Add a range slider if one is not there yet
                    if (root.find('.ui-slider-range').length < 1) {
                        create_range_slider(layer_name, root);
                    }
                } else {

                    // Add a value picker if one is not there yet
                    var filter_value = filter_contents.find('.filter-value');
                    if (!filter_value.hasClass('select2-offscreen')) {
                        create_filter_select_options(layer_name, layer, filter_value);
                    }
                }

                save_filter.button().click(function() {

                    // Clicking on the save button creates a dynamic layer
                    var value = filterValue.get(layer_name),
                        layer = layers[layer_name],
                        nodeIds = [];
                    
                    if (is_continuous(layer_name)) {

                        // Get the range values
                        nodeIds = _.filter(_.keys(polygons), function (nodeId) {
                            return (layer.data[nodeId] >= value[0]
                                    && layer.data[nodeId] <= value[1]);
                        });
                        value = value[0].toExponential(1).toString()
                            + ' to ' + value[1].toExponential(1).toString();

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

            // Move the filter button up to the main controls to eliminate
            // blank space betweeen main control and filter control
            //Meteor.setTimeout(function () {
            //    root.find('.controls').append(root.find('.filter'));
            //}, 0);

            // Refresh the colors since we're no longer filtering on this layer.
            refreshColors();
        }
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
            filterValue.set(layer_name, parseInt(first));
            refreshColors();

            // Define the event handler for selecting an item
            filter_value.on('change', function (ev) {
                filterValue.set(layer_name, parseInt(ev.target.value));
                refreshColors();
            });
        }
    }
 
    function create_range_slider (layer_name, root) {
 
        var layer = layers[layer_name],
            min = layer.minimum,
            max = layer.maximum,
            span = max - min;
 
        // Handle a slider handle moving
        var update_display = function(event, ui) {
            var low = ui.values[0],
                high = ui.values[1];
            filterValue.set(layer_name, [low, high]);
 
            // Set the width of the low and high masks
            var x_span = $(event.target).width(),
                x_low_width = Math.abs(low - min) / span * x_span,
                x_high_width = Math.abs(max - high) / span * x_span;
 
            root.find('.low_mask').width(x_low_width);
            root.find('.high_mask').width(x_high_width);
 
        }
 
        // Handler to apply the filter after the user has finished sliding
        var update_filter = function (event, ui) {
            filterValue.set(layer_name, [ui.values[0], ui.values[1]]);
            refreshColors();
        }
 
        // Create the slider
        root.find('.range-slider').slider({
            range: true,
            min: min,
            max: max,
            values: [min, max],
            height: 10,
            step: 1E-9, // Ought to be fine enough
            slide: update_display,
            change: update_display,
            stop: update_filter,
        });
    }

    function create_controls (layer_name, root) {

        // This is the button control panel of the shortlist
 
        // Handle enabling and disabling the layer
 
        console.log('adding layer-on change handler');
 
        root.find('.layer-on').on('change', function () {
        
            console.log('get_current_layers()', get_current_layers());
            
            if ($(this).is(":checked")
                    && get_current_layers().length > MAX_DISPLAYED_LAYERS) {
                    
                // Enabling this checkbox puts us over the edge, so un-check it
                $(this).prop("checked", false);
                
                // Skip the color refresh
                return;
            }
            refreshColors();
        });
        
        // Handle the removal from the short list
        root.find('.remove').click(function() {

            // If this layer has a delete function, do that
            if (layers[layer_name].removeFx) {
                layers[layer_name].removeFx(layer_name);
            }

            // Remove this from the template & DOM
            delete template[layer_name];
            root.remove();

            // Make the UI match the list.
            update_shortlist(layer_name, true);
            refreshColors();
        
            // Handle dynamic layers
            if (layers[layer_name].selection) {
                delete layers[layer_name];
                removeFromDataTypeList(layer_name);
            }
            
            // Clear any google chart associated with this layer
            clear_google_chart(layer_name);
        });
    }
 
    function find_root_of_entry (layer_name) {
        // $("ul").find(el + "[data-slide='" + current +"']");
        return $('.shortlist-entry[data-layer="' + layer_name + '"]');;
    }
 
    function create_shortlist_entry_with_data (layer_name, root) {
 
        // Create the button control panel
        create_controls(layer_name, root);

        // Add all of the metadata
        var metadata_holder = root.find('.metadata-holder');
        fill_layer_metadata(metadata_holder, layer_name);
 
        // Create the chart
        if (is_continuous(layer_name)) {
            newGchart(layer_name, root.find('.chart'), 'histogram');
            filterValue.set(layer_name, [
                layers[layer_name].minimum.toExponential(1),
                layers[layer_name].maximum.toExponential(1)
            ]);
 
            // Put a tick on zero if zero is in the range.
            // The dom object needs to be drawn already so we can see the offset.
            var min = layers[layer_name].minimum,
                max = layers[layer_name].maximum;
            if (0 > min && 0 < max) {
                Meteor.setTimeout(function () {
                    var root = find_root_of_entry(layer_name),
                        chart = root.find('.chart'),
                        x_min = chart.offset().left,
                        x_span = chart.width(),
                        x_low_width = -min / (max - min) * x_span;
                    root.find('.zero_tick').css('left', x_low_width);
                    root.find('.zero').css('left', x_low_width -9);
                }, 500);
            }

        } else {
            newGchart(layer_name, root.find('.chart'), 'barChart');
        }
 
        // Create the filter button for toggling display of filter elements
        root.find('.filter').button().click(filter_control_changed);
    }
 
    function create_shortlist_entry (layer_name) {
 
        // Makes a shortlist DOM element tree for one layer.

        // Skip this if this layer does not yet exist
        if (!layers[layer_name]) return;
 
        // Initialize some vars used in the template
        layerActive.set(layer_name, true);
        filterShow.set(layer_name, false);

        // Load the shortlist entry template, passing the layer name
        template[layer_name] = Blaze.renderWithData(
            Template.shortlistEntryT, {layer: [layer_name]}, $('#shortlist')[0]);

        // This is the root element of this shortlist UI entry
        var root = $('#shortlist')
            .find('.shortlist-entry[data-layer="' + layer_name + '"]');

        // Is this is a selection ?
        if (layers[layer_name].selection) {
            root.addClass("selection");
            create_shortlist_entry_with_data(layer_name, root);
        } else {
            with_layer(layer_name, function () {
                create_shortlist_entry_with_data (layer_name, root);
            });
        }
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
            handle: ".controls" 
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
            if (filterShow.equals(layer_name, true) && $on.is(":checked")) {

                // Put the layer in if its checkbox is checked.
                
                // This will hold our filter function. Start with a no-op filter.
                var filter_function = function(value) {
                    return true;
                }

                // Define the functions and values to use for filtering
                var desired = filterValue.get(layer_name);
                
                if (is_continuous(layer_name)) {
                
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
        // entry. Assumes the layer has a shortlist UI entry.
        var range = filterValue.get(layer_name);
        if (_.isUndefined(range)) {
            return [layers[layer_name].minimum, layers[layer_name].maximum];
        } else {
            return range;
        }
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
