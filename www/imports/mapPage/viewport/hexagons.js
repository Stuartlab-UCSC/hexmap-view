// hexagon.js
// Handle things to do with hexagons.

import data from '/imports/mapPage/data/data';
import Colormap from '/imports/mapPage/color/Colormap';
import colorMix from '/imports/mapPage/color/colorMix';
import coords from '/imports/mapPage/viewport/coords';
import infoWindow from '/imports/mapPage/viewport/infoWindow';
import rx from '/imports/common/rx';
import tool from '/imports/mapPage/head/tool';
import '/imports/common/navBar.html';
import perform from '/imports/common/perform'
import hexagonPresent from '/imports/mapPage/viewport/hexagonPresent'

// What's the minimum number of pixels that sideLen must represent at the
// current zoom level before we start drawing hex borders?
var MIN_BORDER_SIZE = 10;

// And how thick should the border be when drawn?
var HEX_STROKE_WEIGHT = 2;

// Some number used to determine the length for xy coords mapView.
var XY_HEX_LEN_SEED = 9;

// The node assignments in honeycomb space
var assignments;

// The opacity value when transparent is enabled.
var opacity;

// The hover info flag
var hoverInfoShowing = false;

// Save the xy extents.
var max_x,
    max_y;

function findOpacity () {

    if (Session.equals('transparent', true)) {

        var additive = 0.05;

        // On a black background, the opacity needs to be higher.
        if (rx.get('background') === 'black') {
            additive = 0.5;
        }

        // Opacity is a function of zoom: more zoom means more opaque.
        opacity = Math.min(1.0, ((ctx.zoom - 1) / 20) +  additive);
    } else {
        opacity = 1.0;
    }
}

function setZoomOptions(nodeId, xy, opts) {

    // Called when zoom changes and at hexagon creation.
    opts = opts || {};

    opts.fillOpacity = opacity;

    if (Session.equals('mapView', 'honeycomb')) {

        // Given a polygon, set the weight of hexagon's border stroke, in
        // number of screen pixels, and the border color.

        // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
        // So this holds the number of pixels that the global length sideLen
        // corresponds to at this zoom level.
        var weight =
            (coords.getSideLen() * Math.pow(2, ctx.zoom) >= MIN_BORDER_SIZE) ?
                HEX_STROKE_WEIGHT : 0;
        opts.strokeWeight = weight;
    } else {

        // This must be an xyCoords mapview.
        // Retain the hexagon size, regardless of zoom.
        var hexLen = XY_HEX_LEN_SEED / Math.pow(2, ctx.zoom);
        opts.path = coords.getHexLatLngCoords(xy, hexLen);
    }

    // If the hexagon has already been drawn...
    if (polygons[nodeId]) {
        // Change the drawn polygon options.
        polygons[nodeId].setOptions(opts);
    }

    // This has not yet been drawn yet,
    // so return with the modified shape options provided.
    return;
}

function renderHexagon (row, column, nodeId, opts) {

    // Make a new hexagon representing the hexagon at the given xy object
    // space before transform to xy world space.
    // Returns the Google Maps polygon.
    var xy = coords.get_xyWorld_from_xyHex(column, row),
        mapView = Session.get('mapView'),
        /*
        TODO useless
        thisSideLen = (mapView === 'honeycomb') ?
            coords.getSideLen() : coords.getSideLen() * 2,
         */
        shapeOpts = {
            map: googlemap,
            fillColor: Colormap.noDataColor(),
            strokeColor: rx.get('background'),
            strokeOpacity: 1.0,
            zIndex: 1,
        };
    
    // Special treatment for overlay nodes.
    if (opts && opts.overlay) {
        shapeOpts.zIndex = 200;
        if (polygons[nodeId]) {
            
            // This overlay node is already on the frozen map so use it's color.
            shapeOpts.fillColor = polygons[nodeId].fillColor;
        }
    }

    setZoomOptions(nodeId, xy, shapeOpts);

    if (mapView === 'honeycomb') {
        shapeOpts.path = coords.getHexLatLngCoords(xy, coords.getSideLen());
    } else {
        shapeOpts.strokeWeight = 0;
    }

    // TODO how to defer render until we have a fill color?
    // Construct the Polygon
    var hexagon = new google.maps.Polygon(shapeOpts);

    // Save the honeycomb coordinates with the hexagon
    hexagon.xHex = column;
    hexagon.yHex = row;

    // Save the xy coordinates for later.
    hexagon.xy = xy;

    // Save other flags for later.
    hexagon.overlay = opts.overlay ? opts.overlay : undefined;

    // Set up the click listener to move the global info window to this hexagon
    // and display the hexagon's information
    google.maps.event.addListener(hexagon, "click", function (event) {
        infoWindow.show(event, hexagon);
    });

    // Listen to mouse events on this hexagon
    tool.subscribe_listeners(hexagon);
    
    return hexagon;
} 

