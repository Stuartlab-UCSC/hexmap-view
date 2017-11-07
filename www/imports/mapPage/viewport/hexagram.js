// hexagram.js
// Run the hexagram visualizer client.

import '/imports/lib/color.js';
import Colors from '/imports/mapPage/color/colorEdit.js';
import Coords from '/imports/mapPage/viewport/coords.js';
import Hexagons from '/imports/mapPage/viewport/hexagons.js';
import Layer from '/imports/mapPage/longlist/layer.js';
import Legend from '/imports/mapPage/color/legend.js';
import rxAction from '/imports/rx/rxAction.js';
import Shortlist from '/imports/mapPage/shortlist/shortlist.js';
import Sort from '/imports/mapPage/longlist/sort.js';
import Tool from '/imports/mapPage/head/tool.js';
import Util from '/imports/common/util.js';

var userDebug = false; // Turn user debugging on/off

exports.createMap = function  () {

    // Create the google map.
    var mapOptions = {
        center: ctx.center,
        backgroundColor: Session.get('background'),
        zoom: ctx.zoom,
        mapTypeId: "blank",
        // Don't show a map type picker.
        mapTypeControlOptions: {
            mapTypeIds: []
        },
        minZoom: 2,

        // Or a street view man that lets you walk around various Earth places.
        streetViewControl: false
    };

    // Create the actual map
    GoogleMaps.create({
        name: 'googlemap',
        options: mapOptions,
        element: document.getElementById("visualization"),
    });
    googlemap = GoogleMaps.maps.googlemap.instance;
        
    // Attach the blank map type to the map
    googlemap.mapTypes.set("blank", new Coords.BlankMap());
    
    google.maps.event.addListener(googlemap, "center_changed", function(event) {
        ctx.center = googlemap.getCenter();
    });
    
    // We also have an event listener that checks when the zoom level changes,
    // and turns off hex borders if we zoom out far enough, and turns them on
    // again if we come back.
    google.maps.event.addListener(googlemap, "zoom_changed", function(event) {
        // Get the current zoom level (low is out)
        ctx.zoom = googlemap.getZoom();
        Hexagons.zoomChanged();
    });
    
    // Listen to mouse events on this map
    Tool.subscribe_listeners(googlemap);
}

exports.initMap = function () {

    // Initialize the google map and create the hexagon assignments
    exports.createMap();
    Hexagons.create();
    exports.refreshColors();
};

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

