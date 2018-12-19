// hexagon.js
// Handle things to do with hexagons.

import data from '/imports/mapPage/data/data';
import colorMix from '/imports/mapPage/color/colorMix';
import coords from '/imports/mapPage/viewport/coords';
import rx from '/imports/common/rx';
import '/imports/common/navBar.html';
import perform from '/imports/common/perform'
import hexagons from '/imports/mapPage/viewport/hexagons'
import nodeControls from '/imports/mapPage/viewport/nodeControls'

// The node assignments in honeycomb space
var assignments;

// Save the xy extents.
var max_x,
    max_y;

function initNewLayout () {
    coords.findDimensions(max_x, max_y);
    perform.log('create', 'render')
    exports.create();
    perform.log('refreshColors', 'render')
    colorMix.refreshColors();
}

exports.setHoverInfoShowing = () => {
    const showing = rx.get('hoverInfoShowing')
    rx.set('hoverInfoShowing.toggle')
    if (showing) {
        _.each(polygons, hexagons.removeHoverListeners);
    } else {
        _.each(polygons, hexagons.addHoverListeners);
    }
}

exports.create = function () {

    // Create the hexagons from the positions data.
    hexagons.findOpacity();

    // Clear any old polygons from the map.
    // TODO how do we clear the google map canvas?
    // TODO would a google map overlay work any better than re-creating the map?

    keys = _.keys(polygons)
    if (keys.length) {
        _.each(_.keys(polygons), hexagons.removeOne);
        polygons = {};
    }
    _.each(assignments, function (hex, id) {
        hexagons.addOne (hex.x, hex.y, id);
    });
}

exports.zoomChanged = function () {
    perform.log('zoomChangeStart', 'render', true)
    hexagons.findOpacity();
    for (var signature in polygons) {
        hexagons.setZoomOptions(signature, polygons[signature].xy);
    }
    perform.log('zoomChangeEnd', 'render')
}

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

    nodeControls.init()

    // Get the node positions for the initial view.
    Session.set('initedHexagons', true);
    if (rx.get('inited.layout')) {
        initNewLayout();
    }
};
