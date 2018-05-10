// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

import '/imports/lib/jquery-ui';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'

import Colormap from '/imports/mapPage/color/Colormap';
import colorMix from '/imports/mapPage/color/colorMix';
import gChart from '/imports/mapPage/shortlist/gChart';
import Layer from '/imports/mapPage/longlist/Layer';
import rx from '/imports/common/rx';
import util from '/imports/common/util';

import ShortEntryMenuCont from '/imports/mapPage/shortlist/ShortEntryMenuCont';

import './shortlist.html';
import './shortlist.css';
import './shortEntry.css';

var initialization_started = false;
var prevActiveAttrs;
var range_extents = new ReactiveDict(); // to show the min & max values
var zeroShow = new ReactiveDict(); // To show or hide the zero tick mark
var filterBuilt = new ReactiveDict(); // Is filter built?
var slider_vals = new ReactiveDict(); // low and high values as sliding
var template = {}; // A template for each layer
var $shortlist; // The shortlist DOM element
var $dynamic_controls; // The control DOM elements that come and go
var $float_controls; // The floating control DOM elements
var selection_prefix = 'Selection';
var hover_layer_name = new ReactiveVar(''); // Track the current layer
var entriesInited = new ReactiveVar();
var icon = {
    primary: '/icons/primary.png',
    primary_hot: '/icons/primary-hot.png',
    secondary: '/icons/secondary.png',
    secondary_hot: '/icons/secondary-hot.png',
    filter: '/icons/filter.png',
    filter_hot: '/icons/filter-hot.png',
    close: '/icons/close.svg',
};

function get_range_display_values (layer_name, i, showing) {
    var vals;
    if (showing) {
    
        // The values as the slider is sliding.
        vals = slider_vals.get(layer_name);
    } else {
    
        // The min or max of all the layer's values.
        vals = range_extents.get(layer_name);
    }
    if (vals && !_.isUndefined(vals[i])) {
        return vals[i];
    } else {
        return i < 1 ? 'low' : 'high';
    }
}

function is_layer_active (layer_name) {
    var active = Session.get('active_layers');
    if (_.isUndefined(active)) {
        return false;
    }
    return (active.length > 0 &&
                active.indexOf(layer_name) > -1);
}

function is_primary (layer_name) {
    var actives = Session.get('active_layers');
    if (!layer_name) { return false; }
    return (actives.indexOf(layer_name) === 0);
}

function is_secondary (layer_name) {
    var actives = Session.get('active_layers');
    if (!layer_name) { return false; }
    return (actives.indexOf(layer_name) === 1);
}

function is_hovered (layer_name) {
    var hovered = hover_layer_name.get();
    if (!layer_name) { return false; }
    return (hovered === layer_name);
}

function is_filter_showing (layer_name) {
    if (!layer_name) { return false; }
    var show = util.session('filter_show', 'get', layer_name);
    
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

export function get_layer_name_from_child (child) {
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
        return (util.is_continuous(this.toString())) ? 'initial' : 'none';
    },
    zero_display: function () {
        return (zeroShow.get(this.toString())) ? 'initial' : 'none';
    },
    filter_icon: function () {
        return (is_filter_active(this.toString()) ? icon.filter_hot : icon.filter);
    },
    filter_icon_display: function () {
        var layer_name = this.toString();
        return ((is_hovered(layer_name) || is_filter_showing(layer_name)) &&
            is_layer_active(layer_name)) ?
                'initial' : 'none';
    },
    filter_display: function () {
        return (is_filter_active(this.toString()) ? 'block' : 'none');
    },
    filter_value_display: function () {
        return (util.is_continuous(this.toString())) ? 'none' : 'initial';
    },
    filter_value: function () {
        return util.session('filter_value', 'get', this.toString());
    },
    range: function () {
        var vals = util.session('filter_value', 'get', this.toString());
        return (_.isUndefined(vals)) ? [0,0] : vals;
    },
    slider_display: function () {
        var show = util.is_continuous(this.toString());
        return (show ? 'inline-block' : 'none');
    },
    low: function () {
        var layer_name = this.toString(),
            val = get_range_display_values(
                layer_name, 0, is_filter_showing(this));
        if (typeof val === 'number') {
            val = Number(val).toExponential(1);
        }
        return val;
    },
    high: function () {
        var layer_name = this.toString(),
            val = get_range_display_values(
                layer_name, 1, is_filter_showing(this));
        if (typeof val === 'number') {
            val = Number(val).toExponential(1);
        }
        return val;
    },
    save_filter_bottom: function () {
        var layer_name = this;
        return (util.is_continuous(layer_name) ? '-0.25em' : '-0.35em');
    },
    save_filter_display: function () {
        return is_hovered(this.toString()) ? 'initial' : 'none';
    },
});

