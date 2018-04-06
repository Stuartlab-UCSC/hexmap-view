// Layer.js
// Most of the code to handle the layer data.

import data from '/imports/mapPage/data/data';
import colorEdit from '/imports/mapPage/color/colorEdit';
import colorMix from '/imports/mapPage/color/colorMix';
import jPalette from '/imports/lib/jPalette';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import userMsg from '/imports/common/userMsg';
import util from '/imports/common/util';

var selection_prefix = 'Selection',
    selectionNamer;

function ask_user_to_name_layer (name, dup_name, callback) {

    // Give the user a chance to name the layer
    var promptStr = (dup_name) ?
                        '"' + dup_name + '" is in use, how about this one?' :
                        'Name your new attribute.';
    if (!selectionNamer) {
        import React from 'react';
        import { render } from 'react-dom';
        import Namer from '/imports/component/Namer';
        selectionNamer = render(
            <Namer
                promptStr = {promptStr}
            />, document.getElementById('selectionNamerWrap')
        );
    }
    selectionNamer.setState({
        promptStr: promptStr,
        isOpen: true,
        textInputStr: name,
        callback: callback
    });
}

function let_user_name_layer (layer_name, callback) {

    var name = layer_name;

    // if no layer name was supplied, assume this is a selection
    if (!name) {
        name = selection_prefix;
    } else {
        name = name.trim();
    }

    // Start with a unique name as a suggestion
    name = exports.make_unique_name(name);

    // Keep asking the user for a name until it is unique or she cancels.
    function wasNamed (name) {

        // We're done if she cancels or gives an empty name.
        if (name === undefined || name === '') {
            callback();
            return;
        }

        // We're done if the name is unique.
        var unique_name = exports.make_unique_name(name);
        if (unique_name === name) {
            callback(name);
            return;
        }
     
        // Suggest another unique name
        ask_user_to_name_layer(unique_name, name, wasNamed);
    }
    
    ask_user_to_name_layer(name, undefined, wasNamed);
}

function load_dynamic_colormap (name, layer) {

    // Load the colormap for dynamic categorical or binary attributes.
    var cats = layer.uniqueVals,
        indexedCats;
    const hasOnly1and0s = (
        cats.length === 2
        && (
            (cats[0] === 0 || cats[0] === 1)
            && (cats[1] === 0 || cats[1] === 1)
        )
    );

    if (!_.isUndefined(layer.colormap)) {
    
        // Load the supplied colormap
        colormaps[name] = _.map(layer.colormap.cats, function (cat, i) {
            return {
                name: cat,
                color: new Color(layer.colormap.colors[i]),
                fileColor: new Color(layer.colormap.colors[i]),
            }
        });

        // Save the category index assignment.
        indexedCats = layer.colormap.cats;
    
    // If there are more that two categories or the categories are not ones
    // or zeros, this gets a generated colormap.
    } else if (cats.length > 2 || !hasOnly1and0s) {
        // Generate a colormap.
        var jpColormap = _.map(
            jPalette.jColormap.get('hexmap')(cats.length + 1).map,
            function (val, key) {
        
                // Ignore alpha, taking the default of one.
                return {r: val.r, g: val.g, b: val.b};
            }
        );
 
        // Remove the repeating red at the end.
        jpColormap.splice(cats.length, 1);
 
        // Load this generated colormap.
        colormaps[name] = _.map(jpColormap, function(color, i) {
            return {
                name: cats[i],
                color: Color(color), // operating color in map
                fileColor: Color(color), // color from orig file
            };
        });
     
        indexedCats = cats;
     
    } else {
    
        // Load the default binary colormap for binary non-string values
        // those whose values are all ones or zeroes.
        colormaps[name] = [];
    }
    
    if (indexedCats && !layer.reflection) {


        // Replace category string values with codes if needed.
        // Note: reflections are not loaded through here, but by the
        // reflections module.
        if (layer.hasStringVals) {
     
            // These categories have not yet been encoded so encode them.
            var vals = _.map(layer.data, function (strVal, key) {
                    return indexedCats.indexOf(strVal);
                }),
                keys = _.keys(layer.data);
            layer.data = _.object(keys, vals);
        }
    }
}

function find_dynamic_data_type(layer) {

    // Find the data type for a dynamic attribute.
    
 
    // If there are 2 or fewer unique values, this is binary.
    if (layer.uniqueVals.length < 3) {
        layer.dataType = 'binary';
 
    // If there are any strings, this is categorical.
    } else if (_.find(layer.uniqueVals, function (value) {
                return _.isNaN(parseFloat(value));
            })
        ) {
        layer.dataType = 'categorical';
 
    // Otherwise, this is continuous.
    } else {
        layer.dataType = 'continuous';
    }
    
}

