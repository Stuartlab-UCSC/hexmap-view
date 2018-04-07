
// Colormap editor and color constance.
// TODO pull the colormap editor out of here into its own file.
// TODO move the color functions from colorMix.js to here.

import DialogHex from '/imports/common/DialogHex';
import hexagons from '/imports/mapPage/viewport/hexagons';
import viewport from '/imports/mapPage/viewport/viewport';
import colorMix from '/imports/mapPage/color/colorMix';
import overlayNodes from '/imports/mapPage/calc/overlayNodes';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import tool from '/imports/mapPage/head/tool';
import '/imports/common/navBar.html';
import './colorEdit.html';
import './colorEdit.css';
import util from '/imports/common/util';

// Some color constants
var DISABLED_COLOR = '#aaaaaa',
    BINARY_ON_DARK_BG = '#ffff00',
    BINARY_ON_LIGHT_BG = '#ff0000',
    BINARY_OFF_DARK_BG = '#404040',
    BINARY_OFF_LIGHT_BG = '#c0c0c0',
    COLOR_BINARY_BOTH_ON_DARK_BG = '#00FF00',   // 2 binary attrs, both on
    COLOR_BINARY_BOTH_ON_LIGHT_BG = '#AA00AA',   // 2 binary attrs, both on
    COLOR_BINARY_SECOND_ON = '#0000ff', // first off, second on.
    CONTINUOUS_LOW_DARK_BG = BINARY_OFF_DARK_BG,
    CONTINUOUS_HIGH_DARK_BG = BINARY_ON_DARK_BG,
    CONTINUOUS_LOW_LIGHT_BG  = BINARY_OFF_LIGHT_BG,
    CONTINUOUS_HIGH_LIGHT_BG  = BINARY_ON_LIGHT_BG,
    CONTINUOUS2_HIGH_DARK_BG = '#0000ff', // 2 cont, second high, first low
    CONTINUOUS2_HIGH_LIGHT_BG  = '#0000ff',// 2 cont, second high, first low
    CONTINUOUS2_BOTH_HIGH_ALL_BG = '#00ff00';

// The color to use as hexagon fill, depending on the background color
var NO_DATA_LIGHT_BG = '#E0E0E0',
    NO_DATA_DARK_BG = '#303030',
    COLOR_NO_ATTRS = 'cyan',
    badValue = false, // The current category input has a bad value
    $link;
    
var $form,
    dialogHex;

// Define the colormap template helper, at this scope for some reason
Template.colormapT.helpers({

    // Use the Session version of the colormap
    colorArray: function () {
        // TODO this should be a local reactiveVar rather than a global
        // session var
        var colorArray = Session.get('colorArray');
        return colorArray;
    }
});

// Define the background color template helper
Template.navBarT.helpers({

    background: function () {
        if (Session.get('background') === 'black') {
            return 'White';
        } else {
            return 'Black';
        }
    }
});

function findRowLayer ($row, colorArray) {

    // Find the layer in the colorArray from a row element
    var layerName = $row.find('td:first').attr('title');
    return _.find(colorArray, function (layer) {
        return (layer.name === layerName);
    });
}

function findColumnCat ($input, colorArray) {

    // Find the category in the colorArray from an input element
    var layer = findRowLayer($input.parents('tr'), colorArray),
        $el = $input.parent().prev(),
        catName = $.trim(($el).text());

    // Trim and remove the trailing colon
    catName = catName.slice(0, catName.length - 1);

    // Return the wanted category
    return _.find(layer.cats, function (cat) {
        return (cat.name === catName);
    });
}

// Convert an rgb array, [66, 77, 88], to an object, {r:66, b:77, g:88}
function rgbArrayToObj (arr) {
    return new Color({r: arr[0], g: arr[1], b: arr[2]});
}

function setCatAttrs (a) {

    // Set category input attributes that may change with user edits.
    if (rgbArrayToObj(a.operVal).dark()) {
        a.dark = 'dark';
    } else {
        a.dark = '';
    }
    if (a.operVal === a.fileVal) {
        a.isFileVal = 'isFileVal';
    } else {
        a.isFileVal = '';
    }
}

function updateColormap (aCat) {

    // Update the colormap, then redraw the hexmap
    var layer = aCat.layer,
        catI;

    _.find(colormaps[layer], function (cat, i) {
        if (cat.name === aCat.name) {
            catI = i;
            return true;
        }
        return false;
    });
    colormaps[layer][catI].color = new Color(aCat.operVal);
    colorMix.refreshColors();
}

function rowClick(ev) {

    // Fires when a row is clicked.
    // Highlights the clicked row to make it easier for the user
    // to follow across all of the categories for this layer.
    var $t = $(ev.currentTarget),

        // Clear the 'selected' attribute of all layers
        colorArray = _.map(Session.get('colorArray'), function (layer) {
            var l = _.clone(layer);
            l.selected = '';
            return l;
        }),
        // Find the current layer in the color array
        selected = findRowLayer($t, colorArray);
    selected.selected = 'selected';
    Session.set('colorArray', colorArray);
}

