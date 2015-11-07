// statsSort.js
// The logic for retrieving the sort attribute stats ignoring layout.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    getSortStats = function (layer_name, binary, categorical) {
        // @param layer_name: the focus attribute
        // @param binary: true: compare focus attr against binary attrs, false: not
        // @param categorical: true: compare focus attr against categorical attrs, false:not
        // @ returns: nothing



        // For testing, lets assume this is a user-created attribute
        //if (layers[layer_name].selection) {

            // This is a user-created attribute
            Meteor.call('callPython', layer_name, function (err, response) {
                console.log(response);
                // TODO handle error
            });

        //}
        return;
        



        // So far we only support combinations of binary and categorical values,
        // which use the chi-squared method.
        var layer_index = ctx.layer_names_by_index.indexOf(layer_name);
        var file = ctx.project + "layer_" + layer_index + "_sstats.tab";
        $.get(file, function(tsv_data) {
        
            // This is two rows, of this form:
            //
            //	Layer1	Layer2	Layer 3 ...
            //	value	value	value   ...

            // Parse the file
            var parsed = $.tsv.parseRows(tsv_data);

            if (fileNotFound(parsed[0][0])) {
                banner("error", "Layout independent (Sample-based) stats were not precomputed!");
                return;
            }

            var row_header = parsed[0],
                layer_index = row_header.indexOf(layer_name),
                stats_values = parsed[1],
                compare_layer;

            for (var i = 0; i < row_header.length; i++){
                compare_layer = row_header[i];
                if ((binary && ctx.bin_layers.indexOf(compare_layer) >= 0)
                        || (categorical && ctx.cat_layers.indexOf(compare_layer) >= 0)) {
                    value = parseFloat(stats_values[i]);
                    layers[compare_layer].p_value = value;
                }
            }
            Session.set('sort',
                {text: "Stats w/out layout by: " + layer_name, type: 'default'})
            update_browse_ui();
            update_shortlist_ui();
        }, "text");
    }
})(app);

    //function getSortStats(layer_name, single_stat, drop_down_val, layer_names) {
        // @param layer_name: the focus attribute name
        // @param single_stat: true: requesting only one value from the query, false: more values
        //                     Currently unused.
        // @param drop_down_val: 1: compare to other continuous values
        //                       0: compare to other binary values
        //                       Currently unused.
        // @param layer_names: only used if not single_stat
        //                     Currently unused.
        // @ returns: nothing

        // Download the Association Statistics file and fill in values for
        // Each layer depending on the layer_name
        // e.g. fill all pearson correlation values from tests ran between
        // layer_name and all other layers
        
        // TODO: rewrite in terms of with_association_stats

        // If single_stat == true, then the user is only requesting one value 
        // from the query.
    /* Not supporting single value compair nor continuous values yet
        if (single_stat == false) {

            // Determine if the selected layer has continuous or binary data values
            var continuous_type = false;

            // Determine if the selected layer has continuous or binary data values
            layer_index = ctx.cont_layers.indexOf(layer_name);
            if (layer_index >= 0) {
                continuous_type = true;
            }
            // drop_down_val == 1, indicates that the user wants to compare
            // the selected attribute to other continuous values
            if (drop_down_val == 1 && continuous_type == true) {
                layer_index = ctx.layer_names_by_index.indexOf(layer_name);
                $.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	Layer1	Layer2	Layer 3...
                    //	value	value	value
                    //
                    // Parse the file

                    var parsed = $.tsv.parseRows(tsv_data);
                    row_header = parsed[0];
            
                    stats_values = parsed[1];

                    for (var i = 0; i < row_header.length; i++){
                        compare_layer_name = row_header[i];
                        value = parseFloat(stats_values[i]);
                        layers[compare_layer_name].r_value = value;			
                    }

                }, "text")
                .done(function() {
                    Session.set('sort',
                    {text: "Stats w/layout in terms of: " + layer_name, 
                    type: "r_value"})
                    update_browse_ui();

                })
                .fail(function() {
                    banner("error", "Association Stats Weren't Precomputed!");
                });
            }
        }
    */

    /* Not supporting single value compare:
        // For Stats Query
        if (single_stat == true) {
            // Determine if layer 1 has continuous or binary data values
            var layer1_cont = false
            layer_index = ctx.cont_layers.indexOf(layer_names[0]);
            if (layer_index > 0) {
                layer1_cont = true;
            }

            // Determine if layer 2 has continuous or binary values
            var layer2_cont = false
            layer_index = ctx.cont_layers.indexOf(layer_names[1]);
            if (layer_index > 0) {
                layer2_cont = true;
            }
            
            // Look in Continuous_Continuous file if they are both Continuous
            if (layer1_cont == true & layer2_cont == true) {
                layer_index = ctx.layer_names_by_index.indexOf(layer_names[0])
                $.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	id		Layer1	Layer2	Layer 3...
                    //	Layer1	value	value	value
                    //	Layer2	value	value	value
                    //	Layer3	value	value	value
                    //
                    // Parse the file

                    var parsed = $.tsv.parseRows(tsv_data);	
                    var row_header = parsed[0];
                    var layer2_index = row_header.indexOf(layer_names[1]);	
                    stats_value = parsed[1][layer2_index];	

                }, "text")
                .done(function() {

                })
                .fail(function() {
                    banner("error", "Association Stats Weren't Precomputed!");
                });

                var type = "R-Coefficient: ";
                return type;
            }		

            // Look in chi2 files if both are binary
            if (layer1_cont == false & layer2_cont == false) {
            
            $.get(ctx.project + layer_names[0] + "_sstats.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	id		Layer1	Layer2	Layer 3...
                    //	Layer1	value	value	value
                    //	Layer2	value	value	value
                    //	Layer3	value	value	value
                    //
                    // Parse the file

                    parsed = $.tsv.parseRows(tsv_data);	
                    row_header = parsed[0];
                    layer2_index = row_header.indexOf(layer_names[1]);	
                    stats_value = parsed[1][layer2_index];	
                
                }, "text")
                .done(function() {

                })
                .fail(function() {
                    banner("error", "Association Stats Weren't Precomputed!");
                });

                var type = "P-Value: ";
                return type;
            }
            
        }
    */
