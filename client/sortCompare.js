// sortCompare.js
// This contains the logic for the compares used in sorts

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    /*
        The compare order of sorts:
        - by selection or not, with selections first
        - sort options are optional and one of:
            - ignore layout: by p-value in ascending order
            - layout-aware positive: by positive correlation sign first, then p-value
            - layout-aware negative: by negative correlation sign first, then p-value
        - by clumpiness/density
        - by frequency of less common value, binary only
        - alphabetically

        The compare functions return the usual values:
            <0 if A belongs before B
            >0 if A belongs after B
            0 if equal or their order doesn't matter
    */

    function selectionsCompare(a, b) {

        // Selections are always first in the final list
        
        if(layers[a].selection && !layers[b].selection) {
            // a is a selection and b isn't, so put a first.
            return -1;
        } else if(layers[b].selection && !layers[a].selection) {
            // b is a selection and a isn't, so put b first.
            return 1;
        }
        return 0;
    }

    function finalCompare(a, b) {

        // After the other compares, do these last compares for all sorts.
        // Compare clumpiness,
        // then the frequency of the less common value
        //      (for binary layers that are not selections)
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

        // Are both layers binary, not selections, and have positives?
        if(!layers[a].selection && !isNaN(layers[a].positives) && layers[a].n > 0
            && !layers[b].selection && !isNaN(layers[b].positives) && layers[b].n > 0) {
            
            // Compute the frequency of the least common value for each layer
            // This will be <= 1/2
            var minor_frequency_a = layers[a].positives / layers[a].n;
            if(minor_frequency_a > 0.5) {
                minor_frequency_a = 1 - minor_frequency_a;
            }
            var minor_frequency_b = layers[b].positives / layers[b].n;
            if(minor_frequency_b > 0.5) {
                minor_frequency_b = 1 - minor_frequency_b;
            }

            if(minor_frequency_a > minor_frequency_b) {
                // a is more evenly split, so put it first
                return -1;
            } else if(minor_frequency_a < minor_frequency_b) {
                // b is more evenly split, so put it first
                return 1;
            } 

        } else if (!layers[a].selection && !isNaN(layers[a].positives) && 
            layers[a].n > 0) {
            
            // a is a binary layer we can nicely sort by minor value frequency, but
            // b isn't. Put a first so that we can avoid intransitive sort cycles.
            
            // Example: X and Z are binary layers, Y is a non-binary layer, Y comes
            // after X and before Z by name ordering, but Z comes before X by minor
            // frequency ordering. This sort is impossible.
            
            // The solution is to put both X and Z in front of Y, because they're
            // more interesting.
            
            return -1;
        
        } else if (!layers[b].selection && !isNaN(layers[b].positives) && 
            layers[b].n > 0) {
            
            // b is a binary layer that we can evaluate based on minor value
            // frequency, but a isn't. Put b first.
            
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

    // TODO unused
    function rValueFullCompare(a, b) {

        // Compare selections, then r_values, then do the final compare

        var result = selectionsCompare(a, b);
        if (result !== 0) return result

        result = variableCompare(a, b, 'r_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function clumpinessCompare(a, b) {

        // This is the least complex sort
        // Compare selections, then do the final compare

        var result = selectionsCompare(a, b);
        if (result !== 0) return result

        return finalCompare(a, b);
    }

    function pValueFullCompare(a, b) {

        // Compare selections, then p_values, then do the final compare
        
        var result = selectionsCompare(a, b);
        if (result !== 0) return result;

        result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function correlationCompare(a, b, pos) {

        // Compare selections, then correlation sign,
        // then p-value, then do the final compare

        var result = selectionsCompare(a, b);
        if (result !== 0) return result

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

        result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function correlationFullCompare(a, b) {

        return correlationCompare(a, b, true);
    }

    function anticorrelationCompare(a, b) {

        return correlationCompare(a, b, false);
    }

    sort_layers = function (layer_array) {

        // Given an array of layer names, sort the array in place as we want
        // layers to appear to the user.

        var type_value = Session.get('sort').type;

        if (layer_array.length === 0) return;

        if (type_value == "layout-aware-positive") {
            layer_array.sort(correlationFullCompare);

        } else if (type_value == "layout-aware-negative") {
            layer_array.sort(anticorrelationCompare);

        } else if (type_value == "p-value") {
            layer_array.sort(pValueFullCompare);

        } else {
            // The default sort, by density/clumpiness
            layer_array.sort(clumpinessCompare);
            
            if (!_.isUndefined(ctx.first_layer)) {

                // move the 'First' attribute to the top
                layer_array.splice(layer_array.indexOf(ctx.first_layer), 1);
                layer_array.unshift(ctx.first_layer);
            }
        }
    }
})(app);
