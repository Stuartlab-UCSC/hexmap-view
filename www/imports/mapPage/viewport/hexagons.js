// hexagon.js
// Handle things to do with hexagons.

import Colormap from '/imports/mapPage/color/Colormap';
import coords from '/imports/mapPage/viewport/coords';
import infoWindow from '/imports/mapPage/viewport/infoWindow';
import rx from '/imports/common/rx';
import tool from '/imports/mapPage/head/tool';
import '/imports/common/navBar.html';

// What's the minimum number of pixels that sideLen must represent at the
// current zoom level before we start drawing hex borders?
var MIN_BORDER_SIZE = 10;

// And how thick should the border be when drawn?
var HEX_STROKE_WEIGHT = 2;

// Some number used to determine the length for xy coords mapView.
var XY_HEX_LEN_SEED = 9;

// The opacity value when transparent is enabled.
var opacity;

export function findOpacity () {

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

export function setZoomOptions(nodeId, xy, opts) {

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

export function removeHoverListeners (hexagon) {
    google.maps.event.removeListener(hexagon.mouseover);
    google.maps.event.removeListener(hexagon.mouseout);
    delete hexagon.mouseover;
    delete hexagon.mouseout;
}

export function addHoverListeners (hexagon) {
    if (rx.get('hoverInfoShowing')) {

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

exports.setOpacity = () => {
    findOpacity();
    _.each(polygons, function(hex) {
        hex.setOptions({ fillOpacity: opacity });
    });
}


export function detachOne (label) {
    // Detach the polygon from the map to redraw later.
    // TODO background color change should use this rather than remove one.
    // Which also means adding a function to add them back to the map rather
    // than rebuilding the polygons from scratch.
    google.maps.event.clearInstanceListeners(polygons[label]);
    polygons[label].setMap(null);
}

export function removeOne (label) {
    detachOne(label)
    delete polygons[label];
}

export function removeAll () {
    if (Object.keys(polygons).length > 0) {
        for (let key in polygons) {
            removeOne(key)
        }
        polygons = {}
    }
}

export function addOne (x, y, label, opts)  {

    // Make a hexagon on the Google map and store that.
    // x and y are in object coordinates before transform to world xy coords
    // opts:
    // @param opts.overlay: true for overlay

    var hexagon = renderHexagon(y, x, label, opts || {});

    // Store by label
    polygons[label] = hexagon;

    // TODO Add this after rendering all polygons.
    if (rx.get('hoverInfoShowing')) {
        addHoverListeners(hexagon);
    }
    
    // Set the polygon's signature so we can look stuff up for it when 
    // it's clicked.
    hexagon.signature = label;
}

export function addMany (polygons) {
    _.each(polygons, function (hex, id) {
        addOne(hex.x, hex.y, id);
    });
}


exports.setOneColor = function (hexagon, color) {

    // Given a polygon and a color, set the hexagon's fill color.
    hexagon.setOptions({
        fillColor: color
    });
};

