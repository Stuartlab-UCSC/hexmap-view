// statsSortlayout.js
// This contains the logic for retrieving the layout-aware and layout-ignore
// sort attribute stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function clearStats() {

        // Clear stats for each layer before updating with the new stats
        for (var layer_name in layers) {
            delete layers[layer_name].p_value;
            delete layers[layer_name].correlation;
         }
    }

    function updateUi (type, text, focus_attr) {

        // Set the sort properties and update the UI to sort them
        Session.set('sort', {text: text, type: type, focus_attr: focus_attr});
        update_browse_ui();
        update_shortlist_ui();
        banner('info', 'Now sorted by ' + text);
    }

    function query_response (parsed, focus_attr, opts) {

        // Handle the response from the server for sort statistics

        // Clear the stats in the layers before loading new ones
        clearStats();

        if (opts.hasOwnProperty('layout_index')) {

            // We have layout-aware stats parsed in the form:
            // [
            //      [layerName1, r-value1, p-value1],
            //      [layerName2, r-value2, p-value2],
            //      ...
            // ]
            for (var i = 0; i < parsed.length; i++) {

                // First element of each row is the layer name
                // to which the selected layer is being compared against.
                var compare_layer_name = parsed[i][0];

                // Extract the r-value, 2nd element of each row
                var r_value = parseFloat(parsed[i][1]);
                
                // Extract the p-value, 3rd element of each row
                var p_value = parseFloat(parsed[i][2]);
                
                // Set the value for this layer against the focus layer.
                layers[compare_layer_name].correlation = r_value;
                layers[compare_layer_name].p_value = p_value;
            }

            // Now we're done loading the stats, update the sort properties
            var corr = 'correlation',
                type = 'region-based-positive';
            if (opts.anticorrelated) {
                corr = 'anticorrelation';
                type = 'region-based-negative';
            }
            var text = 'Layout-aware ' + corr + ' with: ' + focus_attr;
        } else {

            // We have stats ignoring layout:
            if (parsed.length === 2 && parsed[0].length > 3) {

                // This is from a pre-computed file, so it is of the form:
                // [
                //      [layerName1, layerName2, ...],
                //      [value1, value2, ...]
                // ]
                for (var i = 0; i < parsed[0].length; i++) {

                    // Extract the layer name and value
                    layers[parsed[0][i]].p_value = parseFloat(parsed[1][i]);
                }
            } else {

                // These stats were not pre-computed, so it is of the form:
                // [
                //      [layerName1, layerName2, value2],
                //      [layerName1, layerName3, value3],
                //      ...
                // ]
                // The first element of each row is the focus layer name
                // which we already know, so ignore it.
                for (var i = 0; i < parsed.length; i++) {

                    // Extract the layer name
                    // to which the selected layer is being compared against.
                    var compare_layer_name = parsed[i][1];

                    // Extract the value
                    layers[compare_layer_name].p_value = parseFloat(parsed[i][2]);
                }

            }
            // Now we're done loading the stats, update the sort properties
            var type = 'default',
                text = 'P-value by: ' + focus_attr + ' (ignoring layout)';
        }

        updateUi(type, text, focus_attr)
    }

    getNonPrecomputedStats = function (focus_attr, opts) {

        // This is a dynamically-generated attribute or a request because
        // the stats were not precomputed

        // Set up the parameters
        var parm = {
                layerA: focus_attr,
                layerIndex: ctx.layer_names_by_index.indexOf(focus_attr),
                directory: ctx.project,
                statsLayers: ctx.bin_layers,
            };

        // Set up the data parameter for any dynamically-generated attributes
        parm.dynamicData = {};
        for (var i = 0; i < ctx.bin_layers.length; i++) {
            layer = ctx.bin_layers[i];
            if (layers[layer].selection) {
                parm.dynamicData[layer] = layers[layer].data;
            }
        }

        Meteor.call('pythonCall', 'statsSortLayer', parm,
            function (error, result) {
                if (error) {
                    banner('error', error);
                    console.log(error);
                } else if (result.slice(0,5) === 'Error') {
                    banner('error', result);
                    console.log(error);
                } else {
                    query_response(JSON.parse(result), focus_attr, opts);
                }
            }
        );
    }

    get_stats = function (filename, focus_attr, opts) {
        print("Fetching " + filename);

        $.get(filename, function(tsv_data) {

            var parsed = tsvParseRows(tsv_data);

            if (fileNotFound(parsed[0][0])) {
                banner('info', 'Statistics were not pre-computed for '
                    + focus_attr + '. Just a moment...');
                getNonPrecomputedStats(focus_attr, opts);
                return;
            }
            query_response(parsed, focus_attr, opts);
        }, "text");
    }

    get_layout_ignore_stats = function (focus_attr, bin, cat, cont) {

        // Retrieve the layer's layout-ignore values

        // Save the data type flags to the options
        opts = {
            bin: bin,
            cat: cat,
            cont: cont,
        }

        if (layers[focus_attr].selection) {

            // This is a dynamically-generated attribute
            getNonPrecomputedStats(focus_attr, opts);

        } else {
            // This is a primary attribute
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "stats_" + layer_index + ".tab";

            get_stats(filename, focus_attr, opts);
        }
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {

        // Retrieve the layer's layout-aware values

        // Save the layout index and anticorrelated flag to the options
        var opts = {
            layout_index: layout_index,
            anticorrelated: anticorrelated,
        };

        if (layers[focus_attr].selection) {

            // This is a dynamically-generated attribute
            getNonPrecomputedStats(focus_attr, opts);

        } else {
            // This is a primary attribute
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "statsL_"+ layer_index + "_" +
                    layout_index + ".tab";

            get_stats(filename, focus_attr, opts);
        }
    }
})(app);

