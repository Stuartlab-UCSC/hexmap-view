// layer.js
// Most of the code to handle the layer data.

var app = app || {};
(function (hex) { // jshint ignore: line
Layer = (function () { // jshint ignore: line

    function add_layer_url(layer_name, layer_url, attributes) {
        // Add a layer with the given name, to be downloaded from the given URL, to
        // the list of available layers.
        // Attributes is an object of attributes to copy into the layer.
        
        // Store the layer. Just keep the URL, since Layer.with_layer knows what to do
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
        var sorted = Session.get('sortedLayers').slice();
        sorted.push(layer_name);
        Session.set('sortedLayers', sorted);

        // Don't sort because our caller does that when they're done adding layers.

    }
return { // Public methods

    with_layer: function (layer_name_in, callback, try_count) {
        // This is how you get layers, and allows for layers to be downloaded
        // dynamically. 
        // Layer.has must return true for the given name.
        // Run the callback, passing it the layer (object from hex label/signature
        // to float) with the given name.

        if (!try_count) {try_count = 1}
     
        var layer_name = layer_name_in.slice();
     
        // First get what we have stored for the layer
        var layer = layers[layer_name];

        if (layer === undefined) {
            console.log('TODO layer is undefined for', layer_name,
                '. You may need to reset to defaults.');
            console.log('the below trace is for info only');
            console.trace();
            console.log('the above trace is for info only');
            return;
        }
		var data_val = layer.data;
		if(layer.data == undefined) {
		    // We need to download the layer.
		    print("Downloading \"" + layer.url + "\"");
		    
		    // Go get it (as text!)
            Meteor.call('getTsvFile', layer.url, ctx.project,
                function (error, layer_parsed) {

                if (error) {
                    projectNotFound(layer.url);
                    return;
                }

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
	 
		        // Now the layer has been properly downloaded, but it may not
		        // have metadata. Recurse with the same callback to get metadata.
		        Layer.with_layer(layer_name, callback);
		    });
		} else if(layer.magnitude == undefined || layer.minimum == undefined || 
		    layer.maximum == undefined) {
		    // We've downloaded it already, or generated it locally, but we
		    // don't know the min/max statistics. Compute them.
		   
		    // Grab the data, which we know is defined.
		    var layer_data = layers[layer_name].data;
		   
		    // Store the maximum value
		    var maximum = -Infinity;
		    
		    // And the minimum value
		    var minimum = Infinity;
		    
		    for(var signature_name in layer_data) {
		        // Look at every value in the layer
		        
		        if(layer_data[signature_name] > maximum) {
		            // Take the value as new max if it's bigger than current one
		            maximum = layer_data[signature_name]
		        }
		        
		        if(layer_data[signature_name] < minimum) {
		            // Similarly for new minimums
		            minimum = layer_data[signature_name]
		        }
		    }
		    
		    // Save the layer bounds for later.
		    layer.maximum = maximum;
		    layer.minimum = minimum;
		    // Keep track of the unsigned magnitude which gets used a lot.
		    layer.magnitude = Math.max(Math.abs(minimum), maximum);
 
		    if (!have_colormap(layer_name) && Util.is_binary(layer_name)) {
		        // Add an empty colormap for this layer, so that 
		        // auto-generated discrete colors will be used.
		        colormaps[layer_name] = {};
		    }
		    
		    // Now layer metadata has been filled in. Call the callback.
		    callback(layer);
		} else {
		    // It's already downloaded, and already has metadata.
		    // Pass it to our callback
		    callback(layer);
		}
    },

    with_layers: function (layer_list, callback) {
        // Given an array of layer names, call the callback with an array of the 
        // corresponding layer objects (objects from signatures to floats).
        // Conceptually it's like calling Layer.with_layer several times in a loop, only
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
                
                });
                
            });
           
        }
    },

    has: function (layer_name) {
        // Returns true if a layer exists with the given name, false otherwise.
        return layers.hasOwnProperty(layer_name);
    },

    fill_metadata: function (container, layer_name) {
        // Empty the given jQuery container element, and fill it with layer metadata
        // for the layer with the given name.
        
        // Empty the container.
        container.html("");

        var binaryCountsProcessed = false;
        for(attribute in layers[layer_name]) {
            // Go through everything we know about this layer
            if(attribute === "data" || attribute === "url" ||
                attribute === "magnitude" || attribute === "minimum" ||
                attribute === "maximum" || attribute === "selection" ||
                attribute === "clumpiness_array" || attribute === "tags" ||
                attribute === "removeFx" || attribute === 'rank' ||
                attribute === "dynamic" || attribute === 'datatype') {
                
                // Skip things we don't want to display
                // TODO: Ought to maybe have all metadata in its own object?
                continue;
            }
     
            var text;
            if ((attribute === 'positives' || attribute === 'n')
                && ctx.bin_layers.indexOf(layer_name) > -1) {
            
                // Special case these two attributes
                if (binaryCountsProcessed) continue;
     
                binaryCountsProcessed = true;
     
                var n = Number(layers[layer_name].n),
                    p = Number(layers[layer_name].positives),
                    hexCount = Object.keys(polygons).length;
     
                if (_.isNaN(n)) n = 0;
                if (_.isNaN(p)) p = 0;
     
                text = p + '/' + n + ' (' + (hexCount - n) + ' missing)';
     
                if (n > hexCount) {
                    console.log('bad metadata: layer, n, hexCount:',
                        layer_name, layers[layer_name].n, hexCount);
                }

            } else {  // process the usual attributes
     
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
                if (typeof value == "number") {
                    if(value % 1 == 0) {
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
     
                // Do a sanity check
                if (attribute === 'n'
                    && value_formatted > Object.keys(polygons).length) {
                    console.log('bad metadata: layer, n, hexCount:',
                        layer_name, layers[layer_name].n, Object.keys(polygons).length);
                }
     
                // Do some transformations to make the displayed labels make more sense
                lookup = {
                    n: "Non-empty values",
                    positives: "Number of ones",
                    inside_yes: "Ones in A",
                    outside_yes: "Ones in background",
                    clumpiness: "Density score",
                    p_value: "Single test p-value",
                    correlation: "Correlation",
                    adjusted_p_value: "BH FDR",
                    leesL: "Lees L",
                    rawLees: "Uncorrected Lees L",
                    adjusted_p_value_b: "Bonferroni p-value",
                }
                
                if (lookup[attribute]) {
     
                    if (lookup[attribute] === 'Number of ones') console.log(layer_name, value_formatted);
                    // Replace a boring short name with a useful long name
                    attribute = lookup[attribute];
                }
                text = attribute + " = " + value_formatted;
            }
            
            var metadata = $("<div\>").addClass("layer-metadata");
            metadata.text(text);
            
            container.append(metadata);
        }
    },

    initArray: function  () {
        Meteor.call('getTsvFile', "layers.tab", ctx.project,
            function (error, parsed) {

            // Create a list of layer names ordered by their indices
            ctx.layer_names_by_index = new Array (Session.get('sortedLayers').length);

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
                ctx.layer_names_by_index [index_value] = parsed[i][0];
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
                    positives: layer_positives, //if binary
                    n: layer_count,
                });

            }
            Session.set('initedLayerIndex', true);
        });
    },
};
}());
})(app);