exports.refreshColors = function () {

    // Make the view display the correct hexagons in the colors of the current
    // layer(s), as read from the values of the layer pickers in the global
    // layer pickers array.
    // All pickers must have selected layers that are in the object of 
    // layers.
    // Instead of calling this, you probably want to call refreshColors().
    
    // This holds a list of the string names of the currently selected layers,
    // in order.
    var current_layers = Shortlist.get_active_coloring_layers();
    
    // This holds all the current filters
    var filters = Shortlist.get_current_filters();
 
    // Special case of no layers at all.
    if (_.isUndefined(layers) || Object.keys(layers) < 1) {
        for(var signature in polygons) {
            Hexagons.setOneColor(polygons[signature], Colors.noAttrsColor());
        }
        return;
    }
    
    // Obtain the layer objects (mapping from signatures/hex labels to colors)
    Layer.with_many(current_layers, function(retrieved_layers) {  

        // This holds arrays of the lower and upper limit we want to use for 
        // each layer, by layer number. The lower limit corresponds to u or 
        // v = -1, and the upper to u or v = 1. The entries we make for 
        // colormaps are ignored.
        
        // We need to do this inside the callback, once we already have the
        // layers, so that we properly use the newest slider range endpoints,
        // which are updated asynchronously.
        var layer_limits = [];
        var at_least_one_layer = retrieved_layers.length >= 1;
        var two_layers = retrieved_layers.length >= 2;
        for(var i = 0; i < current_layers.length; i++) {
            var range = Shortlist.get_slider_range(current_layers[i]);
            layer_limits.push(range);
        }
        

        // Turn all the hexes the filtered-out color, pre-emptively
        // TODO redrawing would be faster to not change colors twice
        for(var signature in polygons) {
            Hexagons.setOneColor(polygons[signature], Colors.noDataColor());
        }
        
        // Go get the list of filter-passing hexes.
        Shortlist.with_filtered_signatures(filters, function(signatures) {
            for(var i = 0; i < signatures.length; i++) {
                // For each hex assign the filter
                // This holds its signature label
                var label = signatures[i];
                
                // This holds the color we are calculating for this hexagon.
                // Start with the no data color.
                var computed_color = Colors.noDataColor();
                
                if(at_least_one_layer) {
                    // We need to compute colors given the layers we found.

                    // Get the heat along u and v axes. This puts us in a square
                    // of side length 2. Fun fact: undefined / number = NaN, but
                    // !(NaN == NaN)
                    var u = retrieved_layers[0].data[label];
                    
                    if(Util.is_continuous(current_layers[0])) {
                        // Take into account the slider values and re-scale the 
                        // layer value to express its position between them.
                        u = get_range_position(u, layer_limits[0][0], 
                            layer_limits[0][1]);
                    }
                    
                    if(two_layers) {
                        // There's a second layer, so use the v axis.
                        var v = retrieved_layers[1].data[label];
                        
                        if(Util.is_continuous(current_layers[1])) {
                            // Take into account the slider values and re-scale
                            // the layer value to express its position between
                            // them.
                            v = get_range_position(v, layer_limits[1][0], 
                                layer_limits[1][1]);
                        }
                        
                    } else {
                        // No second layer, so v axis is unused. Don't make it 
                        // undefined (it's not missing data), but set it to 0.
                        var v = 0;
                    }
                    
                    // Either of u or v may be undefined (or both) if the layer
                    // did not contain an entry for this signature. But that's
                    // OK. Compute the color that we should use to express this
                    // combination of layer values. It's OK to pass undefined
                    // names here for layers.
                    computed_color = exports.get_color(current_layers[0], u, 
                        current_layers[1], v);
                }
                
                // Set the color by the composed layers.
                Hexagons.setOneColor(polygons[label], computed_color);
            }
        });

        Legend.redraw(retrieved_layers, current_layers);
    });
    
    // Make sure to also redraw the info window, which may be open.
    import InfoWindow from '/imports/mapPage/viewport/infoWindow.js';
    InfoWindow.redraw();
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
        Util.is_binary(layerName1)
    );

    var oneContinuousLayer = (
        onlyOneLayer &&
        !oneBinaryLayer &&
        Util.is_continuous(layerName1)
    );

    var oneCategoricalLayer = (
        onlyOneLayer &&
        !oneBinaryLayer &&
        !oneContinuousLayer
    );

    var bothContinuous = (
        !onlyOneLayer &&
        Util.is_continuous(layerName1) &&
        Util.is_continuous(layerName2)
    );

    var continuousAndCatOrBin =(
        !onlyOneLayer &&
        Util.is_cat_or_bin(layerName2) &&
        Util.is_continuous(layerName1)
    );

    var catOrBinAndContinous = (
        !onlyOneLayer &&
        !continuousAndCatOrBin &&
        Util.is_cat_or_bin(layerName1) &&
        Util.is_continuous(layerName2)
    );

    var catAndCatOrBin=(
        !onlyOneLayer &&
        Util.is_categorical(layerName1) &&
        Util.is_cat_or_bin(layerName2) ||
        Util.is_categorical(layerName2) &&
        Util.is_cat_or_bin(layerName1)
    );


    var bothLayersBinary = (
        Util.is_binary(layerName1) && Util.is_binary(layerName2)
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
        color = Colors.noDataColor();

    } else if(oneBinaryLayer) {
        // User's choice from color map or default.
        if(layerVal1 === on) { // layerVal1 is 1
            color =  Colors.binaryOnColor(layerName1);
        } else if (layerVal1 === off) { // layerVal1 is 0
            color = Colors.binaryOffColor(layerName1);
        } else {
            throw "There was an error making the color of the binary layer"
        }

    } else if(bothLayersBinary) {
        // Special color scheme for two binaries,
        // always uses default, never choice from user.
        if(layerVal1 === on) {
            if(layerVal2 === on) {
                // Both are on
                return Colors.defaultBinBothOn();
            } else if (layerVal2 === off) {
                // Only the first is on
                return Colors.defaultBinaryOn();
            }
        } else if (layerVal1 === off) {
            if(layerVal2 === on) {
                // Only the second is on
                return Colors.defaultSecondBinOn();
            } else if (layerVal2 === off) {
                // Neither is on
                return Colors.defaultBinaryOff();
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
        var colorCountL2 = findColorCount(layerName2);
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
    var highColor = Colors.continuousHighColor(layerName);
    var lowColor = Colors.continuousLowColor(layerName);
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
    var highColor1 = Colors.defaultContHigh();
    var lowColor1 = Colors.defaultContLow();
    var lowColor1HighColor2 = Colors.defaultCont2High1Low();
    var bothHighColor = Colors.defaultContBothHigh();

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

initLayout = function () {

    // Download the layout names and save to the layouts array
        var id = 'layouts';
        Ajax.get({
            id: id,
            ok404: true,
            success: function (parsed) {

                // This is an array of rows, with one element in each row:
                // layout name.
                var layouts = [];
                for (var i = 0; i < parsed.length; i++) {
                    var row = parsed[i];
                    if (row.length === 0) {
                        // Skip any blank lines
                        continue;
                    }
                    layouts.push(row[0]);
                }
                Session.set('layouts', layouts);

                // Transform the layout list into the form wanted by select2
                var data = _.map(layouts, function (layout, i) {
                    return { id: i, text: layout }
                });

                // Create our selection list
                
                // Determine the layout index whose map will be displayed.
                // Layout index takes precedent over layout name.
                if (Session.equals('layoutIndex', undefined)) {
                    Session.set('layoutIndex',
                        (Session.equals('layoutName', undefined) ? 0 :
                            layouts.indexOf(Session.get('layoutName')))
                    );
                }
                
                createOurSelect2($("#layout-search"),
                    {data: data}, Session.get('layoutIndex').toString());

                // Define the event handler for the selecting in the list
                $("#layout-search").on('change', function (ev) {
                    Session.set('layoutIndex', ev.target.value);
                    createMap();
                    drawLayout(true);
                    
                    // Update density stats to this layout and
                    // resort the list to the default of density
                    find_clumpiness_stats(Session.get('layoutIndex'));
                    Session.set('sort', ctx.defaultSort());
                    import Longlist from '/imports/reactCandidates/longlist.js';
                    Longlist.update();
                    
                });
                Session.set('initedLayout', true);
            },
            error: function (error) {
                projectNotFound(id);
            },
        });
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
    rx.dispatch({ type: rxAction.INIT_MAP_COLORMAP_LOADED })
}
