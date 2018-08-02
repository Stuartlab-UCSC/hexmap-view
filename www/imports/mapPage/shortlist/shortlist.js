// shortlist.js
// Handle most of the functions of the shortlist, which contain the layers the
// user has added so they can be quickly selected for display.

import '/imports/lib/jquery-ui';

import Colormap from '/imports/mapPage/color/Colormap';
import colorMix from '/imports/mapPage/color/colorMix';
import gChart from '/imports/mapPage/shortlist/gChart';
import Layer from '/imports/mapPage/longlist/Layer';
import rx from '/imports/common/rx';
import util from '/imports/common/util';

import ShortEntryMenuFilter
    from '/imports/mapPage/shortlist/ShortEntryMenuFilter';

import './shortlist.html';
import './shortlist.css';
import './shortEntry.css';

var showSlider = new ReactiveDict({}); // should the filter slider show?
var hasFilter = new ReactiveDict({}); // does a filter exists?
var anyFilters = new ReactiveVar(false) // are there any filters
var zeroShow = new ReactiveDict(); // To show or hide the zero tick mark
var filterBuilt = new ReactiveDict(); // Is filter built?
var slider_vals = new ReactiveDict(); // low and high values as sliding
var template = {}; // A template for each layer
var $shortlist; // The shortlist DOM element
var $dynamic_controls; // The control DOM elements that come and go
var $float_controls; // The floating control DOM elements
var hover_layer_name = new ReactiveVar(''); // Track the current layer
var activeLayers = new ReactiveVar();
let prevShortlist = []
var icon = {
    primary: '/icons/eye1.svg',
    secondary: '/icons/eye2.svg',
    filter_hot: '/icons/filter-hot.png',
    close: '/icons/close.svg',
};

function get_range_display_values (layer_name, i) {

    // Update the display as the sliders are moved.
    var vals = slider_vals.get(layer_name);
    if (vals && !_.isUndefined(vals[i])) {
        return vals[i];
    } else {
        return i < 1 ? 'low' : 'high';
    }
}

function is_primary (layer_name) {
    if (!layer_name) { return false; }
    var actives = activeLayers.get();
    return (actives && actives.indexOf(layer_name) === 0);
}

function is_secondary (layer_name) {
    if (!layer_name) { return false; }
    var actives = activeLayers.get();
    return (actives && actives.indexOf(layer_name) === 1);
}

function is_hovered (layer_name) {
    var hovered = hover_layer_name.get();
    if (!layer_name) { return false; }
    return (hovered === layer_name);
}

function should_show_slider (layer_name) {
    if (!layer_name) { return false; }
    var show = showSlider.get(layer_name)

    if (_.isUndefined(show)) { return false; }
    return show;
}

function does_have_filter (layer_name) {
    if (!layer_name) { return false; }
    var has = hasFilter.get(layer_name)

    if (_.isUndefined(has)) { return false; }
    return has;
}

function get_root_from_child (child) {
    return $(child).parents('.shortlist_entry');
}

function get_layer_name_from_root (root) {
    return (root && root.length > 0) ? root.data('layer') : null;
}

export function get_root_from_layer_name (layer_name) {
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
    filter_icon: function () {
        return icon.filter_hot
    },
    filter_display: function () {
        return (anyFilters.get()) ? 'initial' : 'none'
    },
    primary_east: function () {
        return (is_secondary(hover_layer_name.get())) ? 'east' : '';
    },
    secondary_east: function () {
        return (is_secondary(hover_layer_name.get())) ? '' : 'east';
    },
    primary_icon: function () {
        return icon.primary;
    },
    secondary_icon: function () {
        return icon.secondary;
    },
    secondary_icon_display: function () {
        var layer_name =
            get_layer_name_from_child('#shortlist .is_primary');
        if (layer_name) {
            return (is_hovered(layer_name) &&
                activeLayers.get().length < 2) ?
                'none' : 'initial';
        } else {
            return 'none';
        }
    },
    maskOpacity: function () {
        let hovered = hover_layer_name.get()
        let actives = activeLayers.get()
        let activesLen = 0
        if (actives) {
            activesLen = actives.length
        }
        if (is_primary(hovered)) {
            if (activesLen > 1) {
                return '1'
            }
        } else if (is_secondary(hovered)) {
            return '1'
        } else if (activesLen > 0) {
            return '1';
        } else {
            return '0'
        }
    },
    dynamic: function () {
        if (typeof layers !== 'undefined') {
            let layer = layers[hover_layer_name.get()]
            if (typeof layer !== 'undefined' && layer.dynamic) {
                return 'dynamic'
            }
        }
        return ''
    },
    is_primary_icon: function () {
        return icon.primary;
    },
    is_secondary_icon: function () {
        return icon.secondary;
    },
    remove_icon: function () {
        return icon.close;
    },
});