function inputBlur (ev) {

    // Fires when a color input field loses focus.
    // Update its properties & the map
    var $t = $(ev.currentTarget),
        colorArray = Session.get('colorArray'),
        cat = findColumnCat($t, colorArray),
        newVal = $t.prop('value').trim().toUpperCase();

    if (cat.shaking === 'shaking') {

        // nothing to do when the input box is shaking
        return;
    }
    if (!newVal.match(/^#([A-F0-9]{6})$/)) {

        // An invalid hex string, so set the Session to shake then
        // set the Session to not shake and put the focus back to this
        cat.shaking = 'shaking';
        Session.set('colorArray', colorArray);
        badValue = true;
        $t.effect('shake', null, null, function () {
            cat.shaking = '';
            Session.set('colorArray', colorArray);
            $t.focus();
        });
        return;
    }
    $t.prop('value', newVal); // clean up the input box value
    if (newVal !== cat.operVal) {

        // The new value is not the same as the operating color,
        // so update the operating color & update the colormap
        cat.operVal = newVal;
        setCatAttrs(cat);
        Session.set('colorArray', colorArray);
        Meteor.flush();
        updateColormap(cat);
        badValue = false;
    }
}

function inputKeyup (ev) {

    // Fires when a key is released in a color input field
    var $t = $(ev.currentTarget),
        newVal = $t.prop('value').trim(),
        colorArray,
        cat;

    if (newVal === '') {

        // The textbox is empty so display the file color string
        // so the user will know what that is
        colorArray = Session.get('colorArray');
        cat = findColumnCat($t, colorArray);
        $t.prop('value', cat.fileVal);
    }
    if (ev.which === 13) {

        // This is the return key, so trigger a blur event
        $t.parent().next().next().find('input').focus();
    }
}

function makeTsv($link) {
    // Make a colormaps formatted string for a requested download.
    var tsv = '';
    // Only add layers in the string that have been loaded into the
    // shortlist.
    Object.keys(colormaps).forEach(function (layer) {
            if (shortlist.inShortList(layer)) {
        tsv += layer;
        _.each(colormaps[layer], function (cat, catIndex) {
        
            // If the colormap entry is not empty...
            if (Object.keys(colormaps[layer]).length > 0) {
                tsv += '\t' + catIndex + '\t' + cat.name + '\t' +
                    cat.color.hexString();
            }
        });
        tsv += '\n';
            }
    });

    // Fill in the data URI for saving. We use the handy
    // window.bota encoding function.
    $link.attr("href", "data:text/plain;base64," +
        window.btoa(tsv));

    $link[0].click();
}

exports.colormapToColorArray = function (layerVal, layerKey) {

    // Convert one attr colormap colors into a form that templates
    // can use.
    var cats = _.map(layerVal, function(val,i) {

        var cat = {
                name:  val.name,
                fileVal: rgbArrayToObj(
                    val.fileColor.values.rgb).hexString(),
                operVal: val.color.hexString(),
                layer: layerKey,
            };
        setCatAttrs(cat);
        return cat;
    });
    return {name: layerKey, cats: cats, selected: ''};
};

exports.getCategoryString = function(layerName, layerValue) {
    return colormaps[layerName][layerValue].name
};

exports.colormapsToColorArray = function () {

    // Convert the colormaps into a form the template can use,
            // filtering out any entries with no categories, and any entry
            // that is not in the shortlist.
    return _.filter(
                _.map(colormaps, exports.colormapToColorArray),
        function (entry) {
                    return (entry.cats.length > 0 &&
                            shortlist.inShortList(entry.name)
                    );
        }
    );
}

function render() {
        Session.set('colorArray', exports.colormapsToColorArray());
    $form
        .append($link)
        .on('click', 'tr', rowClick)
        .on('blur', 'input', inputBlur)
        .on('keyup', 'input', inputKeyup);
}

function binaryColorChanged (layerName) {
    // Determines whether the user has changed a binary colormap,
    // dependent on what background they are on.
    if (_.isUndefined(colormaps[layerName])){
        return false
    }
    var on = 1,
        off = 0,
        currentOn = colormaps[layerName][on].color.hexString().toLowerCase(),
        currentOff= colormaps[layerName][off].color.hexString().toLowerCase(),
        originalOff = exports.defaultBinaryOff().toLowerCase(),
        originalOn = exports.defaultBinaryOn().toLowerCase();

    return (currentOn !== originalOn) || (currentOff !== originalOff)
}

// BREAK THESE UP INTO LIGHT AND DARK INSTEAD OF RELYING ON THE BACKGROUND
// SO THAT YOU CAN CHANGE IN A GOOD WAY
function continuosColorChanged (layerName) {
    // Determines whether the user has changed a continuous colormap,
    // dependent on what background they are on.
    //layerValue is 0 for low and 1 for high.
    if (_.isUndefined(colormaps[layerName])){
        return false
    }
    var high = 1,
        low = 0,
        currentH = colormaps[layerName][high].color
            .hexString().toLowerCase(),
        currentL = colormaps[layerName][low].color
            .hexString().toLowerCase(),
        originalH = exports.defaultContHigh().toLowerCase(),
        originalL = exports.defaultContLow().toLowerCase();

    return (currentH !== originalH) || (currentL !== originalL)
}

exports.disabledColor = function () {
    return DISABLED_COLOR;
}

exports.continuousLowColor = function(layerName) {
    // Get's the low color for a continuous attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        low = 0;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][low].color.hexString()
    } else {
        colormaps[layerName] = exports.defaultContinuousColormap();
        color =  colormaps[layerName][low].color.hexString();
    }
    return color;
}

