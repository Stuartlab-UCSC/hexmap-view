// Handle the colormaps and color constants.

import rx from '/imports/common/rx';
import '/imports/lib/color'; // source of 'Color' object
import jPalette from '/imports/lib/jPalette';
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

exports.have_colormap = function (colormap_name) {

    // Returns true if the given string is the name of a colormap, or false if
    // it is only a layer.
    return (colormap_name in colormaps);
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
        colormaps[layerName] = exports.defaultContinuous();
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
        colormaps[layerName] = exports.defaultContinuous();
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
        colormaps[layerName] = exports.defaultBinary();
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
        colormaps[layerName] = exports.defaultBinary();
        color =  colormaps[layerName][on].color.hexString();
    }
    return color;
};

exports.defaultBinary = function () {
    var defaultColormap = [
        {
            "color": new Color(exports.defaultBinaryOff()),
            "name": "0",
        },
        {
            "color": new Color(exports.defaultBinaryOn()),
            "name": "1",
        }
    ];
    return defaultColormap;
};

exports.defaultContinuous = function () {
    var defaultColormap = [
        {
            "color": new Color(exports.defaultContLow()),
            "name": "Low",
        },
        {
            "color": new Color(exports.defaultContHigh()),
            "name": "High",
        }
    ];
    return defaultColormap;
};

export function getOne (attrName) {

    // Return a shallow copy of an attr's colormap.
    if (colormaps[attrName]) {
        return colormaps[attrName].map(cat => {
            return cat
        })
    }
}

export function getCategoryCount (attrName) {

    // Get an array of category strings of a colormap.
    let count = 0
    if (attrName in colormaps) {
        count = colormaps[attrName].length
    }
    return count
}

exports.getCategoryStrings = function(attrName) {

    // Get an array of category strings of a colormap.
    if (attrName in colormaps) {
        return colormaps[attrName].map(cat => cat.name)
    }
    return []
};

exports.getCategoryString = function(attrName, catIndex) {

    // Find the string associated with this category code.
    if (attrName in colormaps) {
        return colormaps[attrName][catIndex].name;
    }
    return ''
};

export function getCategoryIndex (attrName, catName) {

    // Find the index associated with this category string.
    // Start off as if we were passed and index rather than a name.
    let index = catName
    if (attrName in colormaps) {
        colormaps[attrName].forEach((cat, i) => {
            if (cat.name === catName) {
                index = i
            }
        })
    }
    return index
}

exports.updateCategoryColor = function (layerName, catName, newHexStr) {

    // Update the colormap, then redraw the hexmap
    var catI;

    // Find the category index of this color.
    _.find(colormaps[layerName], function (cat, i) {
        if (cat.name === catName) {
            catI = i;
            return true;
        }
        return false;
    });
    
    // Update the global colormap only saving a persistColor if it is different
    // from the new value.
    // Also, remove any persistColor if it is the same as the new value.
    var cat = colormaps[layerName][catI],
        colorHexStr = cat.color.hexString(),
        persistHexStr = cat.persistColor ?
            cat.persistColor.hexString() : null;
    
    if (newHexStr === colorHexStr) {
        // nothing to do here
        
    } else if (newHexStr === persistHexStr) {
        cat.color = cat.persistColor;
        delete cat.persistColor;
        
    } else if (persistHexStr === null) {
        cat.persistColor = cat.color;
        cat.color = new Color(newHexStr);
        
    } else {
        cat.color = new Color(newHexStr);
    }
};

exports.toStoreFormat = function (colormap) {

    // Convert one attr colormap into a form that state can save.
    var cats = _.map(colormap, function(val) {
            return val.name;

        }),
        colors = _.map(colormap, function(val) {
            return val.color.hexString();
        });
    return {cats: cats, colors: colors};
};

exports.fromStoreFormatCategories = function (cats, data) {

    // Create an operating colormap for an attribute by the given categories
    // from state, then generate colors. Return the operating colormap and
    // operating data with codes replacing the category strings.
    
    // Generate colors.
    var jpColormap = _.map(
        jPalette.jColormap.get('hexmap')(cats.length + 1).map,
        function (val, key) { // eslint-disable-line no-unused-vars
    
            // Ignore alpha, taking the default of one.
            return {r: val.r, g: val.g, b: val.b};
        }
    );

    // Remove the repeating red at the end.
    jpColormap.splice(cats.length, 1);

    // Create the operating colormap.
    var colormap = _.map(jpColormap, function(color, i) {
        return {
            name: cats[i],
            color: new Color(color), // operating color in map
        };
    });
    
    // Replace category string values in the data with codes.
    var vals = _.map(data, function (strVal) {
        return cats.indexOf(strVal);
    });

    return { colormap: colormap, data: _.object(_.keys(data), vals) };
};

exports.fromStoreFormat = function (colorStore) {

    // Create an operating colormap for an attribute by the given colormap
    // from store, returning the operating colormap.
    return _.map(colorStore.cats, function (cat, i) {
        return {
            name: cat,
            color: new Color(colorStore.colors[i]),
        };
    });
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
     
        for (var j = 1; j < parsed[i].length; j += 3) {
        
            // Store each color assignment.
            // Doesn't run if there aren't any assignments, leaving an empty
            // colormap object that just forces automatic color selection.
            
            // This holds the index of the category
            var category_index = parseInt(parsed[i][j]);
            
            // The colormap gets an object with the name and color using the
            // position in the array as the index. The index given in the file
            // is ignored. Color is stored as a Color object.
            colormap[category_index] = {
                name: parsed[i][j + 1],
                color: new Color(parsed[i][j + 2]),
            };
        }
        
        // Store the finished color map in the global object
        colormaps[layer_name] = colormap;
    }
    rx.set('inited.colormap');
};

