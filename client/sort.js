// sort.js
// This contains the logic for retrieving the layout-aware and layout-ignore
// sort attribute stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var computingText = 'Computing statistics now...';

    clearStats = function () {

        // Clear stats for each layer before updating with the new stats
        for (var layer_name in layers) {
            delete layers[layer_name].clumpiness;
            delete layers[layer_name].p_value;
            delete layers[layer_name].correlation;
         }
    }

    updateUi = function (type, text, focus_attr, opts) {

        // If we were computing dynamic stats,
        // include the elapsed time in the banner
        var elapsed = '';
        if (opts && opts.hasOwnProperty('startDate')
            && $("#banner").text() === computingText) {
            var endDate = new Date;
            elapsed = ' ('
                + Math.ceil((endDate.getTime() - opts.startDate.getTime()) / 1000)
                + ' seconds)';
        }

        // Set the sort properties and update the UI to sort them
        if (type === 'default') {
            Session.set('sort', ctx.defaultSort());
            text = Session.get('sort').text;
        } else {
            Session.set('sort', {text: text, type: type, focus_attr: focus_attr});
        }
        update_browse_ui();
        update_shortlist_ui();
        banner('info', 'Now sorted by ' + text + elapsed);
    }

    function updateLayerPvalue (focus_attr, layer, p_value) {

        // We don't want to load the p-value if it is the focus layer.
        // This will keep the focus attribute out of the sort.
        if (layer !== focus_attr && !isNaN(p_value)) {
            layers[layer].p_value = parseFloat(p_value);
        }
    }

    function receive_ignore_layout_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for ignore-layout sort statistics

        if (parsed.length === 2 && parsed[0].length > 3) {

            // This is from a pre-computed file, so it is of the form:
            // [
            //      [layerName1, layerName2, ...],
            //      [value1, value2, ...]
            // ]
            for (var i = 0; i < parsed[0].length; i++) {
                updateLayerPvalue(focus_attr, parsed[0][i], parsed[1][i]);
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
                updateLayerPvalue(focus_attr, compare_layer_name, parsed[i][2]);
            }

        }
        // Now we're done loading the stats, update the sort properties
        var type = 'p-value',
            text = 'P-value by: ' + focus_attr + ' (ignoring layout)';
        if (Session.get('sort').text === computingText) {
            var endDate = new Date,
                elapsed = (endDate.getTime() - opts.startDate.getTime()) / 1000;
            text += '(' + elapsed + ' seconds)';
        }

        updateUi(type, text, focus_attr, opts);
    }

    function receive_layout_aware_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for layout-aware sort statistics

        // We have layout-aware stats parsed in the form:
        // [
        //      [layerName1, r-value1, p-value1],
        //      [layerName2, r-value2, p-value2],
        //      ...
        // ]
        for (var i = 0; i < parsed.length; i++) {

            // First element of each row is the layer name
            // to which the selected layer is being compared against.
            var compare_layer_name = parsed[i][0],
                r_value = parseFloat(parsed[i][1]),
                p_value = parseFloat(parsed[i][2]);

            // Save the stats for this layer against the focus layer.
            if (!isNaN(r_value) && !isNaN(p_value)) {
                layers[compare_layer_name].correlation = r_value;
                layers[compare_layer_name].p_value = p_value;
            }
        }

        // Now we're done loading the stats, update the sort properties
        var corr = 'correlation',
            type = 'layout-aware-positive';
        if (opts.anticorrelated) {
            corr = 'anticorrelation';
            type = 'layout-aware-negative';
        }
        var text = 'Layout-aware ' + corr + ' with: ' + focus_attr;

        updateUi(type, text, focus_attr, opts);
    }

    function receive_data (parsed, focus_attr, opts) {

        // Handle the response from the server for sort statistics

        // Clear the stats in the layers before loading new ones
        clearStats();

        if (opts.hasOwnProperty('layout')) {
            receive_layout_aware_stats (parsed, focus_attr, opts)
        } else {
            receive_ignore_layout_stats (parsed, focus_attr, opts)
        }
    }

    find_clumpiness_stats = function (layout) {

        // Reset the sort to the default of density
        clearStats();

        // Set the clumpiness scores for all layers to the appropriate values for
        // the given layout index. Just pulls from each layer's clumpiness_array
        // field.
        var layer;
        for (var i = 0; i < ctx.layer_names_sorted.length; i++) {
            // For each layer
            
            // Get the layer object
            layer = layers[ctx.layer_names_sorted[i]];
            
            if (!_.isUndefined(layer.clumpiness_array)) {

                // We have a set of clumpiness scores for this layer.
                // Switch the layer to the appropriate clumpiness score.
                layer.clumpiness = layer.clumpiness_array[layout];
            }
        }

        updateUi('default');
    }

    getDynamicStats = function (focus_attr, opts) {

        // This is a dynamically-generated attribute or a request because
        // the stats were not precomputed

        // Set up common parameters between layout-aware and -ignore
        opts.layerA = focus_attr;
        opts.layerIndex = ctx.layer_names_by_index.indexOf(focus_attr);
        opts.directory = ctx.project;
        opts.proxPre = Session.get('proxPre');

        // Gather the data for user-selection attributes
        opts.dynamicData = {};
        var layer;
        for (var i = 0; i < ctx.bin_layers.length; i++) {
            layer = ctx.bin_layers[i];
            if (layers[layer].selection) {
                opts.dynamicData[layer] = layers[layer].data;
            }
        }

        opts.startDate = new Date();
        Meteor.call('pythonCall', 'statsSortLayer', opts,
            function (error, result) {
                if (error) {
                    banner('error', error);
                } else if (result.slice(0,5) === 'Error') {
                    banner('error', result);
                } else if (result.slice(0,4) === 'Info') {
                    banner('info', result);
                } else {
                    receive_data(JSON.parse(result), focus_attr, opts);
                }
            }
        );
    }

    getPreComputedStats = function (filename, focus_attr, opts) {

        // Retrieve the precomputed stats file from the server
        print("Fetching " + filename);

        $.get(filename, function(tsv_data) {

            var parsed = tsvParseRows(tsv_data);

            if (fileNotFound(parsed[0][0])) {
                banner('stay', computingText);
                getDynamicStats(focus_attr, opts);
                return;
            }
            receive_data(parsed, focus_attr, opts);
        }, "text");
    }

    get_layout_ignore_stats = function (focus_attr, bin, cat, cont) {

        // Retrieve the layer's layout-ignore values

        // Save the data types lists to the options
        opts = {
            statsLayers: [],
        }
        if (bin) {
            opts.binLayers = ctx.bin_layers;
            opts.statsLayers = opts.statsLayers.concat(ctx.bin_layers);
        }
        if (cat) {
            opts.catLayers = ctx.cat_layers;
            opts.statsLayers = opts.statsLayers.concat(ctx.cat_layers);
        }
        if (cont) {
            opts.contLayers = ctx.cont_layers;
            opts.statsLayers = opts.statsLayers.concat(ctx.cont_layers);
        }

        if (layers[focus_attr].selection) {

            // This is a user-selection attribute
            banner('stay', computingText);
            getDynamicStats(focus_attr, opts);

        } else {
            // This is a primary attribute, so check for pre-computed stats
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "stats_" + layer_index + ".tab";

            getPreComputedStats(filename, focus_attr, opts);
        }
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {

        // Retrieve the layer's layout-aware values

        // Save the layout index and anticorrelated flag to the options
        var opts = {
            statsLayers: ctx.bin_layers,
            layout: layout_index,
            anticorrelated: anticorrelated,

        };

        if (layers[focus_attr].selection) {

            // This is a user-selection attribute
            banner('stay', computingText);
            getDynamicStats(focus_attr, opts);

        } else {
            // This is a primary attribute, so check for pre-computed stats
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "statsL_"+ layer_index + "_" +
                    layout_index + ".tab";

            getPreComputedStats(filename, focus_attr, opts);
        }
    }
})(app);

