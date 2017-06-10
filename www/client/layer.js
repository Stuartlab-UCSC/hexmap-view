// layer.js
// Most of the code to handle the layer data.

var app = app || {};
(function (hex) { // jshint ignore: line
Layer = (function () { // jshint ignore: line

    var selection_prefix = 'Selection';
    
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
                            : 'Please provide a label for this new attribute.',
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
 
    function load_dynamic_colormap (name, layer, cats) {

        // Load the colormap for dynamic categorical or binary attributes.
        if ('colormap' in layer) {
        
            // Load the supplied colormap
            colormaps[name] = _.map(layer.colormap.cats, function (cat, i) {
                return {
                    name: cat,
                    color: new Color(layer.colormap.colors[i]),
                    fileColor: new Color(layer.colormap.colors[i]),
                }
            });

            // Replace category string values with indices
            var codedData = _.object(
                _.keys(layer.data),
                _.map(layer.data, function (strVal, key) {
                    return layer.colormap.cats.indexOf(strVal);
                })
            );
            layer.data = codedData;
            
        } else if (cats && cats.length) {
        
            // Generate a colormap
            var jpColormap = _.map(
                jPalette.ColorMap.get('hexmap')(cats.length + 1).map,
                function (val, key) {
            
                    // Ignore alpha, taking the default of one.
                    return {r: val.r, g: val.g, b: val.b};
                }
            );
         
            // Remove the repeating red at the end
            jpColormap.splice(cats.length, 1);
         
            // Load this generated colormap
            colormaps[name] = _.map(jpColormap, function(color, i) {
                return {
                    name: cats[i],
                    color: Color(color), // operating color in map
                    fileColor: Color(color), // color from orig file
                };
            });
         
            // Replace category string values with indices
            layer.data = _.object(
                _.keys(layer.data),
                _.map(layer.data, function (strVal, key) {
                    return cats.indexOf(strVal);
                })
            );

        } else {
        
            // The default binary colormap for non-string values
            colormaps[name] = [];
        }
        
        // Remove these that are no longer needed.
        delete layer.colormap;
    }

    function load_dynamic_data_type (name, layer) {
    
        // Load the data type for dynamic attributes.
        var uniqueVals,
            hasStrings;

        // Skip any layers with no values.
        
        if (_.keys(layer.data).length < 1) { return; }

        // Drop any nulls or values used to indicate no value.
        var drop = ['', '#N/A', '#N/A N/A', '#NA', '-1.#IND', '-1.#QNAN', 
            '-NAN', '1.#IND', '1.#QNAN', 'N/A', 'NA', 'NULL', 'NAN'];
        _.each(layer.data, function (val, key) {
            if (_.isNull(val) || _.isUndefined(val) || _.isNaN(val)) {
                delete layer.data[key];
            } else if (drop.indexOf(val.toString().toUpperCase()) > -1) {
                delete layer.data[key];
            }
        });
 
        // Set the count of values.
        layer.n = _.keys(layer.data).length;

        if (!('dataType' in layer)) {
        
            // Determine the data type since it was not supplied.
         
            // If they are any strings, this gets a colormap
            // and call it categorical for now. It may be binary.
            var aString = _.find(layer.data, function (value) {
                    return _.isNaN(parseFloat(value));
                });
            if (aString && aString.length > 0) {
                layer.dataType = 'categorical';
                hasStrings = true;
            }
         
            // Find the count of each unique value.
            uniqueVals = _.countBy(layer.data, function (value) {
                return value;
            });
         
            // If there are only two values, this is binary.
            if (Object.keys(uniqueVals).length < 3) {
                layer.dataType = 'binary';
         
            // If the type has not been assigned categorical,
            // then this must be continuous.
            } else if (layer.dataType !== 'categorical') {
                layer.dataType = 'continuous';
            }
        }
        
        // Add the layer name to the appropriate data type list,
        // and load a colormap if needed.
        if (layer.dataType === 'continuous') {
            ctx.cont_layers.push(name);
        } else {
        
            if (layer.dataType === 'categorical') {
                ctx.cat_layers.push(name);
            } else {
     
                // This is a binary attribute.
                ctx.bin_layers.push(name);
            }
            // Load the colormap for this attribute.
         
            // If the unique values have not been found yet, find them.
            if (!uniqueVals) {
         
                // Find the count of each unique value.
                uniqueVals = _.countBy(layer.data, function (value) {
                    return value;
                });
            }
         
            // If we have any (unique) values, load the colormap.
            if (uniqueVals) {
         
                // Are any of the values strings?
                var aString = _.find(layer.data, function (value) {
                    return _.isNaN(parseFloat(value));
                });
                var cats;
     
                // If there are any strings we'll use
                // these as categories in colormap generation.
                if (aString && aString.length > 0) {
                    cats = _.keys(uniqueVals);
                }
                load_dynamic_colormap(name, layer, cats);
            }
        }
    }
    
    function load_dynamic_data (layer_name, callback, dynamicLayers) {

        // Load dynamic data in memory.
        var layer = dynamicLayers[layer_name];
        layer.dynamic = true;
     
        // Find and save the dataType.
        load_dynamic_data_type(layer_name, layer);

        // Save the layer data in the global layers object.
        layers[layer_name] = layer;
        
        // Recurse with the same callback to get metadata.
        Layer.with_layer(layer_name, callback);
    }
    
    function load_static_data (layer_name, callback) {
      
        // Download a static layer, then load into global layers and colormaps.
        // Go get it (as text!)
        Meteor.call('getTsvFile', layers[layer_name].url, ctx.project,
            function (error, layer_parsed) {

            if (error) {
                projectNotFound(layers[layer_name].url);
                return;
            }

            // This is the layer we'll be passing out. Maps from
            // signatures to floats on -1 to 1.
            var data = {};

            for(var j = 0; j < layer_parsed.length; j++) {
                // This is the label of the hex
                var label = layer_parsed[j][0];
                
                if(label == "") {
                    // Skip blank lines
                    continue;
                }
                
                // Store the values in the layer
                data[label] = parseFloat(layer_parsed[j][1]);
            }
    
            // Save the layer data locally
            layers[layer_name].data = data;
 
            // Now the layer has been properly downloaded, but it may not
            // have metadata. Recurse with the same callback to get metadata.
            Layer.with_layer(layer_name, callback);
        });
    }

return { // Public methods

    with_layer: function (layer_name, callback, dynamicLayers) {
        // This is how you get layers, and allows for layers to be downloaded
        // dynamically.
        // @param layer_name name of the layer of interest
        // @param callback called with the layer object
        // @param dynamicLayers dynamic layer info
        //
        // Note: if the layer is already in the shortlist there is no need
        // to call with_layer, and we can reference the global layers array
        // directly.
     
        // First get what we have stored for the layer
        var layer = layers[layer_name];
        if (layer === undefined) {
            if (dynamicLayers && layer_name in dynamicLayers) {

                // Dynamic layers are added to the global list here.
                layers[layer_name] = {};
                layer = layers[layer_name];
            } else {
        
                console.log('TODO layer: "' + layer_name +
                    '" is not in the layers global.',
                    "If this is a reflection layer, this is expected. Otherwise,",
                    'try resetting to defaults.');
                console.trace();
                //console.log('### layers', Object.keys(layers));
                return;
            }
        }
		if (layer.data === undefined) {

            // This layer's data has not yet been loaded so load it.
            if (dynamicLayers && layer_name in dynamicLayers) {
                load_dynamic_data(layer_name, callback, dynamicLayers);
            } else {
                load_static_data(layer_name, callback);
            }

		} else if (layer.magnitude === undefined) {
         
		    // We've downloaded it already, or generated it locally, but we
		    // don't know the magnitude and it needs to be added to the
            // Shortlist. Compute magnitude and add to the shortlist.
		   
		    // Grab the data, which we know is defined.
		    var data = layers[layer_name].data;
		   
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
            if (Util.is_continuous(layer_name)) {
                layer.maximum = maximum;
                layer.minimum = minimum;
            }
		    // Keep track of the unsigned magnitude.
		    layer.magnitude = Math.max(Math.abs(minimum), maximum);
 
		    if (!have_colormap(layer_name) && Util.is_binary(layer_name)) {
		        // Add an empty colormap for this layer, so that 
		        // auto-generated discrete colors will be used.
		        colormaps[layer_name] = {};
		    }
         
            // Add this layer to the shortlist.
            Shortlist.ui_and_list_add(layer_name);
		    
		    // Now layer metadata has been filled in. Call the callback.
		    callback(layer);
		} else {
		    // It's already downloaded, and already has metadata.
		    // Pass it to our callback
		    callback(layer);
		}
    },

    with_layers: function (layer_list, callback, dynamicLayers) {
    
        // Given an array of layer names, call the callback with an array of the
        // corresponding layer objects (objects from signatures to floats).
        // Conceptually it's like calling Layer.with_layer several times in a
        // loop, only because the whole thing is continuation-based we have to
        // phrase it in terms of recursion.
        //
        // @param layer_list an array of layer names to be added.
        // @param callback optional; call upon completion passing the array of
        //                 layer objects added
        // @param dynamicLayers an object of layer objects for dynamic layers
        //
        // TODO: If the layers are already in the shortlist there is no need
        // to call with_layers because they are loaded before being added to the
        // shortlist. In this case we can reference the global layers array
        // directly.

        if(layer_list.length == 0) {
            // Base case: run the callback with an empty list
            callback([]);
        } else {
            // Recursive case: handle the last thing in the list
            Layer.with_layers(layer_list.slice(0, layer_list.length - 1),
                function(rest) {
                
                // We've recursively gotten all but the last layer
                // Go get the last one, and pass the complete array to our callback.
                Layer.with_layer(layer_list[layer_list.length - 1],
                    function(last) {
                
                    // Mutate the array. Shouldn't matter because it won't matter 
                    // for us if callback does it.
                    rest.push(last);
                    
                    // Send the complete array to the callback.
                    callback(rest);
                
                }, dynamicLayers);
            }, dynamicLayers);
        }
    },

    has: function (layer_name) {
        // Returns true if a layer exists with the given name, false otherwise.
        return layers.hasOwnProperty(layer_name);
    },

    create_dynamic_selection: function (nodeIds, new_layer_name) {
 
        // Given an array of node IDs, add a new binary layer containing ones
        // for those nodes and zeroes for the rest. So every node will have a
        // value in this new layer.
        //
        // new_layer_name is an optional parameter. If no name is passed,
        // "selection + #" will be suggested as the layer name.

        if (nodeIds.length < 1) {
            Util.banner('warn', "No nodes were selected.");
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
            
            Layer.with_layer(name, function(){}, dynLayers);
        }
 
        return (name);
    },

    fill_metadata: function (container, layer_name) {
        // Empty the given jQuery container element, and fill it with layer metadata
        // for the layer with the given name.
        
        // Empty the container.
        container.html("");
        var metadata = $('<table\>').addClass('layer-metadata');
        container.append(metadata);

        for(attribute in layers[layer_name]) {
            // Go through everything we know about this layer
            if(attribute === "data" || attribute === "url" ||
                attribute === "magnitude" || attribute === "minimum" ||
                attribute === "maximum" || attribute === "selection" ||
                attribute === "clumpiness_array" || attribute === "tags" ||
                attribute === "removeFx" || attribute === 'rank' ||
                attribute === "dynamic" || attribute === 'dataType') {
                
                // Skip things we don't want to display
                // TODO: Ought to maybe have all metadata in its own object?
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
  
            // Do some transformations to make the displayed labels make
            // more sense.
            lookup = {
                n: "Values",
                positives: "Positives",
                clumpiness: "Density",
                p_value: "Single test p-value",
                correlation: "Correlation",
                adjusted_p_value: "BH FDR",
                leesL: "Lees L",
                rawLees: "Uncorrected Lees L",
                adjusted_p_value_b: "Bonferroni p-value",
            }
            
            if (lookup[attribute]) {
 
                // Replace a boring short name with a useful long name
                attribute = lookup[attribute];
            }
            var tr = $('<tr\>').css('margin-bottom', '-1em');
            var td = $('<td\>')
                .css('text-align', 'right')
                .text(attribute+':');
            tr.append(td);
            td = $('<td\>')
                .css('text-align', 'left')
                .text(value_formatted);
            tr.append(td);
            metadata.append(tr);
        }
    },

    initArray: function  () {
        Meteor.call('getTsvFile', "layers.tab", ctx.project,
            function (error, parsed) {

            // Create a list of layer names ordered by their indices
            ctx.static_layer_names = new Array (Session.get('sortedLayers').length);

            if (error) {
                projectNotFound("layers.tab");
                return;
            }

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
                ctx.static_layer_names [index_value] = parsed[i][0];
             }
             Session.set('initedLayersArray', true);
        });
    },

    initDataTypes: function () {

        // Download Information on what layers are continuous and which are binary
        Meteor.call('getTsvFile', "Layer_Data_Types.tab", ctx.project,
            function (error, parsed) {;

            // This is an array of rows with the following content:
            //
            //	FirstAttribute		Layer6
            //	Continuous		Layer1	Layer2	Layer3 ...
            //	Binary	Layer4	Layer5	Layer6 ...
            //	Categorical	Layer7	Layer8	Layer9 ...
            //

            if (error) {
                projectNotFound("Layer_Data_Types.tab");
                return;
            }

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
            
            Session.set('initedLayerTypes', true);
        });
    },

    initIndex: function () {

        // Download the layer index
        Meteor.call('getTsvFile', "layers.tab", ctx.project,
            function (error, parsed) {;

            // Layer index is tab-separated like so:
            // name  file  N-hex-value  binary-ones  layout0-clumpiness  layout1-clumpiness  ...

            if (error) {
                projectNotFound("layers.tab");
                return;
            }

            // Initialize the layer list for sortable layers.
            var sorted = [];
            
            // Process each line of the file, one per layer.
            for (var i = 0; i < parsed.length; i++) {
                // Pull out the parts of the TSV entry
                // This is the name of the layer.
                var layer_name = parsed[i][0];
                
                if (layer_name == "") {
                    // Skip any blank lines
                    continue;
                }
                
                // This array holds the layer's clumpiness scores under each layout,
                // by index. A greater clumpiness score indicates more clumpiness.
                var layer_clumpiness = [];
                for(var j = 4; j < parsed[i].length; j++) {
                
                    // Each remaining column is the clumpiness score for a layout,
                    // in layout order.
                    // This is the layer's clumpiness score
                    layer_clumpiness.push(parseFloat(parsed[i][j]));
                }
                
                // Number of hexes for which the layer has values
                var n = parseFloat(parsed[i][2]);
                
                // Add this to the global layers object.
                layers[layer_name] = {
                
                    // The url from which to download this layers primary data.
                    url: ctx.project + parsed[i][1],
                    
                    n: n,
                    clumpiness_array: layer_clumpiness,
                    
                    // Clumpiness gets filled in with the appropriate value out
                    // of the array, so out having a current layout index.
                }
                
                // Save the number of 1s, in a binary layer only
                var positives = parseFloat(parsed[i][3]);
                if (!(isNaN(positives))) {
                    layers[layer_name].positives = positives;
                }
                
                // Add it to the sorted layer list.
                sorted.push(layer_name);
            }
            
            // Save sortable (not dynamic) layer names.
            Session.set('sortedLayers', sorted);
            Session.set('initedLayerIndex', true);
        });
    },
};
}());
})(app);
