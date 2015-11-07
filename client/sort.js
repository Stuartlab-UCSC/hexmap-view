// statsSortlayout.js
// This contains the logic for retrieving the layout-aware sort attribute stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function updateUi (text, type, focus_attr) {
        // TODO clear all focus-attr-related stats before displaying new
        Session.set('sort', {text: text, type: type, focus_attr: focus_attr});
        update_browse_ui();
        update_shortlist_ui();
        banner('info', 'Now sorted by ' + text);
     }

    function query_response (parsed, focus_attr, opts) {

        // Handle the response from the server for sort statistics
        if (opts.hasOwnProperty('layout_index')) {

            // We have layout-aware stats
            for (var i = 0; i < parsed.length; i++) {

                // First element of each row is the layer name
                // to which the selected layer is being compared against.
                var compare_layer_name = parsed[i][0];

                // Extract the value - 2nd element of each row 
                var value = parseFloat(parsed[i][1]);
                
                // Set the value for this layer against the focus layer.
                layers[compare_layer_name].correlation = value;
            }

            // Now we're done loading the stats, update the UI
            var corr = 'correlation',
                type = 'region-based-positive';
            if (opts.anticorrelated) {
                corr = 'anticorrelation';
                type = 'region-based-negative';
            }
            var text = 'Layout-aware ' + corr + ' with ' + focus_attr
        } else {

            // We have stats without layout
        }

        updateUi(text, type, focus_attr);
    }

    getNonPrecomputedStats = function (focus_attr, opts) {

        // This is a dynamically-generated attribute or a request because
        // the stats were not precomputed

        // Set up the parameters

        var anticorrelated = null,
            parm = {
                layerA: focus_attr,
                layerIndex: ctx.layer_names_by_index.indexOf(focus_attr),
                directory: ctx.project,
                statsLayers: ctx.bin_layers,
            };

        if (opts.hasOwnProperty('layout_index')) {
            parm.layout = opts.layout_index;
        }

        if (opts.hasOwnProperty('anticorrelated')) {
            anticorrelated = opts.anticorrelated;
        }

        // Set up the data parameter for any dynamically-generated attributes
        parm.dynamicData = {};
        for (var i = 0; i < ctx.bin_layers.length; i++) {
            layer = ctx.bin_layers[i];
            if (layers[layer].selection) {
                parm.dynamicData[layer] = layers[layer].data;
            }
        }

        var layer_names = ctx.bin_layers; // TODO handle more when ignoring layout

        Meteor.call('pythonCall', 'statsSortLayoutLayer', parm,
            function (error, result) {
                if (result.slice(0,5) === 'Error') {
                    banner('error', result);
                } else {
                    query_response(JSON.parse(result), focus_attr, opts);
                    //console.log(result)
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
                    + focus_attr + ' computing now...');
                getNonPrecomputedStats(focus_attr, opts);
                return;
            }
            query_response(parsed, focus_attr, opts);
        }, "text");
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {

        // Retrieve the layer's layout-aware values

        // Populate the options for layout-aware stats
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
                filename = ctx.project + "layer_"+ layer_index + "_" +
                    layout_index + "_rstats.tab";

            get_stats(filename, focus_attr, opts);
        }
    }
})(app);

