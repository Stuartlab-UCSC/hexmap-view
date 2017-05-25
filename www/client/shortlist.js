// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

var app = app || {};
(function (hex) { // jshint ignore: line
Shortlist = (function () { // jshint ignore: line

    var initialization_started = false;

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
        } else { // No colormap categorical. This shouldn't happen.
            console.log('error: no colormap for categorical attr:', layer_name);
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
            // and initialize the saved value to the first one.
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

    function create_shortlist_ui_entry_with_data (layer_name, root) {
 
        // Add all of the metadata
        Layer.fill_metadata(root.find('.metadata_holder'), layer_name);
 
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
 
    function get_active_coloring_layers () {
        // Returns an array of the string names of the layers that are
        // actively displaying their colors.
        return Session.get('active_layers');
    }

    function filter_control_changed (ev, layer_name_in, initializing) {

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
                    'error: cannot find the root DOM element of layer:', layer_name);
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
            Layer.with_layer (layer_name, function (layer) {
            
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
                    Layer.create_dynamic_selection(nodeIds, name);
                });
            });
        }

        // Update the colors with the new filtering or lack thereof
        if (!initializing) { refreshColors(); }
    }

    function create_shortlist_ui_entry (layer_name) {
 
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
        if (layers[layer_name].dynamic) {
            root.addClass("dynamic");
            create_shortlist_ui_entry_with_data(layer_name, root);
        } else {
            Layer.with_layer(layer_name, function () {
                create_shortlist_ui_entry_with_data (layer_name, root);
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
    
    function ui_and_list_add (layer_name) {
        // This updates the shortlist variable and UI for add to shortlist.
        // Moves via the jqueryUI sortable are handled in the sortable's update
        // function.
        if (!Session.equals('shortlistInitDone', true)) {
            
            // We'll add the shortlist UI entries as part of initialization
            // and not here.
            return;
        }
 
        var shortlist = Session.get('shortlist'),
            active = Session.get('active_layers'),
            root = get_root_from_layer_name(layer_name),
            index = shortlist.indexOf(layer_name);
        
        if (index > -1) {

            // The layer is already in the shortlist, so remove it from
            // its current position in the shortlist state variable
            shortlist.splice(index, 1);

            // Move the entry  to the top from it's current position
            $shortlist.prepend(root);

        } else {

            // The layer is not yet in the shortlist
            $shortlist.prepend(create_shortlist_ui_entry(layer_name));
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
        Session.set('shortlist', shortlist);
    }
 
    function ui_and_list_delete (layer_name) {

        // This updates the shortlist variable and UI for remove from shortlist.
        // Moves via the jqueryUI sortable are handled in the sortable's update
        // function.
        var shortlist = Session.get('shortlist'),
            active = Session.get('active_layers'),
            root = get_root_from_layer_name(layer_name),
            index;
 
        if (shortlist.indexOf(layer_name)< 0) { return; }

        // Remove from the shortlist list
        shortlist.splice(shortlist.indexOf(layer_name), 1);
        Session.set('shortlist', shortlist);
        
        // Remove from the shortlist UI.
        root.remove();

        // Remove this layer from active_layers if it was in there
        index = active.indexOf(layer_name);
        if (index > -1) {
            active.splice(index, 1); // Remove this from the active
            Session.set('active_layers', active);
        }
    }

    function update_ui_metadata () {
 
        // Update the metadata for each layer in the shortlist
        // TODO: make the metadata updates reactive
        _.each(Session.get('shortlist'), function(layer_name) {
            var root = get_root_from_layer_name(layer_name);
                Layer.fill_metadata(root.find(".metadata_holder"), layer_name);
        });
    }

    function make_sortable_ui_and_list () {
    
        // This updates the shortlist UI and list when the user moves an entry.
         $shortlist.sortable({
            update: function () {
            
                // Find shortlist entries, ingnoring the dynamic controls.
                var entries = _.filter($shortlist.children(), function (entry) {
                    return (!_.isUndefined($(el).data("layer")));
                });
            
                // Update the shortlist UI with the new order and refresh
                var shortlist = _.map(entries, function (el) {
                    return $(el).data("layer");
                });
                Session.set('shortlist', shortlist);
            },
            // Use the controls area as the handle to move entries.
            // This allows the user to select any text in the entry
            handle: ".controls"
        });
    }

    function when_active_color_layers_change () {
 
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
                active = Session.get('active_layers');
                
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
            var active = Session.get('active_layers'),
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
            if (layers[layer_name].dynamic) {
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
            ui_and_list_delete(layer_name);
            
            // Remove this layer's shortlist entry template
            delete template[layer_name];
        });
    }

    function entries_initialized (layers_added) {
    
        // The ui entries are now loaded.
        var shortlist = Session.get('shortlist');
        
        // If there are no active layers, make the first entry active
        var active = Session.get('active_layers');
        if (active.length < 1 && shortlist.length > 0) {
            Session.set('active_layers', [shortlist[0]]);
        }
        
        // Initialize filters
        _.each(shortlist, function (layer_name) {
            filter_control_changed(null, layer_name, true);
        });
        
        // Set the shortlist metadata resulting from the initial sort
        update_ui_metadata();
        
        // Make the shortlist entries re-orderable
        make_sortable_ui_and_list();

        // Add entries to the UI in the shortlist list order.
        var ordered = Session.get('shortlist').reverse();
        
        _.each(ordered, function (layer_name) {
        
            $shortlist.prepend(create_shortlist_ui_entry(layer_name));
        });

        Session.set('shortlistInitDone', true);
    }

    function complete_initialization (autorun) {

        // Autorun to execute when the first layer is set
        // and after the initial sort and the dom is loaded.
        var first_layer = Session.get('first_layer'),
            sortedLayers = Session.get('sortedLayers'),
            domLoaded = Session.get('domLoaded');
        
        if (sortedLayers.length < 1 || _.isUndefined(first_layer) ||
            _.isUndefined(domLoaded)) {
            // We can't add to the shortlist until these are so.
            return;
        }
        
        /* unused
        // Set up the flag to always put the active layers at the top of list
        Session.set('shortlist_on_top', '');
        $('.shortlist .on_top').on('click', function () {
            Session.set('shortlist_on_top', '$(ev.target.checked)');
        });
        */
        
        autorun.stop();
        var shortlist = Session.get('shortlist');

        // Add the 'first layer' to the shortlist if it is empty
        if (shortlist.length < 1) {
            shortlist = [first_layer];
            Session.set('shortlist', shortlist);
        }
        // Add the layers to the global layers object.
        Layer.with_layers(
            shortlist, entries_initialized, Session.get('dynamic_attrs'));
    }

return {
    get_active_coloring_layers: get_active_coloring_layers,
    ui_and_list_add: ui_and_list_add,
    ui_and_list_delete: ui_and_list_delete,
    update_ui_metadata: update_ui_metadata,

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
        
        Layer.with_layers(layer_names, function(filter_layers) {
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

        _.each(layers, function (layer, name) {
            if (layer.dynamic) {
               
                // Remove magnitude since its absence indicates that this layer
                // is to be added to the UI shortlist on load.
                delete layer.magnitude;

                // Convert the colormap colors from an object to an array.
                if (colormaps[name]) {
                    var obj = Colors.colormapToColorArray(
                        colormaps[name], name);
                    layer.colormap = obj.cats;
                }
                entries[name] = layer;
            }
        });

        if (_.keys(entries).length > 0) {
            return entries;
        } else {
            return undefined;
        }
    },

    init: function () {
    
        if (initialization_started) { return; }
        
        initialization_started = true;
 
        // Initialize some handy variables
        $shortlist = $('#shortlist');
        $dynamic_controls = $shortlist.find('.dynamic_controls');
        $float_controls = $shortlist.find('.float');
        
        Session.set('shortlistInitDone', false);
        
        Meteor.autorun(complete_initialization);
 
        // Create the controls that move from entry to entry
        create_float_controls();
        
        // Run this whenever the active list changes to update the hot primary
        // and secondary icons and change the map colors.
        Meteor.autorun(when_active_color_layers_change);
     },
};
}());
})(app);