exports.continuousHighColor = function(layerName) {
    // Get's the high color for a continuous attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        high = 1;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][high].color.hexString()
    } else {
        colormaps[layerName] = exports.defaultContinuousColormap();
        color =  colormaps[layerName][high].color.hexString();
    }
    return color;
}

exports.binaryOffColor = function(layerName) {
    // Get's the off color for a binary attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        off = 0;
    if (colormaps[layerName]) {
        color =  colormaps[layerName][off].color.hexString()
    } else {
        colormaps[layerName] = exports.defaultBinaryColorMap();
        color =  colormaps[layerName][off].color.hexString();
    }
    return color;
}

exports.binaryOnColor = function(layerName) {
    // Get's the on color for a binary attribute using the
    // appropriate colormap entry. If colormap entry is not present
    // then a default according to the background is made.
    var color,
        on = 1;

    if (colormaps[layerName]) {
        color =  colormaps[layerName][on].color.hexString()
    } else {
        colormaps[layerName] = exports.defaultBinaryColorMap();
        color =  colormaps[layerName][on].color.hexString()
    }
    return color;
}

exports.defaultContLow = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS_LOW_LIGHT_BG : CONTINUOUS_LOW_DARK_BG ;
}

exports.defaultContHigh = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS_HIGH_LIGHT_BG : CONTINUOUS_HIGH_DARK_BG;
}

exports.defaultContBothHigh = function () {
    return CONTINUOUS2_BOTH_HIGH_ALL_BG
}

exports.defaultCont2High1Low = function () {
    return (Session.equals('background', 'white')) ?
        CONTINUOUS2_HIGH_LIGHT_BG : CONTINUOUS2_HIGH_DARK_BG;
}

exports.defaultBinaryOff = function () {
    return (Session.equals('background', 'white')) ?
        BINARY_OFF_LIGHT_BG : BINARY_OFF_DARK_BG;
}

exports.defaultBinaryOn = function () {
    return (Session.equals('background', 'white')) ?
        BINARY_ON_LIGHT_BG : BINARY_ON_DARK_BG;
}

exports.defaultBinBothOn = function () {
    return (Session.equals('background', 'white')) ?
        COLOR_BINARY_BOTH_ON_LIGHT_BG : COLOR_BINARY_BOTH_ON_DARK_BG;
}

exports.defaultSecondBinOn = function () {
    return COLOR_BINARY_SECOND_ON;
}

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
}

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
}

exports.noDataColor = function () {
    return (Session.equals('background', 'white')) ?
        NO_DATA_LIGHT_BG : NO_DATA_DARK_BG;
}

exports.noAttrsColor = function () {
    return COLOR_NO_ATTRS;
}

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
    return nColors
};

exports.init = function () {
    
    var $button = $('#navBar .colormap');
    $form = $('#colorMapDiv');
    $link = $('#colorMapDiv a');

    $('#background').on('click', function () {
                // Continuous/binary layers in the shortlist whose
                // colors have not been changed must have their colors updated
                // with the new background.
                var contLayers = shortlist.getContinuousLayerNames()
                    .filter(function(layerName) {
                        return !continuosColorChanged(layerName)
                });
                var binLayers = shortlist.getBinaryLayerNames()
                    .filter(function(layerName) {
                        return !binaryColorChanged(layerName)
                });

                // Toggle the background session variable.
        if (Session.equals('background', 'white')) {
            Session.set('background', 'black');
        } else {
            Session.set('background', 'white');
        }

                //Provide colormaps in accordance with the new background.
                _.forEach(contLayers, function(layerName) {
                    colormaps[layerName] = exports.defaultContinuousColormap()
                });
                _.forEach(binLayers, function (layerName) {
                    colormaps[layerName] = exports.defaultBinaryColorMap()
                });

        // The background change requires a new map to show the
        // background.
        viewport.create();
        hexagons.create();
        colorMix.refreshColors();
        overlayNodes.show();
    });

    // Prepare to display a dialog
    var opts = {
        width: $(window).width() * 2 / 3,
        height: $(window).height() * 2 / 3,
        position: {my: 'left top', at: 'left top+50', of: window},
        buttons: [
            {
                text: 'Download',
                click: function () {
                    if (!badValue) {
                        makeTsv($link);
                        $form.dialog('destroy');
                    }
                }
            }
        ],
    };
    var dialogHex = DialogHex.create({
        $el: $form,
        opts: opts,
        showFx: render,
        helpAnchor: '/help/menus.html#colormap'
    });

    // Create a link from the navBar
    tool.add("colormap", function () {
        dialogHex.show();
        tool.activity(false);
    }, 'Change colors of attributes', 'mapShow');
}