function find_dynamic_values (layer) {

    // Find the good dynamic values and their count.

    // Drop any 'no values'.
    if (_.keys(layer.data).length > 0) {
    
        // Drop any nulls or values used to indicate no value.
        var drop = ['', '#N/A', '#N/A N/A', '#NA', '-1.#IND', '-1.#QNAN', 
            '-NAN', '1.#IND', '1.#QNAN', 'N/A', 'NA', 'NULL', 'NAN'];
        _.each(layer.data, function (val, key) {
            if ((_.isNull(val) || _.isUndefined(val) || _.isNaN(val)) ||
                (drop.indexOf(val.toString().toUpperCase()) > -1)) {
                delete layer.data[key];
            }
        });
    }

    // Set the count of values.
    layer.n = _.keys(layer.data).length;
}

function load_dynamic_data (layer_name, callback, dynamicLayers) {

    // Load dynamic data into the global layers object.
    var layer = dynamicLayers[layer_name],
        categories;
    layer.dynamic = true;
    
    // Find the good values and their count.
    find_dynamic_values(layer);
 
    // if there is data, load the dataType.
    if (layer.n > 0) {
    
        // Find the count of unique values in the data.
        layer.uniqueVals = _.keys(
            _.countBy(layer.data, function (value) {
                return value;
            })
        );
        
        // if no dataType was suppied or not continuous...
        if (!layer.dataType || layer.dataType !== 'continuous') {
            layer.hasStringVals = _.find(layer.uniqueVals,
                function (value) {
                    return _.isNaN(Number(value));
                });
        }

        // If no dataType supplied, go find it.
        if (!layer.dataType) {
            find_dynamic_data_type(layer);
        }
    } else {
    
        // There are no values in the data after dropping 'no value's, so
        // assign a dataType of continuous so a colormap will not be sought.
        layer.dataType = 'continuous';
    }
    
    // Add the layer to the appropriate dataType list.
    util.addToDataTypeList(layer_name, layer.dataType);
    // Leave the dataType in the layer obj, we use it in saving state.
    // If there are string values, or there is a colormap supplied...
    if (layer.hasStringVals || !_.isUndefined(layer.colormap)) {
        load_dynamic_colormap(layer_name, layer);
    } else {
        // This is continuous or binary of only 1 & 0,
        // so convert the values from strings to floats.
        var data = {};
        _.each(layer.data, function (val, key) {
            data[key] = Number(parseFloat(val));
        });
        layer.data = data;
    }
    
    // Remove layer meta data no longer needed.
    delete layer.colormap;
    delete layer.uniqueVals;
    delete layer.hasStringVals;

    // Save the layer object in the global layers object.
    layers[layer_name] = layer;
    
    // Recurse with the same callback to get metadata.
    exports.with_one(layer_name, callback);
}

function load_static_data (layer_name, callback, byAttrId) {

    // Download a static layer, then load into global layers and colormaps.
    // Go get it.
        
    // Don't request this data more than once.
    var layer = layers[layer_name];
    if (layer.status === 'dataRequested') {
        return;
    }
    layer.status = 'dataRequested';

    function layerReceived (layer_parsed) {
        var data = {};

        for (var j = 0; j < layer_parsed.length; j++) {
        
            // This is the label of the hexagon
            var label = layer_parsed[j][0];
            
            if (label === "") {
                // Skip blank lines
                continue;
            }
            
            // Store the values in the layer
            data[label] = parseFloat(layer_parsed[j][1]);
        }

        // Save the layer data in the global layers object.
        layer.data = data;
        layer.status = 'dataReceived';
        
        // If this is the primary active attr, and the colormap is loaded,
        // then refresh the colors.
        if (shortlist.get_active_coloring_layers().indexOf(layer_name) > -1 &&
            rx.get('init.colormapLoaded')) {
            colorMix.refreshColors();
        }

        // Now the layer has been properly downloaded, but it may not
        // have metadata. Recurse to get metadata.
        exports.with_one(layer_name, callback);
    }
    
    if (byAttrId) {
    
        // Get the attr values by ID (name).
        let url = 'http://127.0.0.1:5000' + '/attr/attrId/' + layer_name +
            '/mapId/' + ctx.project;
        fetch(url)
            .then(function(response) {
                if (response.ok) {
                    return response.text();
                }
                throw new Error(response.statusText);
            })
            .then(util.parseTsv)
            .then(layerReceived)
            .catch(function(error) {
                util.mapNotFoundNotify(
                    '(attrsByName:' + layer_name + '::'  + error.stack + ')');
            });
            
    } else { // get by attr index
        data.requestLayer(layer.dataId, { successFx: layerReceived })
    }
}

