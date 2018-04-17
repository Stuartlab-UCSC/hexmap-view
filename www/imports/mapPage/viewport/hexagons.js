// hexagon.js
// Handle things to do with hexagons.

import data from '/imports/mapPage/data/data';
import Colormap from '/imports/mapPage/color/Colormap';
import colorMix from '/imports/mapPage/color/colorMix';
import coords from '/imports/mapPage/viewport/coords';
import infoWindow from '/imports/mapPage/viewport/infoWindow';
import rx from '/imports/common/rx';
import tool from '/imports/mapPage/head/tool';
import util from '/imports/common/util';
import utils from '/imports/common/utils';
import '/imports/common/navBar.html';

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

Template.navBarT.helpers({
    mapViewLayoutSelected: function () {  
        var page = Session.get('page'),
            mapView = Session.get('mapView');
        return (page && page === 'mapPage' && mapView &&
            mapView === 'honeycomb') ? 'selected' : '';
    },
    mapViewXySelected: function () {
        var page = Session.get('page'),
            mapView = Session.get('mapView');
        return (page && page === 'mapPage' && mapView &&
            mapView === 'xyCoords') ? 'selected' : '';
    },
    transparentSelected: function () {
        return (Session.get('transparent')) ? 'selected' : '';
    },
});

function findOpacity () {

    if (Session.equals('transparent', true)) {

        var additive = 0.05;

        // On a black background, the opacity needs to be higher.
        if (Session.equals('background', 'black')) {
            additive = 0.5;
        }

        // Opacity is a function of zoom: more zoom means more opaque.
        opacity = Math.min(1.0, ((ctx.zoom - 1) / 20) +  additive);
    } else {
        opacity = 1.0;
    }
}

function setZoomOptions(nodeId, xy, opts) {

    var polygonDrawn = polygons[nodeId] ? true : false;
    opts = opts || {};

    opts.fillOpacity = opacity;

    if (Session.equals('mapView', 'honeycomb')) {

        // Given a polygon, set the weight of hexagon's border stroke, in
        // number of screen pixels, and the border color.

        // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
        // So this holds the number of pixels that the global length sideLen
        // corresponds to at this zoom level.
        var weight = (coords.getSideLen() * Math.pow(2, ctx.zoom) >=
            MIN_BORDER_SIZE)
                ? HEX_STROKE_WEIGHT
                : 0;

        opts.strokeWeight = weight;
        opts.strokeColor = Session.get('background');
        opts.strokeOpacity = 1.0;
    } else {

        // This must be an xyCoords mapview.
        // Retain the hexgon size, regardless of zoom.
        var hexLen = XY_HEX_LEN_SEED / Math.pow(2, ctx.zoom);
        opts.path = coords.getHexLatLngCoords(xy, hexLen);
    }

    // If the hexagon has already been drawn...
    if (polygonDrawn) {

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
        thisSideLen = (mapView === 'honeycomb') ?
            coords.getSideLen() : coords.getSideLen() * 2,
        shapeOpts = {
            map: googlemap,
            //paths: coords,
            fillColor: Colormap.noDataColor(),
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
        // TODO this duplicates code above
        shapeOpts.path = coords.getHexLatLngCoords(xy, coords.getSideLen());
    } else {
        shapeOpts.strokeWeight = 0;
    }

    // TODO can we process many polygons in one call to googlemaps?
    // Can we leave out the fill color until we have one?
    // Construct the Polygon
    var saveLabel
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

function removeHoverListeners (hexagon) {
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

function showHoverInfo () {
    var el = $('#navBar .showHoverInfo');
    if (hoverInfoShowing) {
        hoverInfoShowing = false;
        _.each(polygons, removeHoverListeners);
        el.text('Show Node Hover');
    } else {
        hoverInfoShowing = true;
        _.each(polygons, addHoverListeners);
        el.text('Hide Node Hover');
    }
}

function initNewLayout () {
    coords.findDimensions(max_x, max_y);
    exports.create();
    colorMix.refreshColors();
}

exports.create = function () {

    // Create the hexagons from the positions data.
    findOpacity();

    // Clear any old polygons from the map.
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

    if (hoverInfoShowing) {
        addHoverListeners(hexagon);
    }
    
    // Set the polygon's signature so we can look stuff up for it when 
    // it's clicked.
    hexagon.signature = label;
}

exports.zoomChanged = function () {
    findOpacity();
    for (var signature in polygons) {
        setZoomOptions(signature, polygons[signature].xy);
    }
}

exports.setOneColor = function (hexagon, color) {

    // Given a polygon and a color, set the hexagon's fill color.
    hexagon.setOptions({
        fillColor: color
    });
};

exports.layoutAssignmentsReceived = function (parsed, id) {
    // This is an array of rows, which are arrays of values:
    // id, x, y

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
    rx.set('init.layoutPositionsLoaded');
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

    // Default the mapView to honeycomb.
    Session.set('mapView', Session.get('mapView') || 'honeycomb');

    // Default the transparency and set the opacity value.
    Session.set('transparent', Session.get('transparent') || false);

    // Show some non-dev widgets if need be.
    if (DEV) {
        $('#navBar .transparent').show();
    } else {
        $('#navBar .transparent').hide();
    }

    // Set some event handlers
    $('#navBar li.mapLayout').on('click', function () {
        Session.set('mapView', 'honeycomb');
        Session.set('transparent', false);
        exports.getAssignmentsForMapViewChange();
    });

    $('#navBar li.xyCoordView').on('click', function () {
        Session.set('mapView', 'xyCoords');
        Session.set('transparent', true);
        exports.getAssignmentsForMapViewChange();
    });
    $('#navBar .transparent').on('click', function () {
        Session.set('transparent', !Session.get('transparent'));
        findOpacity();
        _.each(polygons, function(hex) {
            hex.setOptions({ fillOpacity: opacity });
        });
    });
    $('#navBar .showHoverInfo').on('click', showHoverInfo);

    // Get the node positions for the initial view.
    Session.set('initedHexagons', true);
    if (rx.get('init.layoutPositionsLoaded')) {
        initNewLayout();
    }
};
