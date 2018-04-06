// This code is for future use and checked in to save it.


import '/imports/lib/color.js';
import colorEdit from '/imports/mapPage/color/colorEdit.js';
import hexagons from '/imports/mapPage/viewport/hexagons.js';
import Layer from '/imports/mapPage/longlist/Layer.js';
import legend from '/imports/mapPage/color/legend.js';
import rx from '/imports/common/rx.js';
import shortlist from '/imports/mapPage/shortlist/shortlist.js';
import util from '/imports/common/util.js';

exports.have_colormap = function (colormap_name) {
    // Returns true if the given string is the name of a colormap, or false if 
    // it is only a layer.

    return (colormap_name in colormaps)
};

function get_range_position(score, low, high) {
    // Given a score float, and the lower and upper bounds of an interval (which
    // may be equal, but not backwards), return a number in the range -1 to 1
    // that expresses the position of the score in the [low, high] interval.
    // Positions out of bounds are clamped to -1 or 1 as appropriate.
    
    // This holds the length of the input interval
    var interval_length = high - low;
    
    if(interval_length > 0) {
        // First rescale 0 to 1
        score = (score - low) / interval_length;
        
        // Clamp
        score = Math.min(Math.max(score, 0), 1);
            
        // Now re-scale to -1 to 1
        score = 2 * score - 1;
    } else {
        // The interval is just a point
        // Just use 1 if we're above the point, and 0 if below.
        score = (score > low)? 1 : -1
    }
    
    return score;
}

exports.get_color = function (layerName1, layerVal1, layerName2, layerVal2) {
    // Either layer value may be undefined (or both), in which case the no-data color
    // is returned. If a layer name is undefined, that layer dimension is
    // ignored.

    var color,
        base_color,
        hsv_value;

    // These are all cases we need to pay attention to.
    var onlyOneLayer = _.isUndefined(layerName2);

    var oneBinaryLayer = (
        onlyOneLayer &&
        util.is_binary(layerName1)
    );

    var oneContinuousLayer = (
        onlyOneLayer &&
        !oneBinaryLayer &&
        util.is_continuous(layerName1)
    );

    var oneCategoricalLayer = (
        onlyOneLayer &&
        !oneBinaryLayer &&
        !oneContinuousLayer
    );

    var bothContinuous = (
        !onlyOneLayer &&
        util.is_continuous(layerName1) &&
        util.is_continuous(layerName2)
    );

    var continuousAndCatOrBin =(
        !onlyOneLayer &&
        util.is_cat_or_bin(layerName2) &&
        util.is_continuous(layerName1)
    );

    var catOrBinAndContinous = (
        !onlyOneLayer &&
        !continuousAndCatOrBin &&
        util.is_cat_or_bin(layerName1) &&
        util.is_continuous(layerName2)
    );

    var catAndCatOrBin=(
        !onlyOneLayer &&
        util.is_categorical(layerName1) &&
        util.is_cat_or_bin(layerName2) ||
        util.is_categorical(layerName2) &&
        util.is_cat_or_bin(layerName1)
    );


    var bothLayersBinary = (
        util.is_binary(layerName1) && util.is_binary(layerName2)
    );

    var any_missing_values =(
        isNaN(layerVal1) ||
        isNaN(layerVal2) ||
        _.isUndefined(layerVal1) ||
        _.isUndefined(layerVal2)
    );

    var on = 1;
    var off = 0;

    if(continuousAndCatOrBin) {
        //Manipulate the ordering of arguments so an extra case is not needed.
        color = exports.get_color(layerName2, layerVal2, layerName1, layerVal1);

    } else if (any_missing_values) {
        color = colorEdit.noDataColor();

    } else if(oneBinaryLayer) {
        // User's choice from color map or default.
        if(layerVal1 === on) { // layerVal1 is 1
            color =  colorEdit.binaryOnColor(layerName1);
        } else if (layerVal1 === off) { // layerVal1 is 0
            color = colorEdit.binaryOffColor(layerName1);
        } else {
            throw "There was an error making the color of the binary layer"
        }

    } else if(bothLayersBinary) {
        // Special color scheme for two binaries,
        // always uses default, never choice from user.
        if(layerVal1 === on) {
            if(layerVal2 === on) {
                // Both are on
                return colorEdit.defaultBinBothOn();
            } else if (layerVal2 === off) {
                // Only the first is on
                return colorEdit.defaultBinaryOn();
            }
        } else if (layerVal1 === off) {
            if(layerVal2 === on) {
                // Only the second is on
                return colorEdit.defaultSecondBinOn();
            } else if (layerVal2 === off) {
                // Neither is on
                return colorEdit.defaultBinaryOff();
            }
        }

    } else if (oneCategoricalLayer) {
        base_color = baseCategoricalColor(layerName1, layerVal1);
        base_color.value(base_color.value());
        color = base_color.hexString();

    } else if (catAndCatOrBin) {
        base_color = baseCategoricalColor(layerName1, layerVal1);
        // Do discrete shades of second layer.
        // Calculate what shade we need from second layer value
        // We want 100 to be included (since that's full brightness), but we
        // want to skip 0 (since no color can be seen at 0), so we add 5 to
        // the second layer's value.
        var colorCountL2 = colorEdit.findColorCount(layerName2);
        hsv_value = (layerVal2 + 1) / colorCountL2 * 100;
        base_color.value(hsv_value);
        color = base_color.hexString()

    } else if (catOrBinAndContinous) {
        base_color = baseCategoricalColor(layerName1, layerVal1);
        // Calculate what shade we need from v on -1 to 1, with a minimum
        // value of 20 to avoid blacks.
        hsv_value = 60 + layerVal2 * 40;
        base_color.value(hsv_value);
        color = base_color.hexString()

    } else if(oneContinuousLayer) {
        // Sets the interpolation so the second color is not mixed.
        // Chooses the user's specified coloring or
        color = mixOneContinuous(layerName1, layerVal1)
    } else if (bothContinuous) {
        color = mix2Continuos(layerVal1, layerVal2)
    } else {
        throw "An error occurred when determining a nodes color."
    }

    return color;
};