Template.shortlistEntryT.helpers({
    range_value_display: function () {
        return (util.is_continuous(this.toString())) ? 'initial' : 'none';
    },
    zero_display: function () {
        return (zeroShow.get(this.toString())) ? 'initial' : 'none';
    },
    filter_icon: function () {
        return icon.filter_hot;
    },
    filter_icon_display: function () {
        var layer_name = this.toString();
        return (does_have_filter(layer_name)) ? 'initial' : 'none';
    },
    filter_display: function () {
        return (should_show_slider(this.toString()) ? 'block' : 'none');
    },
    range: function () {
        var vals = slider_vals.get(this.toString());
        return (_.isUndefined(vals)) ? [0,0] : vals;
    },
    slider_display: function () {
        var show = util.is_continuous(this.toString());
        return (show ? 'inline-block' : 'none');
    },
    low: function () {
        var layer_name = this.toString(),
            val = get_range_display_values(layer_name, 0);
        if (typeof val === 'number') {
            val = Number(val).toExponential(1);
        }
        return val;
    },
    high: function () {
        var layer_name = this.toString(),
            val = get_range_display_values(layer_name, 1);
        if (typeof val === 'number') {
            val = Number(val).toExponential(1);
        }
        return val;
    },
});

function create_range_slider (layer_name, root) {

    // Create a filter range slider for continuous variables.

    // If the range slider has already been created, there is nothing to do.
    if (root.find('.ui-slider-range').length > 0) { return; }
    
    var layer = layers[layer_name],
        min = layer.minimum,
        max = layer.maximum,
        span = max - min;
    
    // Handle a slider handle moving.
    var sliding = (event, ui, done) => {
        let low = Math.max(min, (ui.values[0] * span) + min)
        let high = Math.min(max, (ui.values[1] * span) + min)

        slider_vals.set(layer_name, [low, high]);

        // Set the width of the low and high masks
        var x_span = $(event.target).width(); // The span in pixels
        root.find('.low_mask').width(Math.abs(low - min) / span * x_span);
        root.find('.high_mask').width(Math.abs(max - high) / span * x_span);
        
        if (done) {

            // Save to global state and slider vals.
            ShortEntryMenuFilter.onContinuousValue(layer_name, low, high)
            slider_vals.set(layer_name, [low, high]);
        }
    }

    // Handler to apply the filter after the user has finished sliding.
    var done_sliding = function (event, ui) {
        sliding(event, ui, true)
    };

    // Create the slider
    var vals = _.map(slider_vals.get(layer_name),
            function (val) {
                return (val - min) / span;
            }
        ),
        slider_line = root.find('.range_slider');
    
    slider_line.slider({
        range: true,
        min: 0,
        max: 1,
        values: vals,
        height: 10,
        step: 1 / 100,
        slide: sliding,
        stop: done_sliding,
    });

    // Initialize the masks and slider with the saved values.
    sliding({target: slider_line[0]}, {values: vals});
}

function findChartData (layer_name, filteredNodes) {
    var layer = layers[layer_name],
        keys = Object.keys(layer.data),
        filteredKeys = filteredNodes
            .filter(node => { return (keys.indexOf(node) > -1) }),
        filteredValues= filteredKeys.map(key => { return layer.data[key] })
    
    return _.zip(filteredKeys, filteredValues)
}

