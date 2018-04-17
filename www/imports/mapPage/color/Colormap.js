// Handle the global colormaps and color constants.

import rx from '/imports/common/rx';
import '/imports/lib/color'; // source of 'Color'
import util from '/imports/common/util';

// Some color constants
var BINARY_BOTH_ON_DARK_BG = '#00FF00',
    BINARY_BOTH_ON_LIGHT_BG = '#AA00AA',
    BINARY_BOTH_OFF_DARK_BG = '#404040',
    BINARY_BOTH_OFF_LIGHT_BG = '#c0c0c0',
    BINARY_1ST_ON_DARK_BG = '#ffff00',  // second is off
    BINARY_1ST_ON_LIGHT_BG = '#ff0000',
    BINARY_2ND_ON = '#0000ff',          // first is off

    CONTINUOUS_HIGH_DARK_BG = BINARY_1ST_ON_DARK_BG,
    CONTINUOUS_HIGH_LIGHT_BG  = BINARY_1ST_ON_LIGHT_BG,
    CONTINUOUS_LOW_DARK_BG = BINARY_BOTH_OFF_DARK_BG,
    CONTINUOUS_LOW_LIGHT_BG  = BINARY_BOTH_OFF_LIGHT_BG,

    CONTINUOUS2_BOTH_HIGH_DARK_BG = BINARY_BOTH_ON_DARK_BG,
    CONTINUOUS2_BOTH_HIGH_LIGHT_BG = BINARY_BOTH_ON_LIGHT_BG,
    CONTINUOUS2_2ND_HIGH_DARK_BG = BINARY_2ND_ON, // first is low
    CONTINUOUS2_2ND_HIGH_LIGHT_BG  = CONTINUOUS2_2ND_HIGH_DARK_BG,

    DISABLED = '#aaaaaa', // not for colormap, but for some disabled widgets
    NO_ATTRS = 'cyan',
    NO_DATA_DARK_BG = '#303030',
    NO_DATA_LIGHT_BG = '#E0E0E0';

exports.disabled = function () {
    // Not for colormap, but for some disabled widgets/
    return DISABLED;
};

exports.defaultContLow = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS_LOW_LIGHT_BG : CONTINUOUS_LOW_DARK_BG ;
};

exports.defaultContHigh = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS_HIGH_LIGHT_BG : CONTINUOUS_HIGH_DARK_BG;
};

exports.defaultContBothHigh = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS2_BOTH_HIGH_LIGHT_BG : CONTINUOUS2_BOTH_HIGH_DARK_BG;
};

exports.defaultCont2High1Low = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS2_2ND_HIGH_LIGHT_BG : CONTINUOUS2_2ND_HIGH_DARK_BG;
};

exports.defaultBinaryOff = function () {
    return (Session.equals('background', 'white')) ?
        BINARY_BOTH_OFF_LIGHT_BG : BINARY_BOTH_OFF_DARK_BG;
};

exports.defaultBinaryOn = function () {
    return (Session.equals('background', 'white')) ?
        BINARY_1ST_ON_LIGHT_BG : BINARY_1ST_ON_DARK_BG;
};

exports.defaultBinBothOn = function () {
    return (Session.equals('background', 'white')) ?
        BINARY_BOTH_ON_LIGHT_BG : BINARY_BOTH_ON_DARK_BG;
};

exports.defaultSecondBinOn = function () {
    return BINARY_2ND_ON;
};

exports.noDataColor = function () {
    return (Session.equals('background', 'white')) ?
        NO_DATA_LIGHT_BG : NO_DATA_DARK_BG;
};

exports.noAttrsColor = function () {
    return NO_ATTRS;
};

/*
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
};

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
};
*/

exports.have_colormap = function (colormap_name) {
    // Returns true if the given string is the name of a colormap, or false if
    // it is only a layer.

    return (colormap_name in colormaps);
};

exports.getCategoryString = function(layerName, layerValue) {
    return colormaps[layerName][layerValue].name;
};

exports.received = function (parsed) {

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
     
        for(var j = 1; j < parsed[i].length; j += 3) {
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
};

exports.colormapToState = function (colorVals) {

    // Convert one attr colormap into a form that state can save.
    var cats = _.map(colorVals, function(val) {
            return val.name;

        }),
        colors = _.map(colorVals, function(val) {
            return val.color.hexString();
        });
    return {cats: cats, colors: colors};
};

exports.findColorCount = function (layer_name) {
    // Find the number of colors for this layer. Continuous values and
    // undefined layer_names are assigned a count of zero.
    var nColors = 0;

    if (util.is_cat_or_bin(layer_name)) {
        var colormap = colormaps[layer_name];
        if (colormap.length > 0) {

            // Categorical values
            nColors = colormap.length;
        }
    }
    return nColors;
};

exports.continuousLowColor = function(layerName) {
    // Get's the low color for a continuous attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        low = 0;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][low].color.hexString();
    } else {
        colormaps[layerName] = exports.defaultContinuousColormap();
        color =  colormaps[layerName][low].color.hexString();
    }
    return color;
};

exports.continuousHighColor = function(layerName) {
    // Get's the high color for a continuous attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        high = 1;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][high].color.hexString();
    } else {
        colormaps[layerName] = exports.defaultContinuousColormap();
        color =  colormaps[layerName][high].color.hexString();
    }
    return color;
};

exports.binaryOffColor = function(layerName) {
    // Get's the off color for a binary attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        off = 0;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][off].color.hexString();
    } else {
        colormaps[layerName] = exports.defaultBinaryColorMap();
        color =  colormaps[layerName][off].color.hexString();
    }
    return color;
};

exports.binaryOnColor = function(layerName) {
    // Get's the on color for a binary attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        on = 1;

    if (colormaps[layerName]) {
        color =  colormaps[layerName][on].color.hexString();
    } else {
        colormaps[layerName] = exports.defaultBinaryColorMap();
        color =  colormaps[layerName][on].color.hexString();
    }
    return color;
};

exports.defaultBinaryColorMap = function () {
    var defaultColormap = [
        {
            "color": new Color(exports.defaultBinaryOff()),
            "fileColor": new Color(exports.defaultBinaryOff()),
            "name": "0",
        },
        {
            "color": new Color(exports.defaultBinaryOn()),
            "fileColor": new Color(exports.defaultBinaryOn()),
            "name": "1",
        }
    ];
    return defaultColormap;
};

exports.defaultContinuousColormap = function () {
    var defaultColormap = [
        {
            "color": new Color(exports.defaultContLow()),
            "fileColor": new Color(exports.defaultContLow()),
            "name": "Low",
        },
        {
            "color": new Color(exports.defaultContHigh()),
            "fileColor": new Color(exports.defaultContHigh()),
            "name": "High",
        }
    ];
    return defaultColormap;
};