function baseCategoricalColor(layerName, layerValue) {
    var base_color;
    if(colormaps[layerName].hasOwnProperty(layerValue)) {
        // And the colormap has an entry here. Use it as the base color.
        var to_clone = colormaps[layerName][layerValue].color;

        base_color = Color({
            hue: to_clone.hue(),
            saturation: to_clone.saturationv(),
            value: to_clone.value()
        });
    } else {
        // Something went wrong. This case catches when a value in the layer
        // doesn't have a colormap entry.
        // This conforms to the old code (since refactored),
        // which hid the error by skipping the category.
        base_color = Color({
            red : undefined,
            blue : undefined,
            green : undefined
        })
    }
    return base_color;
}

function mix (a, b, amount) {
    // Mix between the numbers a and b, where an amount of -1 corresponds to a,
    // and an amount of +1 corresponds to b.
    
    // Convert to 0 to 1 range.
    var i = (amount + 1) / 2;
    
    // Do the linear interpolation.
    return i * a + (1 - i) * b;
    
}

function mix2 (a, b, c, d, amount1, amount2) {
    // Mix between a and b (or c and d) on amount1, and then mix between the
    // results on amount2. Amounts are in range -1 to 1.
    
    return mix(mix(a, b, amount1), mix(c, d, amount1), amount2);
}

function parseColorPortions(hexStr){

    var portion_prefix = "0x";
    var red_portion = parseInt(portion_prefix + hexStr.slice(1,3));
    var green_portion = parseInt(portion_prefix + hexStr.slice(3,5));
    var blue_portion = parseInt(portion_prefix + hexStr.slice(5,7));

    return {
        "red" : red_portion,
        "green" : green_portion,
        "blue" : blue_portion,
    }

}

function colorify(red, green, blue){
    var color = "rgb(" + red + "," + green + "," + blue + ")";
    return color
}