function drawChart (layer_name, filteredNodes, root) {

    if (!root) {
        root = get_root_from_layer_name(layer_name);
    }

    if (util.is_continuous(layer_name)) {
        var dataArrays = findChartData(layer_name, filteredNodes)
        let chartArea = root.find('.chart_area')
        if (dataArrays.length < 1) {
        
            // With no data, there is no chart to draw.
            //gChart.clear(layer_name)
            //chartArea.hide()
            return
        }
        
        //chartArea.show()

        // Create the histogram.
        gChart.draw(
            layer_name, root.find('.chart'), 'histogram', dataArrays);
        
        // Find the min and max.
        let layerData = layers[layer_name].data
        let vals = dataArrays.map(keyVal => {
            return layerData[keyVal[0]]
        })

        var min = Math.min.apply(null, vals),
            max = Math.max.apply(null, vals)

        if (_.isUndefined(slider_vals.get(layer_name))) {
        
            // Range filter values are not yet saved,
            // so initialize the slider to the min & max filtered values.
            slider_vals.set(layer_name, [min, max]);
        }

        // Put a tick on zero if zero is in the range.
        zeroShow.set(layer_name, (0 > min && 0 < max))

        // Wait for the chart to complete drawing so we can see the offset.
        Meteor.setTimeout(function () {
            var root = get_root_from_layer_name(layer_name),
                chart = root.find('.chart'),
                x_span = chart.width(),
                x_low_width = -min / (max - min) * x_span;
            root.find('.zero_tick').css('left', x_low_width);
            root.find('.zero').css('left', x_low_width -9);
        }, 500);

    } else {
        
        // Build the barChart.
        gChart.draw(layer_name, root.find('.chart'), 'barChart', filteredNodes);
    }
}

export function drawAllCharts (filteredNodes) {
    /*
    rx.get('shortlist').forEach (attr => {
        drawChart(attr, filteredNodes)
    })
    */
}

function build_continuous_filter (layer_name) {

    // Build a filter area.
    
    // The filter may already be built and we only build it when the
    // filter is to be shown.
    if (filterBuilt.get(layer_name) || !should_show_slider(layer_name)) {
        return;
    }
    
    var root = get_root_from_layer_name(layer_name);
    
    // Figure out what kind of filter settings we take based on
    // what kind of layer we are.
    Layer.with_one (layer_name, function () {
        
        // Add a range slider
        create_range_slider(layer_name, root);
        filterBuilt.set(layer_name, true);
    });
}

function syncStateWithTemplate () {

    // Sync state with template variables.
    let filterBys = rx.get('shortEntry.menu.filter')
    let filters = rx.get('shortEntry.filter')
    let rxList = rx.get('shortlist')

    // When the active layers change update the primary and secondary
    // indicators on the UI and refresh the map colors.
    let active = rx.get('activeAttrs')
    if (!rx.isArrayEqual(activeLayers.get(), active)) {
        activeLayers.set(active);
        attachActiveIcons()
        colorMix.refreshColors()
    }

    // Sync filter state with template variables.
    rxList.forEach(function (attr) {
        
        // Handle showing of range sliders for continuous.
        let filterBy = filterBys[attr]
        let shouldShow = (filterBy !== undefined &&
            (filterBy === 'range' || filterBy === 'threshold'))
        let showing = showSlider.get(attr)
        if (shouldShow && !showing) {
            showSlider.set(attr, !showing)
            build_continuous_filter(attr)
        } else if (!shouldShow && showing) {
            showSlider.set(attr, !showing)
        }

        // Handle showing of the filter icon on the entry.
        shouldShow = (filters[attr] !== undefined)
        showing = hasFilter.get(attr)
        if ((!shouldShow && showing) || (shouldShow && !showing)) {
            hasFilter.set(attr, !showing)
        }
        
        // Handle showing of the filter icon at the top of the list.
        anyFilters.set(Object.keys(filters).length > 0)
    })
}

function create_shortlist_ui_entry_with_data (layer_name, root) {

    // Add all of the metadata.
    Layer.fill_metadata(root.find('.metadata_holder'), layer_name);
    
    // Find any filter info.
    let filterBy = rx.get('shortEntry.menu.filter')[layer_name]
    if (filterBy && (filterBy === 'range' || filterBy === 'threshold')) {
        build_continuous_filter(layer_name)
    }

    // Draw any charts that need redrawing.
    //with_filtered_signatures(function (filteredNodes) {
        //drawChart(layer_name, filteredNodes, root)
        drawChart(layer_name, Object.keys(polygons), root)
    //})
}

