// hexagram.js
// Run the hexagram visualizer client.

import '../lib/color.js';
import Ajax from '../data/ajax.js';
import Colors from '../color/colorEdit.js';
import Data from '../data/data.js';
import Hexagons from './hexagons.js';
import Layer from '../longlist/layer.js';
import Legend from '../color/legend.js';
import Perform from '../common/perform.js';
import Shortlist from '../shortlist/shortlist.js';
import Sort from '../longlist/sort.js';
import Tool from '../mapPage/tool.js';
import Util from '../common/util.js';

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
    googlemap = new google.maps.Map(
        document.getElementById('visualization'), mapOptions);
        
    // Attach the blank map type to the map
    googlemap.mapTypes.set("blank", new BlankMapType());
    
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
    import InfoWindow from './infoWindow.js';
    InfoWindow.redraw();
}

function mix(a, b, amount) {
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

exports.get_color = function (u_name, u, v_name, v) {
    // Given u and v, which represent the heat in each of the two currently
    // displayed layers, as well as u_name and v_name, which are the
    // corresponding layer names, return the computed CSS color.
    // Either u or v may be undefined (or both), in which case the no-data color
    // is returned. If a layer name is undefined, that layer dimension is 
    // ignored.
    //
    // For categorical layers, the associated u or v is the category index.

    if(exports.have_colormap(v_name) && !exports.have_colormap(u_name)) {
        // We have a colormap as our second layer, and a layer as our first.
        // Swap everything around so colormap is our first layer instead.
        // Now we don't need to think about drawing a layer first with a 
        // colormap second.
        
        return exports.get_color(v_name, v, u_name, u);
    }

    if(isNaN(u) || isNaN(v) || u === undefined || v === undefined) {
        // At least one of our layers has no data for this hex.
        return Colors.noDataColor();
    }
    
    // Find the color counts  for each of the layers
    var colorCountU = Legend.findColorCount(u_name),
        colorCountV = Legend.findColorCount(v_name);
    
    if(colorCountU > 0 && colorCountV > 0 &&
        !colormaps[u_name].hasOwnProperty(u) && 
        !colormaps[v_name].hasOwnProperty(v) &&
        colorCountU === 2  && colorCountV === 2) {
        
        // Special case: two binary or unary auto-generated colormaps.
        // Use dark grey/yellow/blue/green color scheme
        if(u == 1) {
            if(v == 1) {    
                // Both are on
                return Colors.binary_both_on();
            } else {
                // Only the first is on
                return Colors.binary_on();
            }
        } else {
            if(v == 1) {
                // Only the second is on
                return Colors.binary_second_on();
            } else {
                // Neither is on
                return Colors.binary_off();
            }
        }
    }
    
    if(colorCountU > 0 && !colormaps[u_name].hasOwnProperty(u) &&
        colorCountU <= 2 && v_name == undefined) {
        
        // Special case: a single binary or unary auto-generated colormap.
        // Use dark grey/yellow to make 1s stand out.
        
        if(u == 1) {
            return Colors.binary_on();
        } else {
            return Colors.binary_off();
        }
    }

    var base_color;
   
    if(colorCountU > 0) {
        // u is a colormap and for categoricals is the category index.
        if(colormaps[u_name].hasOwnProperty(u)) {

            // And the colormap has an entry here. Use it as the base color.
            var to_clone = colormaps[u_name][u].color;
            
            base_color = Color({
                hue: to_clone.hue(),
                saturation: to_clone.saturationv(),
                value: to_clone.value()
            });
        } else if(colorCountU <= 2) {

            // Binary values with default colormap
            // The colormap has no entry, but there are only two options (i.e.
            // we're doing a binary layer against a continuous one.)
            
            // We break out of the base_color path and do a special case:
            // interpolate between one pair of colors for on, and a different
            // pair for off.
            
            if(u == 0) {
                // What color should we use for a 0 value?
                
                // Interpolate each component by itself. Invert directions so we
                // can define our colors in terms of actual layer value space,
                // and not key space. To change the colors here, look
                // vertically.
                
                // Interpolate grey to yellow.
                var red = mix(0x33, 0xFF, -v).toFixed(0);
                var green = mix(0x33, 0xFF, -v).toFixed(0);
                var blue = mix(0x33, 0x00, -v).toFixed(0);
                
            } else if (u == 1) {
                // And for a 1 value? Do a different set of interpolations.
                // Interpolate blue to green.
                var red = mix(0x00, 0x00, -v).toFixed(0);
                var green = mix(0x00, 0xFF, -v).toFixed(0);
                var blue = mix(0xFF, 0x00, -v).toFixed(0);
            }
            
            base_color = Color({
                'red': red,
                'green': green,
                'blue': blue
            });
            
        } else {
            // We should never get here because all categorical layers
            // should have a colormap.
            // The colormap has no entry, and there are more than two options.
            // Assume we're calculating all the entries. We do this by splitting
            // the color circle evenly.

            // Calculate the hue for this number.
            var hsv_hue = u / colorCountU * 360;
    
            // The base color is a color at that hue, with max saturation and 
            // value
            base_color = Color({
                hue: hsv_hue, 
                saturation: 100,
                value: 100
            })
        }
        
        // Now that the base color is set, consult v to see what shade to use.
        if(v_name == undefined) {
            // No v layer is actually in use. Use whatever is in the base 
            // color
            // TODO: This code path is silly, clean it up.
            var hsv_value = base_color.value();
        } else if(colorCountV > 0) {

            // Binary or categorical values.
            // Do discrete shades in v

            // Calculate what shade we need from the nonnegative integer v
            // We want 100 to be included (since that's full brightness), but we
            // want to skip 0 (since no color can be seen at 0), so we add 1 to 
            // v.
            var hsv_value = (v + 1) / colorCountV * 100;
        } else {

            // Continuous values.
            // Calculate what shade we need from v on -1 to 1, with a minimum
            // value of 20 to avoid blacks.
            var hsv_value = 60 + v * 40;
        }
        
        // Set the color's value component.
        base_color.value(hsv_value);
        
        // Return the shaded color
        return base_color.hexString();
    }
    
    
    // If we get here, we only have non-colormap layers.
    
    // We want the same grey/yellow/blue/white scheme as for binary layers, but
    // interpolated. TODO do we still use these colors?
    
    // Remember: u and v are backwards. I.e.  (-1, -1) is the upper left of the
    // key.
    
    if(v_name == undefined) {
        // No v layer present. Use the edge and not the middle.
        v = -1;
    }
    
    if(u_name == undefined) {
        // No u layer present. Use the edge and not the middle.
        u = -1;
    }
    
    // Interpolate each component by itself. Invert directions so we can define
    // our colors in terms of actual layer value space, and not key space.
    // To change the colors here, look vertically.
    var red,
        green,
        blue;
    current_layers = Shortlist.get_active_coloring_layers();

    if (current_layers.length === 2 || Session.equals("background","black")) {
          red = mix2(0x60, 0xFF, 0x00, 0x00, -u, -v).toFixed(0);
        green = mix2(0x60, 0xFF, 0x00, 0xFF, -u, -v).toFixed(0);
         blue = mix2(0x60, 0x00, 0xFF, 0x00, -u, -v).toFixed(0);
    }

    else if (Session.equals("background","white")) {
          red = mix2(0xc0, 0xFF, 0x00, 0x00, -u, -v).toFixed(0);
        green = mix2(0xc0, 0x00, 0x00, 0xFF, -u, -v).toFixed(0);
         blue = mix2(0xc0, 0x00, 0xFF, 0x00, -u, -v).toFixed(0);
    }

    //Produce the color string...
    var color = "rgb(" + red + "," + green + "," + blue + ")";
    
    return color;
};

exports.initLayoutList = function () {

    // Transform the layout list into the form wanted by select2
    var data = _.map(Session.get('layouts'), function (layout, i) {
        return { id: i, text: layout }
    });

    // Create our selection list
    
    Util.createOurSelect2($("#layout-search"),
        {data: data}, Session.get('layoutIndex').toString());

    // Define the event handler for the selecting in the list
    $("#layout-search").on('change', function (ev) {
        Session.set('layoutIndex', ev.target.value);
        exports.createMap();
        Hexagons.layout();
        
        // Update density stats to this layout and
        // resort the list to the default of density
        Sort.find_clumpiness_stats(Session.get('layoutIndex'));
        Session.set('sort', ctx.defaultSort());
        import Longlist from '../longlist/longlist.js';
        Longlist.update();
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
    Session.set('colormapsLoaded', true);
}
