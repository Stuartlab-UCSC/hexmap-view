// mutualInfo.js
// This contains the logic for retrieving the mutual information stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function with_association_stats(layer_name, callback) {
        // Download the association statistics values for the given layer against
        // TODO all other continuous or binary layers, as appropriate, and call the
        // callback with an object from layer name to statistic value. The statistic
        // is a p value from a chi-squared test (of some description) for binary
        // & categorical layers, and an r correlation value for continuous layers.
        
        // Get the layer index
        layer_index = oper.layer_names_by_index.indexOf(layer_name);

        // We let the UI control which value types are supported for assoc stats
        // or mutual info stats.

        if(oper.bin_layers.indexOf(layer_name) != -1
                && oper.cat_layers.indexOf(layer_name) != -1) {

            // It's a binary or categorical layer. Get the layer file
            var filename = ctx.project + "layer_" + layer_index + "_chi2.tab";

        } else if(oper.cont_layers.indexOf(layer_name) != -1) {

            // It's a continuous layer. Get the layer file
            var filename = ctx.project + "layer_" + layer_index + "_pear.tab";
        }
            
        $.get(filename, function(tsv_data) {        
            // This is an array of rows, which are arrays of values:
            //
            //    Layer1	Layer2	Layer 3...
            //    value	value	value
            //
            // Parse the file

            var parsed = $.tsv.parseRows(tsv_data);
            row_header = parsed[0];

            stats_values = parsed[1];
            
            // Make an object to fill with the stat values by layer name
            var stat_values = {};

            for (var i = 0; i < row_header.length; i++){
                // Parse all the other layer names and the values against them.
                compare_layer_name = row_header[i];
                value = parseFloat(stats_values[i]);
                
                // Populate the object to call back with
                stat_values[compare_layer_name] = value;			
            }
            
            // Call the callback
            callback(stat_values);

        }, "text")
    }

    function get_stats(layer_names, parsed) {
    //function get_stats(layer_names, layer_stats, parsed) { // TODO layer stats are never passed in
            // Given an object from layer name to layer statistic (p
            // value for binary, ...), update the
            // mutual_information fields on the layers that, according
            // to the statistics, are anticorrelated with this one. If
            // layer_stats is undefined, just updates all layers.
                
            // Seems like parsed.length is picking up an extraneous line
            // Debugger states that there is an extra element ""
            // (nothing)
            for (var i = 0; i < parsed.length - 1; i++) {
                // First element of each row is the layer name
                // to which the selected layer is being compared against.
                var compare_layer_name = parsed[i][0];
                // Extract the value - 2nd element of each row 
                var value = parseFloat(parsed[i][1]);

                /* TODO layer stats are never passed in
                if(layer_stats) {
                
                    if(!layer_stats.hasOwnProperty(compare_layer_name)) {
                        // Skip anything we haven't heard of. TODO: We
                        // could probably safely keep anything we never
                        // calculated a correlation for.
                        continue;
                    }
                    
                    // We need to check if this layer passed the filter,
                    // and continue otherwise.
                    
                    // Grab the stat value
                    var stat = layer_stats[compare_layer_name];
                    
                    if(oper.bin_layers.indexOf(layer_names[0]) != -1) {
                        // We're doing a binary layer. Reject anything
                        // with a significant score. TODO: Is this just
                        // going to throw out anticorrelated things as
                        // well as correlated things?
                        if(stat < 0.05) {
                            // Skip anything significantly chi-squared
                            // to this layer.
                            continue;
                        }
                    } else if(oper.cont_layers.indexOf(layer_names[0]) !=
                        -1) {
                        
                        // We're doing a continuous layer. Reject
                        // anything with a non-negative correlation.
                        if(stat >= 0) {
                            continue;
                        }
                    }
                }
                */

                // Set the mutual information for this layer against the 
                // focus layer.
                layers[compare_layer_name].mutual_information = value;
            }

            // Now we're done getting the MIs, update the UI
              oper.current_sort_text = "Region-base ranked in terms of: " + layer_names[0];
            //oper.current_sort_text = "(LA) Attributes Ranked According to: " + layer_names[0];
            update_browse_ui("mutual_information");
            
            // Save the parameters we were called with, so we can be called
            // again if someone changes the layout. TODO: This is a massive
            // hack.
            oper.mutual_information_ranked = true;
            //mutual_information_sorted_against [0] = layer_names[0]; // TODO unused
            //mutual_information_filtered = anticorrelated; // TODO unused
            
        }

    function rank_query(layer_names, parsed, anticorrelated) {
        // TODO what does this have to do with pos vs neg correlation?
            
        if (anticorrelated) {
            // Restrict to anticorrelated layers (of the same type). Go
            // get a dict from layer name to p value with this layer,
            // and pass it to the callback defined above.
            with_association_stats(layer_names[0], get_stats)

        } else {  // positively correlated
            // TODO help says only layers that are significantly anticorrelated
            // No restrictions. Call the callback directly on undefined.
            get_stats(layer_names, parsed);
        }
    }

    get_mutual_information_statistics = function (layout_number, layer_names, query_type, anticorrelated) {
        // Retrieve the appropriate mutual information values
        // TODO and return either a sorted list or a specific value, via alert box.
        // All mutual information values are stored in files of the format
        // "mi_<layout_number>_<layer_number>.tab".
        // If anticorrelated is true, only updates anticorrelated layers.
        // TODO the help says only for layers that are significantly
        // anticorrelated with the focus attribute, and the same type as the
        // focus attribute. Focus attribute may not have category or label (yes/no) values.

        // First we must retrieve the file indices for the respective layer_names.
        
        var layer_indices = [];
        
        for (var i = 0; i < layer_names.length; i++) {
            // Go get the index for each layer we asked for.
            layer_index = oper.layer_names_by_index.indexOf(layer_names[i]);
            layer_indices.push(layer_index);
        }
        
        // What file should we get?
        // Open up the file mi_<layout_number>_<layer_indices[0]>.tab
        var filename = ctx.project + "mi_"+ layout_number + "_"+ layer_indices[0] +".tab";
        print("Fetching " + filename);

        // query_type = 'rank' indicates a rank query
        // Column 1 is a list of layer/attribute names
        // Column 2 is a list of mutual information values
        // Assign the mutual information values to the layer elements
        // When this done, update the browse ui via the mutual information
        // sort.
        $.get(filename, function(tsv_data) {
         
            // Parsed object contains mutual information stats       
            var parsed = $.tsv.parseRows(tsv_data);

            rank_query(layer_names, parsed, anticorrelated);

        }, "text")
        .fail(function() {
            if (query_type === 'rank') {
                complain("Mutual Information Stats Were Not Pre-Computed!");

                // $("#ranked-against").text("(MI) Attributes Ranked According to: " + layer_names[0]);
                // var ranked_against_label = document.getElementById("ranked-against").style.visibility="hidden";
            }
        });
    }
})(app);