export function create_shortlist_ui_entry (layer_name) {

    // Makes a shortlist DOM entry for one layer.

    // Skip this if this layer does not yet exist,
    // or if this entry already exists.
    if (!layers[layer_name] || (get_root_from_layer_name(layer_name).length)) {
        return
    }
    
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

    // On mouse entering the shortlist entry, show the floating controls
    // and the filter button    console.log('root:', root)
    root.on('mouseenter', function () {
        root.prepend($float_controls);
        hover_layer_name.set(layer_name);
    });

    // On mouse leaving the shortlist entry, hide the floating controls
    // and the filter button if the filter is not active
    root.on('mouseleave', function () {
        hover_layer_name.set('');
        $dynamic_controls.append($float_controls);
    });

    return root;
}

export function attrNameListChange () {
    
    // Update the shortlist entry elements when the attr name list changes.
    let sList = rx.get('shortlist')
    if (rx.isArrayEqual(sList, prevShortlist)) {
        return
    }
    
    // Save the attr names of entries currently in list.
    let maybeDelete = prevShortlist.slice()
    prevShortlist = sList
    
    // Loop through the entries, appending them in order of the shortlist state.
    let listEl = document.querySelector('#shortlist')
    let children = Array.from(listEl.children)
    sList.forEach(listAttr => {
        let foundEl = children.find(childEl => {
            let elAttr = childEl.dataset.layer
            if (elAttr && elAttr === listAttr) {
                listEl.append(childEl)
                return true
            }
            return false
        })
        if (foundEl) {
        
            // Remove this attr from the list of attrs not yet found.
            let index = maybeDelete.indexOf(foundEl.dataset.layer)
            maybeDelete.splice(index, 1)

        } else {  // Entry element was not found, so add it and make it active.
            create_shortlist_ui_entry(listAttr)
            rx.set('activeAttrs.updateAll', { attrs: [listAttr] });
        }
    })
    
    // Remove any entry elements no longer in the shortlist state.
    maybeDelete.forEach((deleteAttr) => {
        let foundEl = children.find(childEl => {
            let elAttr = childEl.dataset.layer
            if (elAttr && elAttr === deleteAttr) {
                removeEntry(elAttr)
                return true
            }
            return false
        })

        // Remove this layer from active_layers.
        rx.set('activeAttrs.deleteOne', { attr: foundEl.dataset.layer });
    })
}

function attachActiveIcons () {
    let active = activeLayers.get();
    let length = active.length;

    // For each of primary index and secondary index...
    _.each([0, 1], function (index) {
        let $anchor = $dynamic_controls
        if (length > index) {
 
            // There is an active so attach the icon to the layer's
            // shortlist entry.
            $anchor = get_root_from_layer_name(active[index]);
        }
        if ($anchor && $shortlist) {
            $anchor.prepend($shortlist.find(
                index === 0 ? '.is_primary' : '.is_secondary'));
        }
    });
}