removeHoverListeners = (hexagon) => {
    google.maps.event.removeListener(hexagon.mouseover);
    google.maps.event.removeListener(hexagon.mouseout);
    delete hexagon.mouseover;
    delete hexagon.mouseout;
}

function addHoverListeners (hexagon) {
    if (hoverInfoShowing) {

        // Set up the hover listeners to move the infowindow to this node
        // with just a node ID displayed.
        hexagon.mouseover = google.maps.event.addListener(hexagon,
            "mouseover", function (event) {
                infoWindow.show(event, hexagon, null, null, true);
            });
        hexagon.mouseout = google.maps.event.addListener(hexagon,
            "mouseout", function (event) {
                infoWindow.close(true);
            });
    }
}

function initNewLayout () {
    coords.findDimensions(max_x, max_y);
    perform.log('create', 'render')
    exports.create();
    perform.log('refreshColors', 'render')
    colorMix.refreshColors();
}

exports.setHoverInfoShowing = () => {
    if (hoverInfoShowing) {
        hoverInfoShowing = false;
        _.each(polygons, removeHoverListeners);
    } else {
        hoverInfoShowing = true;
        _.each(polygons, addHoverListeners);
    }
    return hoverInfoShowing
}

exports.setOpacity = () => {
    findOpacity();
    _.each(polygons, function(hex) {
        hex.setOptions({ fillOpacity: opacity });
    });
}

exports.create = function () {

    // Create the hexagons from the positions data.
    findOpacity();

    // Clear any old polygons from the map.
    // TODO how do we clear the google map canvas?
    // TODO would a google map overlay work any better than re-creating the map?
    _.each(_.keys(polygons), exports.removeOne);
    polygons = {};
    _.each(assignments, function (hex, id) {
        exports.addOne (hex.x, hex.y, id);
    });
}

exports.removeOne = function (label) {
    google.maps.event.clearInstanceListeners(polygons[label]);
    polygons[label].setMap(null);
    delete polygons[label];
}

exports.addOne = function (x, y, label, opts) {

    // Make a hexagon on the Google map and store that.
    // x and y are in object coordinates before transform to world xy coords
    // opts:
    // @param opts.overlay: true for overlay

    var hexagon = renderHexagon(y, x, label, opts || {});

    // Store by label
    polygons[label] = hexagon;

    // TODO Add this after rendering all polygons.
    if (hoverInfoShowing) {
        addHoverListeners(hexagon);
    }
    
    // Set the polygon's signature so we can look stuff up for it when 
    // it's clicked.
    hexagon.signature = label;
}

exports.zoomChanged = function () {
    perform.log('zoomChangeStart', 'render', true)
    findOpacity();
    for (var signature in polygons) {
        setZoomOptions(signature, polygons[signature].xy);
    }
    perform.log('zoomChangeEnd', 'render')
}

exports.setOneColor = function (hexagon, color) {

    // Given a polygon and a color, set the hexagon's fill color.
    // TODO add another function to process a list of hexagons with a list of colors?
    hexagon.setOptions({
        fillColor: color
    });
};

exports.layoutAssignmentsReceived = function (parsed, id) {
    // This is an array of rows, which are arrays of values:
    // id, x, y
    perform.log('layoutAssignmentsReceived', 'render', true);

    // These file globals hold the maximum observed x & y.
    max_x = max_y = 0;

    // Find the max x and y while storing the assignments
    assignments = {};
    var start = 0;

    if (parsed[0][0][0] === '#') {
        start = 1;
    }

    // Show the number of nodes on the UI
    Session.set('nodeCount', parsed.length - start);

    // Build each hexagon.
    for (var i = start; i < parsed.length; i++) {
        var x = parsed[i][1],
            y = parsed[i][2],
            mapView = Session.get('mapView');
        if (mapView === 'honeycomb') {
 
            // Force the nodes into hexagonal grid coordinates.
            x = parseInt(x);
            y = parseInt(y);
        }
        assignments[parsed[i][0]] = {x: x, y: y};
        max_x = Math.max(x, max_x);
        max_y = Math.max(y, max_y);
    }
    rx.set('inited.layout');
    if (Session.equals('initedHexagons', true)) {
        initNewLayout();
    }
};

exports.getAssignmentsForMapViewChange = function () {

    // Download the positions of nodes and fill in the global
    // hexagon assignment grid.
    data.requestLayoutAssignments();
};

exports.init = function () {

    hexagonPresent.init()

    // Get the node positions for the initial view.
    Session.set('initedHexagons', true);
    if (rx.get('inited.layout')) {
        initNewLayout();
    }
};