exports.loadInitialActiveLayers = function () {

    // Load the active layers that will be used to show the initial colors.
    
    var active = Session.get('active_layers'),
        loadedCount = 0;
    
    function loaded () {
        loadedCount += 1;
        if (loadedCount === active.length) {
            rx.set('init.activeAttrsLoaded');
        }
    }

    _.each(active, function (layerName) {
        
        // with_one() works better than with_many() during initialization.
        exports.with_one(layerName, loaded, Session.get('dynamic_attrs'), true);
    });
}

exports.make_unique_name = function (layer_name) {

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

exports.with_one = function (layer_name, callback, dynamicLayers, byAttrId) {
    // This is how you get layers, and allows for layers to be downloaded
    // dynamically.
    // @param layer_name: name of the layer of interest
    // @param callback: called with the layer object
    // @param dynamicLayers: dynamic layer info, optional
    // @param byAttrId: true means get by attrId rather than index, optional
    //
    // Note: if the layer is already in the shortlist there is no need
    // to call with_one, and we can reference the global layers array
    // directly.
 
    // First get what we have stored for the layer
    var layer = layers[layer_name];
    if (layer === undefined) {
        if (byAttrId || (dynamicLayers && layer_name in dynamicLayers)) {

            // Initial and dynamic layers are added to the global list here.
            layers[layer_name] = {};
            layer = layers[layer_name];
        } else {
    
            console.log('TODO layer: "' + layer_name +
                '" is not in the layers global.',
                "If this is a reflection layer, this is expected. Otherwise,",
                'try resetting to defaults.');
            console.trace();
            return;
        }
    }
    
    if (layer.data === undefined) {

        // This layer's data has not yet been loaded so load it.
        if (dynamicLayers && layer_name in dynamicLayers) {
            load_dynamic_data(layer_name, callback, dynamicLayers);
        } else {
            layer.dataType =  util.getDataType(layer_name)
            load_static_data(layer_name, callback, byAttrId);
        }

    } else if (layer.magnitude === undefined) {
     
        // We've downloaded it already, or generated it locally, but we
        // don't know the magnitude and it needs to be added to the
        // shortlist. Compute magnitude and add to the shortlist.
       
        // Grab the data, which we know is defined.
        var data = layer.data;
       
        // Store the maximum value
        var maximum = -Infinity;
        
        // And the minimum value
        var minimum = Infinity;
        
        for(var signature_name in data) {
            // Look at every value in the layer
            
            if(data[signature_name] > maximum) {
                // Take the value as new max if it's bigger than current one
                maximum = data[signature_name]
            }
            
            if(data[signature_name] < minimum) {
                // Similarly for new minimums
                minimum = data[signature_name]
            }
        }
        
        // Save the layer bounds for later for continuous layers.
        if (util.is_continuous(layer_name)) {
            layer.maximum = maximum;
            layer.minimum = minimum;
                colormaps[layer_name] = colorEdit.defaultContinuousColormap()
        }
        // Keep track of the unsigned magnitude.
        layer.magnitude = Math.max(Math.abs(minimum), maximum);

        if (!colorMix.have_colormap(layer_name) && util.is_binary(layer_name)) {
            // Add an empty colormap for this layer, so that 
            // auto-generated discrete colors will be used.
		        colormaps[layer_name] = colorEdit.defaultBinaryColorMap();
        }
     
        // Add this layer to the shortlist.
        shortlist.ui_and_list_add(layer_name);
        
        // Now layer metadata has been filled in. Call the callback.
        callback(layer);
    } else {

        // It's already downloaded, and already has metadata.
        // Pass it to our callback
        callback(layer);
    }
}

exports.with_many = function (layer_list, callback, dynamicLayers) {

    // Given an array of layer names, call the callback with an array of the
    // corresponding layer objects (objects from signatures to floats).
    // Conceptually it's like calling layer.with_one several times in a
    // loop, only because the whole thing is continuation-based we have to
    // phrase it in terms of recursion.
    //
    // @param layer_list an array of layer names to be added.
    // @param callback optional; call upon completion passing the array of
    //                 layer objects added
    // @param dynamicLayers an object of layer objects for dynamic layers
    //
    // TODO: If the layers are already in the shortlist there is no need
    // to call with_many because they are loaded before being added to the
    // shortlist. In this case we can reference the global layers array
    // directly.
    if(layer_list.length == 0) {
        // Base case: run the callback with an empty list
        callback([]);
    } else {
        // Recursive case: handle the last thing in the list
        exports.with_many(layer_list.slice(0, layer_list.length - 1),
            function(rest) {
            
            // We've recursively gotten all but the last layer
            // Go get the last one, and pass the complete array to our callback.
            exports.with_one(layer_list[layer_list.length - 1],
                function(last) {
            
                // Mutate the array. Shouldn't matter because it won't matter 
                // for us if callback does it.
                rest.push(last);
                
                // Send the complete array to the callback.
                callback(rest);
            
            }, dynamicLayers);
        }, dynamicLayers);
    }
}

exports.create_dynamic_category = function (nodeIds, values, new_layer_name) {
    // Given two arrays: one containing node IDs and one containing the
    // category names for those nodeIds, add a new categorical layer with
    // the gived layer name.
    
    if (nodeIds.length < 1) {
        userMsg.error(
            "No nodes had values, so an attribute will not be created.");
        return;
    }

    // Allow the user to change the suggested layer name.
    function named (name) {

        if (_.isUndefined(name)) {
            return;
        }
        
        // Create a data object using the category names.
        var data = _.object(nodeIds, values),
            dynLayer = {};
     
        // Add the layer.
        dynLayer[name] = {
            data: data,
            dataType: 'categorical',
            dynamic: true,
        };
        exports.with_one(name, function() {}, dynLayer);
    }
    
    let_user_name_layer(new_layer_name, named);
}

exports.create_dynamic_selection = function (nodeIds, new_layer_name) {

    // Given an array of node IDs, add a new binary layer containing ones
    // for those nodes and zeroes for the rest. So every node will have a
    // value in this new layer.
    //
    // new_layer_name is an optional parameter. If no name is passed,
    // "selection + #" will be suggested as the layer name.

    if (nodeIds.length < 1) {
        userMsg.error(
            "No nodes were selected, so an attribute will not be created.");
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

    // Allow the user to change the suggested layer name.
    function named (name) {
        if (_.isUndefined(name)) {
            return;
        }

        // Create most of the layer.
        var layer = {
            data: data,
            dataType: 'binary',
            dynamic: true,
            selection: true,
            positives: positives.length,
            
            // And how many have a value, which is all in this case
            n: _.keys(data).length
        }
     
        var dynLayers = {};
        dynLayers[name] = layer;
        
        exports.with_one(name, function(){}, dynLayers);
    }
    let_user_name_layer(new_layer_name, named);
}

exports.fill_metadata = function (container, layer_name) {

    // Empty the given jQuery container element, and fill it with layer metadata
    // for the layer with the given name.
    
        // Do some transformations to make the displayed labels make
        // more sense.
    var lookup = {
        n: "Values",
        positives: "Positives",
        clumpiness: "Density",
        p_value: "Single test p-value",
        correlation: "Correlation",
        adjusted_p_value: "BH FDR",
        leesL: "Lees L",
        rawLees: "Uncorrected Lees L",
        adjusted_p_value_b: "Bonferroni p-value",
    };

    // Empty the container.
    container.html("");
    var metadata = $('<table\>').addClass('layer-metadata');
    container.append(metadata);

    for(attribute in layers[layer_name]) {
        if (!lookup.hasOwnProperty(attribute)) {
     
            // Skip things we don't want to display
            continue;
        }
        // This holds the metadata value we're displaying
        var value = layers[layer_name][attribute];
        
        if(typeof value === "number" && isNaN(value)) {
            // If it's a numerical NaN (but not a string), just leave
            // it out.
            continue;
        }
        
        if(value == undefined) {
            // Skip it if it's not actually defined for this layer
            continue;
        }
        
        // If we're still here, this is real metadata.
        // Format it for display.
        var value_formatted;
        if (typeof value === "number") {
            if(value % 1 === 0) {
                // It's an int!
                // Display the default way
                value_formatted = value;
            } else {
                // It's a float!
                // Format the number for easy viewing
                value_formatted = value.toExponential(1);
            }
        } else {
            // Just put the thing in as a string
            value_formatted = value;
        }

        var klass = attribute;
        // Replace a boring short name with a useful long name
        attribute = lookup[attribute];
        var tr = $('<tr\>').css('margin-bottom', '-1em');
        var td = $('<td\>')
            .css('text-align', 'right')
            .text(attribute+':')
            .addClass(klass);
        tr.append(td);
        td = $('<td\>')
            .css('text-align', 'left')
            .text(value_formatted);
        tr.append(td);
        metadata.append(tr);
    }
}