export function primaryButtonClick (ev) {
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

export function secondaryButtonClick (ev) {
    let layer_name = get_layer_name_from_child(ev.target);

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

export function removeButtonClick (ev) {
    rx.set('shortlist.deleteByButton',
        { attr: get_layer_name_from_child(ev.target) })
}

function removeEntry (layer_name) {

    // Remove an entry and all of its dependents if it is in the global layers.
    if (layers[layer_name]) {
    
        // If this layer has a delete function, do that
        if (layers[layer_name].removeFx) {
            layers[layer_name].removeFx(layer_name);
        }

        // Remove dynamic layer info.
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

        // Clear any filter values.
        rx.set('shortEntry.filter.drop', {attr: layer_name})

        // Remove this layer's shortlist entry element.
        let root = get_root_from_layer_name(layer_name);
        root.remove()
        delete template[layer_name];
        
        // Reattach the primary and secondary icons.
        attachActiveIcons();
    }
}

exports.get_active_coloring_layers = function () {
    // Returns an array of the string names of the layers that are
    // actively displaying their colors.
    return rx.get('activeAttrs');
}

exports.update_ui_metadata = function () {

    // Update the metadata for each layer in the shortlist
    // TODO: make the metadata updates reactive
    _.each(rx.get('shortlist'), function(layer_name) {
        var root = get_root_from_layer_name(layer_name);
        Layer.fill_metadata(root.find(".metadata_holder"), layer_name);
    });
}

export function with_filtered_signatures (callback) {

    // Finds the filter functions based on shortlist filters.
    // Computes an array of all signatures passing all filters, and passes
    // that to the given callback.
    
    // Find the filter functions.
    let filters = get_current_filters()
    
    // Prepare a list of all the layers
    var layer_names = [];
    
    for(var i = 0; i < filters.length; i++) {
        layer_names.push(filters[i].layer_name);
    }
    
    Layer.with_many(layer_names, function(filter_layers) {
        
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

function get_current_filters () {

    // Returns an array of filter objects, according to the shortlist UI.
    // Filter objects have a layer name and a boolean-valued filter function
    // that returns true or false, given a value from that layer.
    var allFilters = rx.get('shortEntry.filter');
    var current_filters = [];

    // Go through all the filters.
    
    Object.keys(allFilters).forEach(layer_name => {

        // Define the functions and values to use for filtering
        var filter = allFilters[layer_name];
       
        //console.log('get_current_filters:filter:', filter)

        // The default filter function.
        // eslint-disable-next-line no-unused-vars
        var filter_function = function (value, unusedNodeId) {
            return true;
        };
       
        // Set the filter depending upon attr, category or range filter.
        //console.log('isFilter')
        switch (filter.by) {
        case 'category':
            // eslint-disable-next-line no-unused-vars
            filter_function = function (value, unusedNodeId) {
                return (filter.value.indexOf(value) > -1)
            }
            break
        case 'range':
            // eslint-disable-next-line no-unused-vars
            filter_function = function (value, unusedNodeId) {
                return (value >= filter.low && value <= filter.high);
            }
            break
        }

        // Add a filter on this layer, with the function we've prepared.
        current_filters.push({
            layer_name: layer_name,
            filter_function: filter_function,
        });
    });
    
    return current_filters;
}

exports.get_slider_range = function (layer_name) {

    // Given the name of a layer, get the slider range from its shortlist UI
    // entry. If there is no slider yet, return the attr's min & max.
    var range = slider_vals.get(layer_name);
    if (_.isUndefined(range)) {
        return [layers[layer_name].minimum, layers[layer_name].maximum];
    } else {
        return range;
    }
}

exports.inShortList = function(layerName){
    return (rx.get('shortlist').indexOf(layerName) > -1)
}

exports.getContinuousLayerNames = function() {
    var contLayers = rx.get('shortlist').filter(function(layerName) {
        return util.is_continuous(layerName)
    });
    return contLayers
}

exports.getBinaryLayerNames = function() {
    var binLayers = rx.get('shortlist').filter(function(layerName) {
        return util.is_binary(layerName)
    });
    return binLayers
}

exports.getAllLayerNames = function() {
    return rx.get('shortlist')
};

exports.removeDynamicEntries = function () {
    for (var name in layers) {
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

function create_float_controls () {

    // This is the floating button control panel that appears when
    // a shortlist entry is hovered upon.
    $dynamic_controls = $('#shortlist .dynamic_controls')
    $float_controls = $shortlist.find('.float');
    
    // Handle the click of the primary button
    $shortlist.on ('click', '.primary', primaryButtonClick);

    // Handle the click of the secondary button
    $shortlist.find('.secondary').on('click', secondaryButtonClick);

    // Handle the removal from the short list
    $shortlist.find('.remove').on('click', removeButtonClick);
}

export function init () {

    // Initialize the active layer reactive var just for templates.
    activeLayers.set(null)

    // Create the controls that move from entry to entry.
    $shortlist = $('#shortlist');
    create_float_controls();
    
    // Run this whenever the state variables change to sync them with the
    // template variables.
    rx.subscribe(syncStateWithTemplate);
}

