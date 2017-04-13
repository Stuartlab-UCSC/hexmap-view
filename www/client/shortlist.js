// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

var app = app || {};
(function (hex) { // jshint ignore: line
Shortlist = (function () { // jshint ignore: line

    var initialized = false;

    var range_extents = new ReactiveDict(); // to show the min & max values
    var zeroShow = new ReactiveDict(); // To show or hide the zero tick mark
    var template = {}; // A template for each layer
    var $shortlist; // The shortlist DOM element
    var $dynamic_controls; // The control DOM elements that come and go
    var $float_controls; // The floating control DOM elements
    var selection_prefix = 'Selection';
    var hover_layer_name = new ReactiveVar(''); // Track the current layer
 
    var icon = {
        primary: '/icons/primary.png',
        primary_hot: '/icons/primary-hot.png',
        secondary: '/icons/secondary.png',
        secondary_hot: '/icons/secondary-hot.png',
        filter: '/icons/filter.png',
        filter_hot: '/icons/filter-hot.png',
        close: '/icons/close.svg',
    };
 
    function get_range_extents (layer_name, i) {
        var vals = range_extents.get(layer_name.toString());
        if (vals && vals[i]) {
            return vals[i];
        } else {
            return i ? 'low' : 'high';
        }
    }
 
    function get_range_value (layer_name, i) {
        var vals = Util.session('filter_value', 'get', layer_name.toString());
        if (vals && vals[i]) {
            return vals[i];
        } else {
            return i ? 'low' : 'high';
        }
    }
 
    function is_layer_active (layer_name) {
        var active = Session.get('active_layers');
        return (active.length > 0 &&
                    active.indexOf(layer_name.toString()) > -1);
    }

    function is_primary (layer_name) {
        var actives = Session.get('active_layers');
        if (!layer_name) { return false; }
        return (actives.indexOf(layer_name.toString()) === 0);
    }

    function is_secondary (layer_name) {
        var actives = Session.get('active_layers');
        if (!layer_name) { return false; }
        return (actives.indexOf(layer_name.toString()) === 1);
    }

    function is_hovered (layer_name) {
        var hovered = hover_layer_name.get();
        if (!layer_name) { return false; }
        return (hovered === layer_name.toString());
    }

    function is_filter_showing (layer_name) {
        if (!layer_name) { return false; }
        show = Util.session('filter_show', 'get', layer_name.toString());
        if (_.isUndefined(show)) { return false; }
        return show;
    }
 
    function is_filter_active (layer_name) {
        return (is_filter_showing(layer_name) && is_layer_active(layer_name));
    }

    function get_root_from_child (child) {
        return $(child).parents('.shortlist_entry');
    }

    function get_layer_name_from_root (root) {
        return (root && root.length > 0) ? root.data('layer') : null;
    }

    function get_root_from_layer_name (layer_name) {
        return $('.shortlist_entry[data-layer="' + layer_name + '"]');
    }
 
    function get_layer_name_from_child (child) {
        var $child = $(child);
        if (!$child || $child.length > 0) {
            var root = get_root_from_child(child);
            if (root) {
                var layer_name = get_layer_name_from_root(root);
                if (layer_name) {
                    return layer_name;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    Template.shortlist.helpers({
        on_top: function () {
            return (Session.get('shortlist_on_top')) ? 'checked' : '';
        },
        primary_east: function () {
            return (is_secondary(hover_layer_name.get())) ? 'east' : '';
        },
        secondary_east: function () {
            return (is_secondary(hover_layer_name.get())) ? '' : 'east';
        },
        primary_icon: function () {
            return is_primary(hover_layer_name.get()) ?
                        icon.primary_hot : icon.primary;
        },
        secondary_icon: function () {
            return is_secondary(hover_layer_name.get()) ?
                        icon.secondary_hot : icon.secondary;
        },
        secondary_icon_display: function () {
            var layer_name =
                get_layer_name_from_child('#shortlist .is_primary');
            if (layer_name) {
                return (is_hovered(layer_name) &&
                    Session.get('active_layers').length < 2) ?
                    'none' : 'initial';
            } else {
                return 'none';
            }
        },
        is_primary_icon: function () {
            return icon.primary_hot;
        },
        is_secondary_icon: function () {
            return icon.secondary_hot;
        },
        remove_icon: function () {
            return icon.close;
        },
    });

    Template.shortlistEntryT.helpers({
        shortlist: function () {
            return Session.get('shortlist');
        },
        range_value_display: function () {
            return (Util.is_continuous(this)) ? 'initial' : 'none';
        },
        zero_display: function () {
            return (zeroShow.get(this)) ? 'initial' : 'none';
        },
        filter_icon: function () {
            return (is_filter_active(this) ? icon.filter_hot : icon.filter);
        },
        filter_icon_display: function () {
            return ((is_hovered(this) || is_filter_showing(this)) &&
                is_layer_active(this)) ?
                    'initial' : 'none';
        },
        filter_display: function () {
            return (is_filter_showing(this) && is_layer_active(this)) ?
                'initial' : 'none';
        },
        filter_value_display: function () {
            return (Util.is_continuous(this)) ? 'none' : 'initial';
        },
        filter_value: function () {
            return Util.session('filter_value', 'get', this);
        },
        range: function () {
            var vals = Util.session('filter_value', 'get', this);
            return (_.isUndefined(vals)) ? [0,0] : vals;
        },
        slider_display: function () {
            return (Util.is_continuous(this)) ? 'inline-block' : 'none';
        },
        low: function () {
            var val;
            if (is_filter_showing(this)) {
                val = get_range_value(this, 0);
            } else {
                val = get_range_extents(this, 0);
            }
            return Number(val).toExponential(1);
        },
        high: function () {
            var val;
            if (is_filter_showing(this)) {
                val = get_range_value(this, 1);
            } else {
                val = get_range_extents(this, 1);
            }
            return Number(val).toExponential(1);
        },
        save_filter_bottom: function () {
            var layer_name = this;
            return (Util.is_continuous(layer_name) ? '-0.25em' : '-0.35em');
        },
        save_filter_display: function () {
            return is_hovered(this) ? 'initial' : 'none';
        },
    });
/*
    // Unused. We may want this to set the bounds of the range slider if we 
    // want something other than the layer's min and max.
    function reset_slider(layer_name, shortlist_entry) {
        // Given a layer name and a shortlist UI entry jQuery element, reset the
        // slider in the entry to its default values, after downloading the 
        // layer. The default value may be invisible because we decided the 
        // layer should be a colormap.
            
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
            shortlist_entry.find(".range_slider")
                .slider("option", "min", minBound)
                .slider("option", "max",  maxBound)
                .slider("values", [minBound, maxBound]);
                
            // Initialize the values stored
            refreshColors();
        });
    }
*/

    function copy_shortlist_state () {
        // TODO: I think a 'get' makes a copy anyway
        return Session.get('shortlist').slice();
    }

    function copy_actives_state () {
        return Session.get('active_layers').slice();
    }

    function add_layer_data (layer_name, data, attributes) {
        // Add a layer with the given name, with the given data to the list of 
        // available layers.
        // Used for selections... more broadly can be used for dynamic layers.
        // Attributes is an object of attributes to copy into the layer.
        // May also be used to replace layers.
        // This holds a boolean for if we're replacing an existing layer.
        // Note: layers is a global, for layers on the presented map

        var replacing = (layers[layer_name] !== undefined);
        
        // Store the layer. Just put in the data. with_layer knows what to do if
        // the magnitude isn't filled in.
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
            // TODO: Don't think this code ever gets hit.
            Util.removeFromDataTypeList(layer_name);
            Session.set('sort', ctx.defaultSort());
        } else {
        
            // Add it to the sorted layer list, since it's not there yet.
            var sorted = Session.get('sortedLayers').slice();
            sorted.push(layer_name);
            Session.set('sortedLayers', sorted);
        }

        // Add this layer to the appropriate data type list
        Util.addToDataTypeList(layer_name, data);

        // Don't sort because caller does that when they're done adding layers.
    }

    function create_filter_select_options (layer_name, layer, filter_value) {

        // Create the value filter dropdown for discrete values,
        // If we have not yet created it.
        // Note that binary values without entries in the input colormap file
        // DO have a colormap entry in the code.
 
        // If the select list is already filled in there is nothing to do
        if (filter_value.children().length > 0) { return; }
        
        // Set the filter show flag if it wasn't pulled from state
        if (_.isUndefined(Util.session('filter_show', 'get', layer_name))) {
            Util.session('filter_show', 'set', layer_name, false);
        }

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

                // Binary without colors assigned by input file
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

        // Select the appropriate option on first opening
        var value = Util.session('filter_value', 'get', layer_name);
        if (_.isNull(value)) {
 
            // There is no value saved, so leave menu set to the first option,
            // and initialized the saved value to the first one.
            Util.session('filter_value', 'set', layer_name, parseInt(first));
 
        } else {
 
            // There is a value saved, so set the menu to that option.
            filter_value.val(value);
        }
 
        // Update colors to reflect the filter created by the initial selection
        refreshColors();

        // Define the event handler for selecting an item
        filter_value.on('change', function (ev) {
            Util.session(
                'filter_value', 'set', layer_name, parseInt(ev.target.value));
            
            // Update the colors to reflect the filter updated by this select
            refreshColors();
        });
    }
 
    function create_range_slider (layer_name, root) {
 
         // Create a filter range slider for continuous variables.
 
        // If the range slider has already been created, there is nothing to do.
        if (root.find('.ui-slider-range').length > 0) { return; }

        var layer = layers[layer_name],
            min = layer.minimum,
            max = layer.maximum,
            span = max - min; // The span of the values
 
        // Handle a slider handle moving
        var update_display = function(event, ui) {
            var low = ui.values[0],
                high = ui.values[1];
            Util.session('filter_value', 'set', layer_name, [low, high]);
 
            // Set the width of the low and high masks
            var x_span = $(event.target).width(), // The span in pixels
                x_low_width = Math.abs(low - min) / span * x_span,
                x_high_width = Math.abs(max - high) / span * x_span;
 
            root.find('.low_mask').width(x_low_width);
            root.find('.high_mask').width(x_high_width);
 
        };
 
        // Handler to apply the filter after the user has finished sliding
        var update_filter = function (event, ui) {
            Util.session('filter_value', 'set', layer_name,
                [ui.values[0], ui.values[1]]);
            refreshColors();
        };
 
        // Create the slider
        var vals = Util.session('filter_value', 'get', layer_name);
        var slider = root.find('.range_slider');
        slider.slider({
            range: true,
            min: min,
            max: max,
            values: vals,
            height: 10,
            step: 1E-9, // Ought to be fine enough
            slide: update_display,
            change: update_display,
            stop: update_filter,
        });
 
        // Update the masks and slider with the saved values
        update_display({target: slider[0]}, {values: vals});
    }

    function create_shortlist_entry_with_data (layer_name, root) {
 
        // Add all of the metadata
        fill_layer_metadata(root.find('.metadata_holder'), layer_name);
 
        if (Util.is_continuous(layer_name)) {

            // Create the chart
            newGchart(layer_name, root.find('.chart'), 'histogram');
 
            var min = layers[layer_name].minimum,
                max = layers[layer_name].maximum;
 
            if (_.isUndefined(
                Util.session('filter_value', 'get', layer_name))) {
            
                // Range filter values are not yet saved,
                // so initialize them to the layer extents.
                Util.session('filter_value', 'set', layer_name, [min, max]);
            }
 
            // Set the extents of the range
            range_extents.set(layer_name, [min, max]);
 
            // Put a tick on zero if zero is in the range.
            // Dom object needs to be drawn already so we can see the offset.
            if (0 > min && 0 < max) {
                zeroShow.set(layer_name, true);
 
                // Wait for the DOM to update so ...
                Meteor.setTimeout(function () {
                    var root = get_root_from_layer_name(layer_name),
                        chart = root.find('.chart'),
                        x_span = chart.width(),
                        x_low_width = -min / (max - min) * x_span;
                    root.find('.zero_tick').css('left', x_low_width);
                    root.find('.zero').css('left', x_low_width -9);
                }, 500);
            } else {
                zeroShow.set(layer_name, false);
            }

        } else {
            if (_.isUndefined(
                Util.session('filter_value', 'get', layer_name))) {
            
                // Filter value is not yet saved,
                // so initialize it to the first option.
                var val = 0;
                if (Util.is_binary(layer_name)) {
                    val = 1;
                }
                    
                Util.session('filter_value', 'set', layer_name, val);
            }
            
            // Build the barChart after the filter values are sure to be defined
            setTimeout(function () {
                newGchart(layer_name, root.find('.chart'), 'barChart');
            }, 10);

        }
    }
 
    function make_layer_name_unique (layer_name) {
 
        // We're done if the name is unique
        if (layers[layer_name] === undefined) { return layer_name; }

        var last_suffix,
            name = layer_name,
            seq = 1;
 
        // Special case a default selection layer name
        if (name.startsWith(selection_prefix)) {
            name = selection_prefix;
        }
 
        // Keep looking for a name until it is unique
        while (true) {
 
            // We're done if the name is unique
            if (layers[name] === undefined) { break; }

            // Find any previously tried sequence suffix
            if (seq > 1) {
                last_suffix = ' ' + (seq - 1);
                if (name.endsWith(last_suffix)) {
 
                    // Remove the existing sequence suffix
                    name = name.slice(0, name.length - last_suffix.length);
                }
            }
            name += ' ' + seq;
            seq += 1;
        }
        return name;
    }
 
    function ask_user_to_name_layer(layer_name, dup_name) {
 
        // Give the user a chance to name the layer
        var promptString = (dup_name) ?
                            dup_name + ' is in use, how about this one?'
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
            name = selection_prefix;
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
            if (name === undefined) { break; }
 
            // We're done if the name is unique
            unique_name = make_layer_name_unique(name);
            if (unique_name === name) { break; }

            // Suggest another unique name
            dup_name = name;
            name = unique_name;
        }
        return name;
    }
 
    function get_active_layers () {
        // Returns an array of the string names of the layers that are currently
        // displaying their colors.
        return Session.get('active_layers');
    }

    function create_dynamic_binary_layer (nodeIds, new_layer_name) {
 
        // Given an array of node IDs, add a new binary layer containing ones
        // for those nodes and zeroes for the rest. So every node will have a
        // value in this new layer.
        //
        // new_layer_name is an optional parameter. If no name is passed,
        // "selection + #" will be suggested as the layer name.

        if (nodeIds.length < 1) {
            Util.banner('warn', "No hexagons were selected.");
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
                
                // TODO someday simplify selection, selected & positives
                positives: positives.length,
                
                // And how many have a value, which is all in this case
                n: _.keys(data).length
            });
            
            // Update the browse UI with the new layer.
            update_shortlist(name);
        }
 
        return (name);
    }

    function filter_control_changed (ev, layer_name_in) {

        // Functionality for turning filtering on and off
        var root,
            layer_name;
 
        if (layer_name_in) {
 
            // We are initializing from saved state
            layer_name = layer_name_in;
            root = get_root_from_layer_name(layer_name);
            if (!root) {
 
                // If the layer's DOM element does not exist yet,
                // there is nothing to do.
                console.log(
                    'cannot find the root DOM element of layer:', layer_name);
                return;
            }
 
        } else if (ev) {
 
            // We are responding to a filter button press
            root = get_root_from_child ($(ev.target));
            layer_name = get_layer_name_from_root(root);
            Util.session('filter_show', 'set', layer_name,
                        !is_filter_showing(layer_name));
        } else {
            console.log('Error: for some reason there is a blank layer_name_in',
                'and no event in filter_control_changed().')
        }
 
        // If the filter is showing...
        if (is_filter_showing(layer_name)) {
 
            // Figure out what kind of filter settings we take based on
            // what kind of layer we are.
            with_layer (layer_name, function (layer) {
            
                if (Util.is_continuous(layer_name)) {
                
                    // Add a range slider
                    create_range_slider(layer_name, root);
                } else {

                    // Add a value picker
                    create_filter_select_options(layer_name, layer,
                        root.find('.filter_contents').find('.filter_value'));
                }

                root.find('.save_filter').click(function() {

                    // Clicking on the save button creates a dynamic layer
                    var value = Util.session('filter_value', 'get', layer_name),
                        layer = layers[layer_name],
                        nodeIds = [];
                    
                    if (Util.is_continuous(layer_name)) {

                        // Get the range values
                        nodeIds = _.filter(_.keys(polygons), function (nodeId) {
                            return (layer.data[nodeId] >= value[0] &&
                                    layer.data[nodeId] <= value[1]);
                        });
                        value = value[0].toExponential(1).toString() +
                            ' to ' + value[1].toExponential(1).toString();

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
            });
        }

        // Update the colors with the new filtering or lack thereof
        refreshColors();
    }

    function create_shortlist_entry (layer_name) {
 
        // Makes a shortlist DOM entry for one layer.

        // Skip this if this layer does not yet exist
        if (!layers[layer_name]) { return; }
 
        // Initialize some vars used in the template

        // Load the shortlist entry template, passing the layer name
        template[layer_name] = Blaze.renderWithData(
            Template.shortlistEntryT, {layer: [layer_name]}, $shortlist[0]);

        // This is the root element of this shortlist UI entry
        var root = get_root_from_layer_name(layer_name);

        // Is this is a selection ?
        if (layers[layer_name].selection) {
            root.addClass("selection");
            create_shortlist_entry_with_data(layer_name, root);
        } else {
            with_layer(layer_name, function () {
                create_shortlist_entry_with_data (layer_name, root);
            });
        }
 
        // Create the filter button click handler
        root.find('.filter').click(filter_control_changed);
 
        // On mouse entering the shortlist entry, show the floating controls
        // and the filter button
        root.on('mouseenter', function () {
            root.prepend($float_controls);
            hover_layer_name.set(layer_name);
        });
 
        // On mouse leaving the shortlist entry, hide the floating controls
        // and the filter button if the filter is not active
        root.on('mouseleave', function () {
            hover_layer_name.set('');
            $('#shortlist .dynamic_controls').append($float_controls);
        });
 
        return root;
    }

    function update_shortlist (layer_name, remove) { // jshint ignore: line
 
        // This updates the shortlist variable and UI for adds & removes.
        // Moves via the jqueryUI sortable are handled in the sortable's update
        // function.
        var shortlist = copy_shortlist_state(),
            active = copy_actives_state(),
            root = get_root_from_layer_name(layer_name),
            index;
 
        if (remove) {
            if(shortlist.indexOf(layer_name)< 0) { return; }

            shortlist.splice(shortlist.indexOf(layer_name), 1);
            root.remove();

            // Remove this layer from active_layers if it was in there
            index = active.indexOf(layer_name);
            if (index > -1) {

                // Update the active layers by removing this layer
                active.splice(index, 1); // Remove this from the active

                // Update our state variable
                Session.set('active_layers', active);
            }

        } else { // Handle this layer add
 
            index = shortlist.indexOf(layer_name);
            if (index > -1) {
 
                // The layer is already in the shortlist, so remove it from
                // its current position in the shortlist state variable
                shortlist.splice(index, 1);
 
                // Move the entry  to the top from it's current position
                $shortlist.prepend(root);
 
            } else {
 
                // The layer is not yet in the shortlist
                $shortlist.prepend(create_shortlist_entry(layer_name));
            }

            // Add the layer to the top of the shortlist start variable
            shortlist.splice(0, 0, layer_name);
 
            // If there is a secondary active or this layer is not already the
            // primary active...
            if (active.length > 1 || active[0] !== layer_name) {
 
                // Replace the primary active with this new entry,
                // dropping any secondary
                Session.set('active_layers', [layer_name]);
            }
        }
        Session.set('shortlist', shortlist);
 
    }

    function update_shortlist_metadata () {
 
        // Update the metadata for each layer in the shortlist
        // TODO: make the metadata updates reactive
        _.each(Session.get('shortlist'), function(layer_name) {
            var root = get_root_from_layer_name(layer_name);
                fill_layer_metadata(root.find(".metadata_holder"), layer_name);
        });
    }

    function make_sortable () {
         $shortlist.sortable({
            update: function () {
            
                // Update the shortlist UI with the new order and refresh
                var shortlist = _.map($shortlist.children(), function (el) {
                    return $(el).data("layer");
                });
                
                // Remove the null entry created by the dynamic controls widget
                var i = shortlist.indexOf(undefined);
                shortlist.splice(i, 1)
                Session.set('shortlist', shortlist);
            },
            // Use the controls area as the handle to move entries.
            // This allows the user to select any text in the entry
            handle: ".controls"
        });
    }

    function when_active_layers_change () {
 
        // When the active layers change update the primary and secondary
        // indicators on the UI and refresh the map colors.
        var active = Session.get('active_layers'),
            length = active.length,
            $anchor;
 
        // For each of primary index and secondary index...
        _.each([0, 1], function (index) {
        
            if (length > index) {
     
                // There is an active so attach the icon to the layer's
                // shortlist entry.
                $anchor = get_root_from_layer_name(active[index]);
     
            } else {
     
                // There is no active, so hide the icon.
                $anchor = $dynamic_controls;
            }
            if ($anchor && $shortlist) {
                $anchor.prepend($shortlist.find(
                    index === 0 ? '.is_primary' : '.is_secondary'));
            }
        });
 
        // Finally, refresh the map colors
        refreshColors();
    }

    function create_float_controls () {

        // This is the floating button control panel that appears when
        // a shortlist entry is hovered upon.
 
 
        // Handle the click of the primary button
        $shortlist.on ('click', '.primary', function (ev) {
            var layer_name = get_layer_name_from_child(ev.target),
                active = copy_actives_state();
                
                
            // If top flag is set,
            // move the layer from the current position to the first
            //move_entry(layer_name, 1);
            
             // If this layer is already primary, remove it as primary.
             // This has a side effect of setting any secondary to primary,
             // or leaving no active layers.
            if (is_primary(layer_name)) {
                active.splice(0, 1);

            // If this layer is secondary,
            // set it as the primary and only active layer.
            } else if (is_secondary(layer_name)) {
                active = [layer_name];
                
            // This layer is not currently active, so make it primary
            // preserving any secondary.
            } else {
                active.splice(0, 1, layer_name);
            }
            Session.set('active_layers', active);
        });
 
        // Handle the click of the secondary button
        $shortlist.find('.secondary').on('click', function (ev) {
            var active = copy_actives_state(),
                layer_name = get_layer_name_from_child(ev.target);
                
            // If this layer is already secondary, remove it from secondary
            if (is_secondary(layer_name)) {
                active = active.slice(0, 1);
                
            // If this layer is primary...
            } else if (is_primary(layer_name)) {
                
                // If there is no secondary, do nothing.
                // We shouldn't get here because if this is primary and there
                // is no secondary, then the floating secondry is not displayed.
                if (active.length < 2) { return; }
                
                // There is a secondary,
                // so make this secondary, and that one primary
                active = [active[1], active[0]];
                
                // If top flag is set, move this to the 2nd position
                //move_entry(layer_name, 2);
                
            // If there is a primary, but not this layer,
            // replace/add this layer as secondary
            } else if (active.length > 0) {
                active = [active[0], layer_name];
                
                // If top flag is set, move this to the 2nd position
                //move_entry(layer_name, 2);
                                
            // There is no primary.
            // so make this primary instead of the requested secondary
            } else {
                active = [layer_name];
                
                // If top flag is set, move this to the 1st position
                //move_entry(layer_name, 1);
            }
            
            // Update the active layers state and refresh the colors
            Session.set('active_layers', active);
        });
 
        // Handle the removal from the short list
        $shortlist.find('.remove').on('click', function(ev) {
            var layer_name = get_layer_name_from_child(ev.target);
 
            // If this layer has a delete function, do that
            if (layers[layer_name].removeFx) {
                layers[layer_name].removeFx(layer_name);
            }

            // Handle dynamic layers
            if (layers[layer_name].selection) {
                delete layers[layer_name];
                Util.removeFromDataTypeList(layer_name);
            }
            
            // Move all of the dynamic controls to a holding place so they
            // don't get removed from the DOM
            $dynamic_controls
                .append($float_controls)
                .append($shortlist.find('.is_primary'))
                .append($shortlist.find('.is_secondary'));
            
            // Clear any google chart associated with this layer
            clear_google_chart(layer_name);
            
            // Clear any filter values and show state for this layer
            delete Session.keys['shortlist_filter_show_' + layer_name];
            delete Session.keys['shortlist_filter_value_' + layer_name];
            
            // Update the shortlist state variable and UI.
            update_shortlist(layer_name, true);
            
            // Remove this layer's shortlist entry template
            delete template[layer_name];
        });
    }
 
    function complete_initialization (comp) {
    
        // Autorun to execute when the first layer is set
        // and after the initial sort
        var first = Session.get('first_layer'),
            sorted_layers = Session.get('sortedLayers');

        if (sorted_layers.length < 1) { return; }
        if (_.isUndefined(first)) { return; }
        
        // We only need to run this once to initialize the shortlist UI
        comp.stop();
         
        // Set up the flag to always put the active layers at the top of list
        Session.set('shortlist_on_top', '');
        $('.shortlist .on_top').on('click', function () {
            Session.set('shortlist_on_top', '$(ev.target.checked)');
        });
        
        var shortlist = copy_shortlist_state();

        // Add any dynamic attrs stored in state to the shortlist
        var dynamic_attrs = Session.get('dynamic_attrs');
        if (dynamic_attrs) {
            _.each(dynamic_attrs, function(attr, name) {
                
                // The attr should already be in the shortlist names,
                // however if it is not, don't add it's data
                if (shortlist.indexOf(name) < 0) { return; }
                
                var data = attr.data,
                    properties = attr;
                   
                // Remove the data from the attr properties.
                delete properties.data;
                   
                add_layer_data(name, data, properties);
                if (properties.colormap) {
                    colormaps[name] = properties.colormap;
                }
            });
        }

        // Add the 'first layer' to the shortlist if it is empty
        if (shortlist.length < 1) {
            shortlist = [first];
            Session.set('shortlist', shortlist);
        }

        // Add each layer in the shortlist to the UI
        _.each(shortlist, function (layer_name) {
            var root = create_shortlist_entry(layer_name);
            $shortlist.append(root);
            
            // Update filters
            filter_control_changed(null, layer_name);
        });
        
        // Set the shortlist metadata resulting from the initial sort
        update_shortlist_metadata();
        
        // Make the shortlist entries re-orderable
        make_sortable();

        // If there are no active layers, make the first entry active
        var active = Session.get('active_layers');
        if (active.length < 1 && shortlist.length > 0) {
            Session.set('active_layers', [shortlist[0]]);
        }
    }

return {
    create_dynamic_binary_layer: create_dynamic_binary_layer,
    get_active_layers: get_active_layers,
    update_shortlist: update_shortlist,
    update_shortlist_metadata: update_shortlist_metadata,

    get_entries: function () {
    
        // Return the entries in the shortlist.
        // Until we have the attributes in the database,
        // pull the info out of the layers array.
        var attrs = Session.get('shortlist'),
            entries = {};
            
        if (attrs.length === 0) { return undefined; }
        
        _.each(attrs, function (attr) {
            
            var layer = layers[attr],
                e = { data: layer.data };
            if (layer.selection) {
                e.dynamic = true;
            }
            if (Util.is_binary(attr)) {
                e.datatype = 'binary';
            } else {
                e.min = layer.minimum;
                e.max = layer.maximum;
                if (Util.is_continuous(attr)) {
                    e.datatype = 'continuous';
                } else {
                    e.datatype = 'categorical';
                }
            }
            entries[attr] = e;
        });

        return entries;
    },

    create_dynamic_category_layer: function (layer_name, data, attributes,
        colormap) {
 
        // @param: layer_name: layer name for the global layers object
        // @param: data: data for the global layers
        // @param: attributes: attributes for the global layers. At least these
        //                     should be included for now:
        //                         selection
        //                         n
        //                         magnitude
        // @param: colormap: the colormap for this layer, required for now
 
        attributes.minimum = 0;
        add_layer_data(layer_name, data, attributes);
        update_shortlist(layer_name);
        colormaps[layer_name] = colormap;
    },
 
    with_filtered_signatures: function (filters, callback) {
        // Takes an array of filters, as produced by get_current_filters.
        // Computes an array of all signatures passing all filters, and passes
        // that to the given callback.
        
        // TODO: Re-organize this to do filters one at a time, recursively, like
        // a reasonable second-order filter.
        
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
                        
                        // If the signature fails the filter function for the
                        // layer, skip the signature.
                        pass = false;

                        break;
                    }
                }
                if(pass) {

                    // Record that the signature passes all filters
                    passing_signatures.push(signature);
                }
            }
            
            // Now we have our list of all passing signatures, so hand it off to
            // the callback.
            callback(passing_signatures);
        });
    },

    get_current_filters: function () {

        // Returns an array of filter objects, according to the shortlist UI.
        // Filter objects have a layer name and a boolean-valued filter function
        // that returns true or false, given a value from that layer.
        var current_filters = [];
        
        _.each(Session.get('shortlist'), function (layer_name) {

            // Go through all the shortlist entries.
            // This function is also the scope used for filtering function
            // config variables.

            // if the filter is showing and the layer is active, apply a filter
            if (is_filter_active(layer_name)) {

                // This will hold our filter function. Start with no-op filter.
                var filter_function = function(value) {  // jshint ignore: line
                    return true;
                };

                // Define the functions and values to use for filtering
                var desired = Util.session('filter_value', 'get', layer_name);
                
                if (Util.is_continuous(layer_name)) {
                
                     // Use a range for continuous values.
                    filter_function = function(value) {
                         return (value >= desired[0] && value <= desired[1]);
                    };
                } else {

                    // Use a discrete value match.
                    filter_function = function(value) {
                        return (value === desired);
                    };
                }

                // Add a filter on this layer, with the function we've prepared.
                current_filters.push({
                    layer_name: layer_name,
                    filter_function: filter_function,
                });
            }
        });
        
        return current_filters;
    },

    get_slider_range: function (layer_name) {
        // Given the name of a layer, get the slider range from its shortlist UI
        // entry. Assumes the layer has a shortlist UI entry.
        var range = Util.session('filter_value', 'get', layer_name);
        if (_.isUndefined(range)) {
            return [layers[layer_name].minimum, layers[layer_name].maximum];
        } else {
            return range;
        }
    },
    
    get_dynamic_entries_for_persistent_state: function () {
    
        // Return the dynamic entries in the short list, while converting the
        // color objects in the colormaps to saveable objects.
        var entries = {};

        _.each(Shortlist.get_entries(), function (value, attr) {
        
            if (value.dynamic || value.selection) {
                entries[attr] = value;
            }
            
            // Convert the colormap colors from an object to an array.
            if (colormaps[attr]) {
                var obj = Colors.colormapToColorArray(colormaps[attr], attr);
                value.colormap = obj.cats;
            }
        });

        if (_.keys(entries).length > 0) {
            return entries;
        } else {
            return undefined;
        }
    },

    init: function () {
        if (initialized) { return; }
 
        initialized = true;
 
        // Initialize some handy variables
        $shortlist = $('#shortlist');
        $dynamic_controls = $shortlist.find('.dynamic_controls');
        $float_controls = $shortlist.find('.float');

        // Autorun to finish initializiation when the first layer is set
        // and after the initial sort
        Meteor.autorun(complete_initialization);
 
        // Run this whenever the active list changes to update the hot primary
        // and secondary icons and change the map colors.
        Meteor.autorun(when_active_layers_change);
 
        // Create the controls that move from entry to entry
        create_float_controls();
     },
};
}());
})(app);
