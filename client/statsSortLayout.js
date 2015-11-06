// statsSortlayout.js
// This contains the logic for retrieving the layout-aware sort attribute stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
    function rank_query(layer_names, parsed, focus_attr, anticorrelated) {

            for (var i = 0; i < parsed.length; i++) {
                // First element of each row is the layer name
                // to which the selected layer is being compared against.
                var compare_layer_name = parsed[i][0];
                // Extract the value - 2nd element of each row 
                var value = parseFloat(parsed[i][1]);
                
                // Set the mutual information for this layer against the 
                // focus layer.
                layers[compare_layer_name].correlation = value;
            }

            // Now we're done getting the MIs, update the UI
            var corr = 'correlation',
                type = 'region-based-positive';
            if (anticorrelated) {
                corr = 'anticorrelation';
                type = 'region-based-negative';
            }

        var text = 'Stats w/layout by ' + corr + ' with: ' + focus_attr
        Session.set('sort', {text: text, type: type});
        update_browse_ui();
        update_shortlist_ui();
    }

    function getNonPrecomputedStats () {
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {
        // Retrieve the appropriate layout-aware values
        // @param layout_index: layout index of the current layout
        // @param anticorrelated: true: sort with anticorrelated values at the top
        //                        false: sort with correlated values at the top

        // All layout-aware stats values are stored in files of the format
        // "layer_<layer_index>_<layout_index>_rstats.tab".

        if (layers[focus_attr].selection) {

            // This is a user-created attribute or a request because
            // the stats were not precomputed

            // Set up the parameters
            var parm = {
                layerA: focus_attr,
                layerIndex: ctx.layer_names_by_index.indexOf(focus_attr),
                layout: layout_index,
                directory: ctx.project,
                statsLayers: ctx.bin_layers,
            };

            // Set up the dynamic attr data parameters
            parm.dynamicData = {};
            for (var i = 0; i < ctx.bin_layers.length; i++) {
                layer = ctx.bin_layers[i];
                if (layers[layer].selection) {
                    parm.dynamicData[layer] = layers[layer].data;
                }
            }

            var layer_names = ctx.bin_layers;

            Meteor.call('pythonCall', 'statsSortLayoutLayer', parm,
                function (err, response) {
                    // TODO handle error

                    // Handle the response
                    rank_query(layer_names, JSON.parse(response), focus_attr, anticorrelated);
                    //console.log(response)
                }
            );
        } else {

            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr);

            // What file should we get?
            var filename = ctx.project + "layer_"+ layer_index + "_" + layout_index + "_rstats.tab";
            print("Fetching " + filename);

            $.get(filename, function(tsv_data) {

                var parsed = tsvParseRows(tsv_data);

                if (fileNotFound(parsed[0][0])) {
                    if (query_type === 'rank') {
                        complain("Layout Aware Stats Were Not Pre-Computed, computing stats for this layer now.");
                    }
                    return;
                }

                rank_query(layer_names, parsed, focus_attr, anticorrelated);

            }, "text");
        }
    }
})(app);