function updateAttrsActiveForTemplate () {

    // activeAttrs state is tracked with a redux var, but templates need
    // a meteor reactive variable to update. So whenever the redux state
    // changes, update the meteor reactive variable.
    let aState = rx.get('activeAttrs'),
        aTemplate = Session.get('active_layers');
    if (aState.length === aTemplate.length &&
        aState.every((v,i) => v === aTemplate[i])) {
    } else {
        Session.set('active_layers', aState);
    }
}

function create_filter_select_options (layer_name, layer, filter_value) {

    // Create the value filter dropdown for discrete values,
    // If we have not yet created it.
    // Note that binary values without entries in the input colormap file
    // DO have a colormap entry in the code.

    // If the select list is already filled in there is nothing to do
    if (filter_value.children().length > 0) { return; }
    
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
        console.log('error: no colormap for categorical attr: ' +
            'please log an issue on git with a re-creatable error',
             layer_name);
    }

    // Create the option elements
    _.each(data, function (cat) {
        var option = $("<option/>")
            .attr('value', cat.code)
            .text(cat.text);
        filter_value.append(option);
    });

    // Select the appropriate option on first opening
    var value = util.session('filter_value', 'get', layer_name);
    if (_.isNull(value)) {

        // There is no value saved, so leave menu set to the first option,
        // and initialize the saved value to the first one.
        util.session('filter_value', 'set', layer_name, parseInt(first));

    } else {

        // There is a value saved, so set the menu to that option.
        filter_value.val(value);
    }

    // Update colors to reflect the filter created by the initial selection
    colorMix.refreshColors();

    // Define the event handler for selecting an item
    filter_value.on('change', function (ev) {
        util.session(
            'filter_value', 'set', layer_name, parseInt(ev.target.value));
        
        // Update the colors to reflect the filter updated by this select
        colorMix.refreshColors();
    });
}

function create_range_slider (layer_name, root) {

    // Create a filter range slider for continuous variables.

    // If the range slider has already been created, there is nothing to do.
    if (root.find('.ui-slider-range').length > 0) { return; }

    var layer = layers[layer_name],
        min = layer.minimum,
        max = layer.maximum,
        span = max - min,
        
        // This factor is used to compensate for the jquery-ui slider
        // that has a problem with maximum values less than one.
        // The factor makes the slider max be between one and 10.
        factor = Math.pow(10, Math.floor(Math.log(max) / Math.LN10));

    // Handle a slider handle moving
    var sliding = function(event, ui) {
        var low = ui.values[0],
            high = ui.values[1];
        
        slider_vals.set(layer_name, [low * factor, high * factor]);

        // Set the width of the low and high masks
        var x_span = $(event.target).width(); // The span in pixels

        root.find('.low_mask').width(Math.abs(low * factor - min) / span * x_span);
        root.find('.high_mask').width(Math.abs(max - high * factor) / span * x_span);

    };

    // Handler to apply the filter after the user has finished sliding
    var done_sliding = function (event, ui) {
    
        var low = ui.values[0],
            high = ui.values[1];
        
        util.session('filter_value', 'set', layer_name,
            [low * factor, high * factor]);
        slider_vals.set(layer_name, [low * factor, high * factor]);
        colorMix.refreshColors();
    };

    // Create the slider
    var vals = _.map(util.session('filter_value', 'get', layer_name),
            function (val) {
                return val / factor;
            }
        ),
        slider_line = root.find('.range_slider');
        slider_var = slider_line.slider({
        range: true,
        min: min / factor,
        max: max / factor,
        values: vals,
        height: 10,
        step: (max - min) / factor / 100,
        slide: sliding,
        stop: done_sliding,
    });

    // Update the masks and slider with the saved values
    sliding({target: slider_line[0]}, {values: vals});
}

