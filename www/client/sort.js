// sort.js
// This contains the logic for retrieving the layout-aware and layout-ignore
// sort attribute stats

var app = app || {}; 

(function (hex) { 
    //'use strict';

    var computingText = 'Computing statistics now...',
        firstSort = true;

    function finalCompare(a, b) {
        console.log("default sort function is being called...");
        // After the other compares, do these last compares for all sorts.
        // Compare clumpiness,
        // then alphabetically by name if all else fails.

        // By clumpiness
        if(layers[a].clumpiness > layers[b].clumpiness) {
            // a has a higher clumpiness score, so put it first.
            return -1;
        } else if(layers[b].clumpiness > layers[a].clumpiness) {
            // b has a higher clumpiness score. Put it first instead.
            return 1;
        } else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
            // a has a clumpiness score and b doesn't, so put a first
            return -1;
        } else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
            // b has a clumpiness score and a doesn't, so put b first.
            return 1;
        }			

        // Use lexicographic ordering on the name
        return a.localeCompare(b);
    }

    function variableCompare(a, b, v) {

        // Compare the variable: 'v'

        if(layers[a][v] < layers[b][v]) {
            // a has a lower value, so put it first.
            return -1;
        } else if(layers[b][v] < layers[a][v]) {
            // b has a lower value. Put it first instead.
            return 1;
        } else if(isNaN(layers[b][v]) && !isNaN(layers[a][v])) {
            // a has a value and b doesn't, so put a first
            return -1;
        } else if(!isNaN(layers[b][v]) && isNaN(layers[a][v])) {
            // b has a value and a doesn't, so put b first.
            return 1;
        }
        return 0
    }

    function pValueCompare(a, b) {

        // Compare p_values, then do the final compare
        
        var result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function adjPvalueCompare(a, b) {

        // Compare adjusted_p_values, then do the final compare
        
        var result = variableCompare(a, b, 'adjusted_p_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function adjPvalueBcompare(a, b) {

        // Compare adjusted_p_value_bs, then do the final compare
        
        var result = variableCompare(a, b, 'adjusted_p_value_b');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function differentialCompare(a, b) {

        // Compare  differential values, then do the final compare
        
        var result = variableCompare(a, b, 'Differential');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function correlationCompare(a, b, pos) {

        // Compare correlation sign, then p-value, then do the final compare

        // Compare correlation signs with positives first or negatives first,
        // depending on pos, where true indicates positive, false negative
        var aSign = layers[a].correlation < 0 ? -1 : 1,
            bSign = layers[b].correlation < 0 ? -1 : 1;

        if (aSign < bSign && pos) {
            return 1;
        } else if (bSign < aSign && pos) {
            return -1
        } else if (aSign < bSign && !pos) {
            return -1;
        } else if (bSign < aSign && !pos) {
            return 1
        }

        // Compare p_values
        result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        // The final compare
        return finalCompare(a, b);
    }

    function positiveCorrelationCompare(a, b) {

        return correlationCompare(a, b, true);
    }

    function negativeCorrelationCompare(a, b) {

        return correlationCompare(a, b, false);
    }

    sort_layers = function  () {

        // Given an array of layer names, sort the array in place as we want
        // layers to appear to the user.

        /*
        The compare order of sorts:
        - sort options are optional and one of:
            - ignore layout: by p-value in ascending order: lesser value first
            - layout-aware positive: by positive correlation sign first, then p-value
            - layout-aware negative: by negative correlation sign first, then p-value
        - by clumpiness/density
        - alphabetically

        The compare functions return the usual values:
            <0 if A belongs before B
            >0 if A belongs after B
            0 if equal or their order doesn't matter
        */

        var type_value = Session.get('sort').type,
            layer_array = Session.get('sortedLayers');

        // If layers are not loaded yet, we have nothing to sort
        if (layer_array.length === 0) return;
 
        // If the user did not define a 'first layer', define it now.
        if (Session.equals('first_layer', undefined)) {
 
            // Use the first layer of the default sort as our 'first layer'
            layer_array.sort(finalCompare);
            Session.set('first_layer', layer_array[0]);
 
            // Now sort the way the user requested
            sort_layers();
        }

        if (type_value === "layout-aware-positive") {
            layer_array.sort(positiveCorrelationCompare);

        } else if (type_value === "layout-aware-negative") {
            layer_array.sort(negativeCorrelationCompare);

        } else if (type_value === "p_value") {
            layer_array.sort(pValueCompare);

        } else if (type_value === "adjusted_p_value") {
            layer_array.sort(adjPvalueCompare);

        } else if (type_value === "adjusted_p_value_b") {
            layer_array.sort(adjPvalueBcompare);

        } else if (type_value === "Differential") {
            layer_array.sort(differentialCompare);

        } else {
            // The default sort, by density/clumpiness
            layer_array.sort(finalCompare);

            // Move the 'First' attribute to the top of the sorted layers
            var first = Session.get('first_layer');
            layer_array.splice(layer_array.indexOf(first), 1);
            layer_array.unshift(first);
        }
        Session.set('sortedLayers', layer_array);
    };

    clearStats = function () {
        //ATTRDB
        // is going to be changed how?

        // Clear stats for each layer before updating with the new stats
        for (var layer_name in layers) {
            delete layers[layer_name].clumpiness;
            delete layers[layer_name].p_value;
            delete layers[layer_name].adjusted_p_value;
            delete layers[layer_name].adjusted_p_value_b;
            delete layers[layer_name].correlation;
            delete layers[layer_name].Differential;
         }
    };

    updateSortUi = function (type, text, focus_attr, opts) {
 
        // If we were computing dynamic stats,
        // include the elapsed time in the banner
        var elapsed = '';
        if (opts && opts.hasOwnProperty('startDate')
            && $("#banner").text() === computingText) {
            var endDate = new Date;
            elapsed = ' ('
                + Math.ceil((endDate.getTime() - opts.startDate.getTime()) / 1000)
                + ' secs)';
        }

        // Set the sort properties and update the UI to sort them
        if (type === 'default') {
            Session.set('sort', ctx.defaultSort());
            text = Session.get('sort').text;

        } else if (type === 'noStats') {
            text = 'None, due to no statistical results';
            Session.set('sort', {text: text, type: 'noStats',
                focus_attr: focus_attr, color: 'inherit', background: 'inherit'});
            banner('error', text);
        } else {

            Session.set('sort', {text: text, type: type,
                focus_attr: focus_attr, color: 'inherit', background: 'inherit'});
        }
        clearAllFilters();
        updateLonglist();
        Shortlist.update_shortlist_metadata();
 
        // Skip the banner on the first sort
        if (firstSort) {
            firstSort = false;
        } else {
            if (type !== 'noStats') {
                banner('info', 'Now sorted by ' + text + elapsed);
            }
        }
    }

    function cleanPvalue (val) {
        var clean = Number(val);
        if (_.isNaN(clean) || clean > 1 || clean < 0) {
            return 1;
        } else {
            return clean;
        }
    }

    function updateIgnoreLayout (parsed, focus_attr, lI, pI, apI, apbI) {

        // See if all of the adjusted p-values are NaN
        // where lI, pI, apI and apbI are the indices of the layer,
        //       p-value, adjusted p-value, adjusted p-value-b

        var count = 0,
            type = 'p_value',
            layer,
            p_value,
            adjusted_p_value,
            adjusted_p_value_b;
 
        // Find the type of sort
        if (!_.isUndefined(apI)) {
            type = 'adjusted_p_value';
            if (!_.isUndefined(apbI)) {
                type = 'adjusted_p_value_b';
            }
        }

        // This has adjusted p-values, are there are any actual values?
        if (type !== 'p_value') { //Duncan: We just set this to p_value above???
            var hasAny = _.find(parsed, function (line) {
                return !_.isNaN(Number(line[apI]));
            });

            // If there are no real values, treat this like a p-value sort
            //isOldFormat =_.isUndefined(hasAny);
            if (_.isUndefined(hasAny)) {
                type = p_value;
            }
            if (type === 'p_value') {
                banner('warn', 'All adjusted p-values were NaN, so displaying '
                    + 'and sorting by the single test p-value instead');
            }
        }
        
        if (type === 'adjusted_p_value') { //Duncan: We just set "type" to p_value above???
            var hasAny = _.find(parsed, function (line) {
                return !_.isNaN(Number(line[apbI]));
            });

            // If there are no real values, treat this like a p-value sort
            if (_.isUndefined(hasAny)) {
                type = p_value;
            }
            if (type === 'p_value') {
                banner('warn', 'All adjusted p-value-bs were NaN, so displaying '
                    + 'and sorting by the single test p-value instead');
            }
        }

        // Update each layer's p-value and maybe adjusted p-values
        for (var i = 0; i < parsed.length; i++) {
            layer = parsed[i][lI];
            p_value = parsed[i][pI];

            // Don't load if it is the focus layer so it won't show up in sort
            // Replace any NaNs with 1
            if (layer !== focus_attr) {
                layers[layer].p_value = cleanPvalue(p_value);

                if (type !== 'p_value') {
                    layers[layer].adjusted_p_value
                        = cleanPvalue(parsed[i][apI]);
                    if (type !== 'adjusted_p_value') {
                        layers[layer].adjusted_p_value_b
                            = cleanPvalue(parsed[i][apbI]);
                    }
                }
                count += 1;
            }
        }
        
        return {count: count, type: type};
    }

    function receive_ignore_layout_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for ignore-layout sort statistics
        var r = {};  // the object return containing type and count

        if (parsed[0].length === 4) {

            // This has 3 values, so is of the form:
            // [
            //      [layerName, p-value, adjusted-p-value, adjusted-p-value_b],
            //      [layerName, p-value, adjusted-p-value, adjusted-p-value_b],
            //      ...
            // ]

            r = updateIgnoreLayout(parsed, focus_attr, 0, 1, 2, 3);

        } else if (parsed[0].length === 3) {
            var second = parsed[0][1];
            if ($.isNumeric(second) || second === 'nan') {

                // This has 2 values so is of the form:
                // [
                //      [layerName, p-value, adjusted-p-value],
                //      [layerName, p-value, adjusted-p-value],
                //      ...
                // ]

                r = updateIgnoreLayout(parsed, focus_attr, 0, 1, 2);

            } else {

                // This is dynamic stats, old format, so is of the form:
                // [
                //      [layerName, layerName, p-value],
                //      [layerName, layerName, p-value],
                //      ...
                // ]
                // The first element of each row is the focus layer name
                // which we already know, so ignore it.

                r = updateIgnoreLayout(parsed, focus_attr, 1, 2);
            }
        } else {

            // This is pre-computed, old format, so it is of the form:
            // [
            //      [layerName1, layerName2, ...],
            //      [value1, value2, ...]
            // ]
            r.type = 'p_value';
            r.count = 0;
            var layer, p_value;
            for (var i = 0; i < parsed[0].length; i++) {
                layer = parsed[0][i],
                p_value = parsed[1][i];

                // Don't load if it is the focus layer so it won't show up in sort
                // Replace any NaNs with 1
                if (layer !== focus_attr) {
                    layers[layer].p_value = cleanPvalue(p_value);
                    r.count += 1;
                }
            }
        }

        // Now we're done loading the stats, update the sort properties
        var text = 'BH FDR by: ';
        if (r.count < 1) {
            updateSortUi('noStats');
        } else {
            if (r.type === 'p_value') {
                text = ' ';
            }
            text += focus_attr + ' (ignoring layout)';
            updateSortUi(r.type, text, focus_attr, opts);
        }
    }

    function receive_layout_aware_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for layout-aware sort statistics

        // We have layout-aware stats parsed in the form:
        // [
        //      [layerName, r-value, p-value, adjusted-p-value],
        //      [layerName, r-value, p-value, adjusted-p-value],
        //      ...
        // ]
        var count = 0;
        for (var i = 0; i < parsed.length; i++) {

            // First element of each row is the layer name
            // to which the selected layer is being compared against.
            //
            var compare_layer_name = parsed[i][0],
                r_value = Number(parsed[i][1]),
                p_value = cleanPvalue(parsed[i][2]);

            // Save the stats for this layer against the focus layer.
            if (p_value === 1) {
                r_value = 'NA';
            }
            layers[compare_layer_name].correlation = r_value;
            layers[compare_layer_name].p_value = p_value;

            // If there is an adjusted p-value, set it
            if (!_.isUndefined(parsed[i][3])) {
                layers[compare_layer_name].adjusted_p_value
                    = cleanPvalue(parsed[i][3]);
            }
            if (!_.isUndefined(parsed[i][4])) {
                layers[compare_layer_name].adjusted_p_value_b
                    = cleanPvalue(parsed[i][4]);
            }

            count += 1;
        }

        if (count > 0) {
            // Now we're done loading the stats, update the sort properties
            var corr = 'correlation',
                type = 'layout-aware-positive';
            if (opts.anticorrelated) {
                corr = 'anticorrelation';
                type = 'layout-aware-negative';
            }
            var text = 'Layout-aware ' + corr + ' with: ' + focus_attr;

            updateSortUi(type, text, focus_attr, opts);
        } else {
            updateSortUi('noStats');
        }
    }

    function receive_data (parsed, focus_attr, opts) {

        // Handle the response from the server for sort statistics

        if (opts.hasOwnProperty('layout')) {

            // Layout-aware stats
            receive_layout_aware_stats (parsed, focus_attr, opts)

        } else {

            // Layout-ignore stats or diff stats
            receive_ignore_layout_stats (parsed, focus_attr, opts)
        }
    }

    find_clumpiness_stats = function (layout) {

        // Reset the sort to the default of density

        // Clear the stats in the layers before loading new ones
        clearStats();

        // Set the clumpiness scores for all layers to the appropriate values for
        // the given layout index. Just pulls from each layer's clumpiness_array
        // field.
        var layer,
            count = 0,
            sortedLayers = Session.get('sortedLayers');
        for (var i = 0; i < sortedLayers.length; i += 1) {
            // For each layer
            
            // Get the layer object
            layer = layers[sortedLayers[i]];

            if (!_.isUndefined(layer) && !_.isUndefined(layer.clumpiness_array)) {

                // We have a set of clumpiness scores for this layer.
                // Switch the layer to the appropriate clumpiness score.
                if (!_.isNaN(layer.clumpiness_array[layout])) {
                    layer.clumpiness = layer.clumpiness_array[layout];
                    count += 1;
                }
            }
        }

        if (count > 0) {
            updateSortUi('default');
        } else {
            updateSortUi('none', 'No sort due to no density stats', 'none');
        }
    }

    gatherSelectionData = function (dynamicDataIn) {

        // Gather the data for user-selection attributes
        var dynamicData = {};
        if (!_.isUndefined(dynamicDataIn)) {
            dynamicData = dynamicDataIn;
        }
        var layer;
        _.each(layers, function (layer, layerName) {
            if (layer.selection) {
               dynamicData[layerName] = layer.data;
            }
        });

        return dynamicData;
    }

    getDynamicStats = function (focus_attr, opts) {

        // This is a dynamically-generated attribute or a request because
        // the stats were not precomputed

        // Set up common parameters between layout-aware and -ignore
        opts.layerA = focus_attr;
        opts.layerIndex = ctx.layer_names_by_index.indexOf(focus_attr);
        opts.directory = ctx.project;
        opts.tempFile = 'yes';
        opts.tsv = true;

        // Gather the data for user-selection attributes
        opts.dynamicData = gatherSelectionData(opts.dynamicData);

        opts.startDate = new Date();
        Meteor.call('pythonCall', 'statsDynamic', opts,
            function (error, result) {
                if (error) {
                    banner('error', error);
                    updateSortUi('noStats');
                } else if (typeof result === 'string'
                    && result.slice(0,5).toLowerCase() === 'error') {
                    banner('error', result);
                    updateSortUi('noStats');
                } else if (typeof result === 'string'
                    && result.slice(0,4).toLowerCase() === 'info') {
                    banner('info', result);
                    updateSortUi('noStats');
                } else {
                    receive_data(result, focus_attr, opts);
                }
            }
        );
    }

    function getPreComputedStats (filename, focus_attr, opts) {

        // Retrieve the precomputed stats file from the server

        // Clear the stats in the layers before loading new ones
        clearStats();

        print("Fetching " + filename);
        Meteor.call('getTsvFile', filename, ctx.project,
            function (error, parsed) {

            if (error || (typeof parsed === 'string' &&
                parsed.slice(0,5).toLowerCase() === 'error')) {
                computingTextDisplay();
                getDynamicStats(focus_attr, opts);
                return;
            }
            receive_data(parsed, focus_attr, opts);
        });
    }

    computingTextDisplay = function () {

        banner('info', computingText);
        Session.set('sort', {
            text: computingText, color: '#2E662C', background: '#D8EECE'});
    }

    get_layout_ignore_stats = function (focus_attr) {

        // Retrieve the layer's layout-ignore values

        // Clear the stats in the layers before loading new ones
        clearStats();

        // Save the data types lists to the options
        opts = {
            statsLayers: ctx.bin_layers.concat(ctx.cat_layers.concat(ctx.cont_layers)),
            binLayers: ctx.bin_layers,
            catLayers: ctx.cat_layers,
            contLayers: ctx.cont_layers,
        }

        if (layers[focus_attr].hasOwnProperty('selection')) {

            // This is a user-selection attribute
            computingTextDisplay();
            getDynamicStats(focus_attr, opts);

        } else {
            // This is a primary attribute, so check for pre-computed stats
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "stats_" + layer_index + ".tab";

            getPreComputedStats(filename, focus_attr, opts);
        }
    }

    get_diff_stats = function (focus_attr, focus_attr2) {

        // Calc the differential stats on the server

        // Clear the stats in the layers before loading new ones
        clearStats();

        var first = true,
            hexnames1,
            hexnames2,
            vals,
            fill,
            obj = {};
            diffData = {};

        // Create a new selection attribute from the one values of each layer
        _.each([focus_attr, focus_attr2], function (attr) {

            // Create an array which contains hexagon names where the value is
            //      one, and zero where the value is zero
            hexnames2 = _.map(layers[attr].data, function(val, name) {
                return (val > 0) ? name : 0;
            });

            // Filter out the zeros from the array to get an array of
            // hexagon names
            hexnames2 = _.filter(hexnames2, function (name) {
                return name !== 0;
            });

            // Create a zero- or one-filled array.
            if (first) {
                hexnames1 = [].concat(hexnames2); // a copy
                fill = 0;
                first = false;
            } else {
                fill = 1;
            }
            vals = Array.apply(null,
                Array(hexnames2.length)).map(Number.prototype.valueOf, fill);

            // Create an object of hexagon names as properties with the value
            // representing this user selection
            obj = _.object(hexnames2, vals);

            // Add these hexagons names and their values to a new object
            for (var name in obj) { diffData[name] = obj[name]; }
        });

        // If there are any overlapping hexagons between the two layers
        // we can't do this stat
        if (_.intersection(hexnames1, hexnames2).length > 0) {
            return 'Stats cannot be computed due to overlap of '
                + 'hexagons between the two attributes';
        }

        // Treat this as a selection layer and run it as layout-ignore stats
        computingTextDisplay();
        var diffLayer = focus_attr + ' & ' + focus_attr2;
        opts = {
            statsLayers: ctx.bin_layers.concat(ctx.cat_layers.concat(ctx.cont_layers.concat(diffLayer))),
            binLayers: ctx.bin_layers.concat(diffLayer),
            catLayers: ctx.cat_layers,
            contLayers: ctx.cont_layers,
            dynamicData: {},
        }
        opts.dynamicData[diffLayer] = diffData;
        getDynamicStats(diffLayer, opts);

        return undefined;
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {

        // Retrieve the layer's layout-aware values

        // Clear the stats in the layers before loading new ones
        clearStats();

       // Save the layout index and anticorrelated flag to the options
        var opts = {
            statsLayers: ctx.bin_layers,
            layout: layout_index,
            anticorrelated: anticorrelated,
        };

        if (layers[focus_attr].hasOwnProperty('selection')) {

            // This is a user-selection attribute
            computingTextDisplay();
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