function mixOneContinuous(layerName, layerValue){
    var ignoreValue = -1;
    var ignoreColor = 0;
    var highColor = colorEdit.continuousHighColor(layerName);
    var lowColor = colorEdit.continuousLowColor(layerName);
    var highColorParsed = parseColorPortions(highColor);
    var lowColorParsed = parseColorPortions(lowColor);

    var red = mix2(
        lowColorParsed["red"],
        highColorParsed["red"],
        ignoreColor, ignoreColor,
        -layerValue, -ignoreValue
    ).toFixed(0);

    var green = mix2(
        lowColorParsed["green"],
        highColorParsed["green"],
        ignoreColor, ignoreColor,
        -layerValue, -ignoreValue
    ).toFixed(0);

    var blue = mix2(
        lowColorParsed["blue"],
        highColorParsed["blue"],
        ignoreColor, ignoreColor,
        -layerValue, -ignoreValue
    ).toFixed(0);

    var color = colorify(red, green, blue);

    return color
}

function mix2Continuos(layerVal1, layerVal2){
    // Ignore color map entries.
    var highColor1 = colorEdit.defaultContHigh();
    var lowColor1 = colorEdit.defaultContLow();
    var lowColor1HighColor2 = colorEdit.defaultCont2High1Low();
    var bothHighColor = colorEdit.defaultContBothHigh();

    var high1Parsed = parseColorPortions(highColor1);
    var low1Parsed = parseColorPortions(lowColor1);
    var lowHighParsed = parseColorPortions(lowColor1HighColor2);
    var bothHighParsed = parseColorPortions(bothHighColor);

    var red = mix2(
        low1Parsed["red"],
        high1Parsed["red"],
        lowHighParsed["red"],
        bothHighParsed["red"],
        -layerVal1, -layerVal2
    ).toFixed(0);

    var green = mix2(
        low1Parsed["green"],
        high1Parsed["green"],
        lowHighParsed["green"],
        bothHighParsed["green"],
        -layerVal1, -layerVal2
    ).toFixed(0);

    var blue = mix2(
        low1Parsed["blue"],
        high1Parsed["blue"],
        lowHighParsed["blue"],
        bothHighParsed["blue"],
        -layerVal1, -layerVal2
    ).toFixed(0);

    var color = colorify(red, green , blue);

    return color
}

exports.colormapsReceived = function (parsed, id) {

    // Process downloaded color map information.
    for(var i = 0; i < parsed.length; i++) {
        // Get the name of the layer
        var layer_name = parsed[i][0];
        
        // Skip blank lines
        if(layer_name == "") {
            continue;
        }
        
        // This holds all the categories (name and color) by integer index
        var colormap = [];
     
        for(j = 1; j < parsed[i].length; j += 3) {
            // Store each color assignment.
            // Doesn't run if there aren't any assignments, leaving an empty
            // colormap object that just forces automatic color selection.
            
            // This holds the index of the category
            var category_index = parseInt(parsed[i][j]);
            
            // The colormap gets an object with the name and color that the
            // index number refers to. Color is stored as a color object.
            colormap[category_index] = {
                name: parsed[i][j + 1],
                color: Color(parsed[i][j + 2]), // operating color in map
                fileColor: Color(parsed[i][j + 2]), // color from orig file
            };
        }
        
        // Store the finished color map in the global object
        colormaps[layer_name] = colormap;
    }
    rx.set('init.colormapLoaded');
}

exports.colormapStateToOperating = function (stateColormap) {
    
    // Transform a layer's state colormap to an operating colormap.
    // TODO should this load defaults if needed?
    var operatingColormap = _.map(stateColormap.cats, function (cat, i) {
        var operCat = {
            name: cat,
            color: new Color(stateColormap.colors[i]),
        };
        operCat.fileColor = oper.color;
        return operCat;
    });
    return operatingColormap;
}

exports.colormapOperatingToState = function (operColormap) {

    // Transform a layer's operating colormap to a state colormap.
    // TODO should this only store non-defaults to state?
    var stateColormap = {
        cats: [],
        colors: [],
    };
    _.each(operColormap, function (cat, i) {
        stateColormap.cats.append();
        stateColormap.colors.append();
    });
    return stateColormap;
}

exports.saveReplacedColorsToState = function () {
}