function create_shortlist_ui_entry_with_data (layer_name, root) {
    // Add all of the metadata
    Layer.fill_metadata(root.find('.metadata_holder'), layer_name);

    if (util.is_continuous(layer_name)) {

        // Create the chart after google chart has a chance to load.
        setTimeout(function () {
            gChart.create(layer_name, root.find('.chart'), 'histogram');
        }, 10);

        var min = layers[layer_name].minimum,
            max = layers[layer_name].maximum;

        if (_.isUndefined(
            util.session('filter_value', 'get', layer_name))) {
        
            // Range filter values are not yet saved,
            // so initialize the state and slider to the layer extents.
            util.session('filter_value', 'set', layer_name, [min, max]);
            slider_vals.set(layer_name, [min, max]);
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
            util.session('filter_value', 'get', layer_name))) {
        
            // Filter value is not yet saved,
            // so initialize it to the first option.
            var val = 0;
            if (util.is_binary(layer_name)) {
                val = 1;
            }
                
            util.session('filter_value', 'set', layer_name, val);
        }
        
        // Build the barChart after the filter values are sure to be defined
        setTimeout(function () {
            gChart.create(layer_name, root.find('.chart'), 'barChart');
        }, 10);

    }
}

function save_filter_clicked (layer_name) {

    // Clicking on the save button creates a dynamic layer
    var value = util.session('filter_value', 'get', layer_name),
        layer = layers[layer_name],
        nodeIds = [];
    
    if (util.is_continuous(layer_name)) {

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
}

function build_filter (layer_name) {

    // Build a filter area.
    
    // The filter may already be built and we only build it when the
    // filter is to be shown.
    if (filterBuilt.get(layer_name) || !is_filter_showing(layer_name)) {
        return;
    }
    
    var root = get_root_from_layer_name(layer_name);
    
    // Figure out what kind of filter settings we take based on
    // what kind of layer we are.
    Layer.with_one (layer_name, function (layer) {
    
        if (util.is_continuous(layer_name)) {
        
            // Add a range slider
            create_range_slider(layer_name, root);
        } else {

            // Add a value picker
            create_filter_select_options(layer_name, layer,
                root.find('.filter_contents').find('.filter_value'));
        }
        
        filterBuilt.set(layer_name, true);

        root.find('.save_filter').click(function() {
            save_filter_clicked(layer_name);
        });
    });
}

function filter_control_changed (ev) {
    
    // We are responding to a filter button press to turn filtering
    // on or off.
    var root = get_root_from_child ($(ev.target));
    layer_name = get_layer_name_from_root(root);

    // Set the filter show flag may not yet be defined.
    if (_.isUndefined(util.session('filter_show', 'get', layer_name))) {
        util.session('filter_show', 'set', layer_name, true);
    } else {
        util.session('filter_show', 'set', layer_name,
                !is_filter_showing(layer_name));
    }

    build_filter(layer_name);

    // Update the colors with the new filtering or lack thereof.
    colorMix.refreshColors();
}

function ui_and_list_delete (layer_name) {

    // This updates the shortlist variable and UI for remove from shortlist.
    // Moves via the jqueryUI sortable are handled in the sortable's update
    // function.
    var shortlist = Session.get('shortlist'),
        root = get_root_from_layer_name(layer_name),
        index;

    if (shortlist.indexOf(layer_name) < 0) { return; }

    // Remove from the shortlist list
    shortlist.splice(shortlist.indexOf(layer_name), 1);
    Session.set('shortlist', shortlist);
    
    // Remove from the shortlist UI.
    root.remove();

    // Remove this layer from active_layers if it was in there.
    rx.set('activeAttrs.deleteOne', { attr: layer_name });
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
        Layer.with_one(layer_name, function () {
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

function make_sortable_ui_and_list () {

    // This updates the shortlist UI and list when the user moves an entry.
     $shortlist.sortable({
        update: function () {
        
            // Find shortlist entries, ignoring the dynamic controls.
            var entries = _.filter($shortlist.children(), function (el) {
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
    var active = rx.get('activeAttrs'),
        entriesReady = entriesInited.get(),
        length,
        $anchor;
    
    if (_.isUndefined(active) ||
        !entriesReady ||
        rx.isArrayEqual(prevActiveAttrs, active)) {
        return;
    }
    prevActiveAttrs = active.slice();
    length = active.length;

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

    // Finally, refresh the map colors if we have the data,
    // otherwise the colors are refreshed when the data arrives.
    if (active.length > 0 && layers[active[0]].data) {
        colorMix.refreshColors();
    }
}

function primaryButtonClick (ev) {
    var layer_name = get_layer_name_from_child(ev.target);

    // If this layer is already primary, remove it as primary.
    // This has a side effect of setting any secondary to primary,
    // or leaving no active layers.
    if (is_primary(layer_name)) {
        rx.set('activeAttrs.deleteOne', { attr: layer_name });

    // If this layer is secondary,
    // set it as the primary and only active layer.
    } else if (is_secondary(layer_name)) {
        rx.set('activeAttrs.updateAll', { attrs: [layer_name] });
        
    // This layer is not currently active, so make it primary
    // preserving any secondary.
    } else {
        rx.set('activeAttrs.upsertPrimary', { attr: layer_name });
    }
}

function secondaryButtonClick (ev) {
         layer_name = get_layer_name_from_child(ev.target);

    // If this layer is already secondary, remove it from secondary
    if (is_secondary(layer_name)) {
        rx.set('activeAttrs.deleteOne', { attr: layer_name });
        
    // If this layer is primary...
    } else if (is_primary(layer_name)) {
        
        // Switch places with the secondary.
        rx.set('activeAttrs.primaryToSecondary', { attr: layer_name });
    } else {
    
        // Layer is not in the actives so update/insert it.
        rx.set('activeAttrs.upsertSecondary', { attr: layer_name });
    }
}

function removeButtonClick (ev) {
    exports.removeEntry(get_layer_name_from_child(ev.target));
}

function create_float_controls () {

    // This is the floating button control panel that appears when
    // a shortlist entry is hovered upon.

    // Handle the click of the primary button
    $shortlist.on ('click', '.primary', primaryButtonClick);

    // Handle the click of the secondary button
    $shortlist.find('.secondary').on('click', secondaryButtonClick);

    // Handle the removal from the short list
    $shortlist.find('.remove').on('click', removeButtonClick);
}

function addInitialEntriesToShortlist (layerNames) {    
    // Add some initial entries to the shortlist.
    _.each(layerNames, function (layer_name) {
    
        $shortlist.append(create_shortlist_ui_entry(layer_name));
    
        // Initialize value display for continuous if it needs it.
        if (util.is_continuous(layer_name) &&
            _.isUndefined(util.session('filter_value', 'get', layer_name))) {
           
            util.session('filter_value', 'set', layer_name,
                [layers[layer_name].minimum, layers[layer_name].maximum]);
           
        }
        if (is_filter_showing(layer_name)) {
            build_filter(layer_name)
        }
    });
}

function receivedInitialActiveLayers (layers_added) {

    // The initial active layer values are now loaded.
    
    // Make the shortlist entries re-orderable
    make_sortable_ui_and_list();
    
    addInitialEntriesToShortlist(Session.get('shortlist'));
    entriesInited.set(true);
}

exports.removeEntry = function (layer_name) {

    // Remove an entry and all of its dependents if it is in the global layers.
    if (layers[layer_name]) {
    
        // If this layer has a delete function, do that
        if (layers[layer_name].removeFx) {
            layers[layer_name].removeFx(layer_name);
        }

        // Handle dynamic layers
        if (layers[layer_name].dynamic) {
            delete layers[layer_name];
            if (layer_name in colormaps) {
                delete colormaps[layer_name];
            }
            util.removeFromDataTypeList(layer_name);
        }

        // Move all of the dynamic controls to a holding place so they
        // don't get removed from the DOM
        $dynamic_controls
            .append($float_controls)
            .append($shortlist.find('.is_primary'))
            .append($shortlist.find('.is_secondary'));

        // Clear any google chart associated with this layer
        gChart.clear(layer_name);

        // Clear any filter values and show state for this layer
        delete Session.keys['shortlist_filter_show_' + layer_name];
        delete Session.keys['shortlist_filter_value_' + layer_name];

        // Update the shortlist state variable and UI.
        ui_and_list_delete(layer_name);

        // Remove this layer's shortlist entry template
        delete template[layer_name];

        // Refresh the map.
        colorMix.refreshColors();
    }
}

exports.get_active_coloring_layers = function () {
    // Returns an array of the string names of the layers that are
    // actively displaying their colors.
    return rx.get('activeAttrs');
}

exports.ui_and_list_add = function (layer_name) {

    // This updates the shortlist variable and UI for add to shortlist.
    // Moves via the jqueryUI sortable are handled in the sortable's update
    // function.
    if (!Session.equals('shortlistInited', true)) {
        
        // We'll add the shortlist UI entries as part of initialization
        // and not here.
        return;
    }

    var shortlist = Session.get('shortlist'),
        root = get_root_from_layer_name(layer_name),
        index = shortlist.indexOf(layer_name);
        
    $shortlist = $shortlist || $('#shortlist');
    
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

    // Set the actives to just this layer.
    rx.set('activeAttrs.updateAll', { attrs: [layer_name] });
    
    Session.set('shortlist', shortlist);
}

exports.update_ui_metadata = function () {

    // Update the metadata for each layer in the shortlist
    // TODO: make the metadata updates reactive
    _.each(Session.get('shortlist'), function(layer_name) {
        var root = get_root_from_layer_name(layer_name);
            Layer.fill_metadata(root.find(".metadata_holder"), layer_name);
    });
}

exports.with_filtered_signatures = function (filters, callback) {
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
    
    Layer.with_many(layer_names, function(filter_layers) {
        // filter_layers is guaranteed to be in the same order as filters.
        
        // This is an array of signatures that pass all the filters.
        var passing_signatures = [];

        for(var signature in polygons) {
            // For each signature
            
            // This holds whether we pass all the filters
            var pass = true;

            // For each filtering layer
            for(var i = 0; i < filter_layers.length; i++) {

                if(!filters[i].filter_function(
                    filter_layers[i].data[signature], signature)) {
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
}

exports.get_current_filters = function () {

    // Returns an array of filter objects, according to the shortlist UI.
    // Filter objects have a layer name and a boolean-valued filter function
    // that returns true or false, given a value from that layer.
    var current_filters = [];
    var allFilters = rx.get('shortEntry.filter');
    var activeAttrs = rx.get('activeAttrs');

    _.each(Session.get('shortlist'), function (layer_name) {

        // Go through all the shortlist entries.
        // This function is also the scope used for filtering function
        // config variables.

        // if the filter is showing and the layer is active, apply a filter
        if (activeAttrs.indexOf(layer_name) > -1) {

            // This will hold our filter function.
            var filter = allFilters[layer_name];
            var filter_function

            // Define the functions and values to use for filtering
            //var desired = util.session('filter_value', 'get', layer_name);
           
            if (filter) {
                switch (filter.by) {
                case 'attr':
                    filter_function = function (value, nodeId) {
                        return (layers[filter.value].data[nodeId] === 1);
                    }
                    break
                case 'category':
                    filter_function = function (value, nodeId) {
                        return (filter.values.indexOf(value) > -1)
                    }
                    break
                }
           } else {
                filter_function = function(value) {  // jshint ignore: line
                    return true;
                };
           }
            /*
                // Continuous filters get a "clamping" effect, meaning
                // that values outside of the filter are set to the
                // highest or lowest value instead of getting the
                // noDataColor.

            } else if (util.is_continuous(layer_name)) {
                 // Use a range for continuous values.
                filter_function = function(value) {
                     return (value >= desired[0] && value <= desired[1]);
                };

            } else {

                // Use a discrete value match.
                filter_function = function(value) {
                    return (value === desired);
                };
            */

            // Add a filter on this layer, with the function we've prepared.
            current_filters.push({
                layer_name: layer_name,
                filter_function: filter_function,
            });
        }
    });
    
    return current_filters;
}

exports.get_slider_range = function (layer_name) {

    // Given the name of a layer, get the slider range from its shortlist UI
    // entry if the filter is active. If not active, return the layer's
    // max and min. Assumes the layer has a shortlist UI entry.
    if (util.session('filter_show', 'get', layer_name)) {
        var range = util.session('filter_value', 'get', layer_name);
        if (_.isUndefined(range)) {
            return [layers[layer_name].minimum, layers[layer_name].maximum];
        } else {
            return range;
        }
    } else {
        return [layers[layer_name].minimum, layers[layer_name].maximum];
    }
}

    exports.inShortList = function(layerName){
        var shortList = Session.get('shortlist');
        return (shortList.indexOf(layerName) > -1)
    }

    exports.getContinuousLayerNames = function() {
        var shortlist = Session.get('shortlist');
        var contLayers = shortlist.filter(function(layerName) {
            return util.is_continuous(layerName)
        });
        return contLayers
    }

    exports.getBinaryLayerNames = function() {
        var shortlist = Session.get('shortlist');
        var binLayers = shortlist.filter(function(layerName) {
            return util.is_binary(layerName)
        });
        return binLayers
    }

    exports.getAllLayerNames = function() {
        return Session.get('shortlist')
    };

exports.removeDynamicEntries = function () {
    for (name in layers) {
        if (layers[name].dynamic) {
            delete layers[name];
        }
    }
}

exports.dynamicAttrsToStoreFormat = function () {

    // Return the dynamic entries in the short list, while converting the
    // color objects in the colormaps to saveable objects.
    var entries = {};
    _.each(layers, function (layer, name) {
        if (layer.dynamic) {
        
            entries[name] = {
                data: layer.data,
                dataType: util.getDataType(name),
                dynamic: true,
            }
            if (!_.isUndefined(layer.selection)) {
                entries[name].selection = layer.selection;
            }
            if (!_.isUndefined(layer.positives)) {
                entries[name].positives = layer.positives;
            }

            if (!_.isUndefined(colormaps[name])) {
           
                // Convert the operating colormap to a store colormap.
                entries[name].colormap =
                    Colormap.toStoreFormat(colormaps[name]);
            }
        }
    });

    return entries;
}

exports.complete_initialization = function () {

    // Executed after other initially visible widgets are populated.
    
    function loadRemainderOfEntries () {
        var actives = rx.get('activeAttrs'),
            layerNames = _.filter(Session.get('shortlist'), function (layer) {
                return (actives.indexOf(layer) < 0);
            });
        addInitialEntriesToShortlist(layerNames);
        Session.set('shortlistInited', true);
        setTimeout(function () {
            rx.set('snake.shortlist.hide');
        });
    }
 
    // Add the shortlist layer values to the global layers object.
    Layer.with_many(Session.get('shortlist'), loadRemainderOfEntries,
        rx.get('dynamicAttrs'));
}

exports.init = function () {

    if (initialization_started) { return; }
    
    initialization_started = true;

    // Initialize some handy variables
    $shortlist = $('#shortlist');
    $dynamic_controls = $shortlist.find('.dynamic_controls');
    $float_controls = $shortlist.find('.float');
    Session.set('active_layers', rx.get('activeAttrs'));
    
    Session.set('shortlistInited', false);
    entriesInited.set(false);
    
    // Run this whenever the active list changes to update the hot primary
    // and secondary icons and change the map colors.
    rx.subscribe(when_active_color_layers_change);
    rx.subscribe(updateAttrsActiveForTemplate);
    
    // Create the controls that move from entry to entry.
    create_float_controls();
    
    // Add the active shortlist layer values to the global layers object.
    Layer.with_many(rx.get('activeAttrs'), receivedInitialActiveLayers,
        rx.get('dynamicAttrs'));
    
    const store = rx.getStore();
    render(
        <Provider store={store}>
            <ShortEntryMenuCont />
        </Provider>,
        document.getElementById('shortEntryMenuWrap')
    )
 }
