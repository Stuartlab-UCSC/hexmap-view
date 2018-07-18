/*
 * coords.js
 *
 * Handle the transformations between the coordinate systems.
 * We have four coordinate systems here:
 *
 *    xyIn:   0 -> ?,    0 -> ?   incoming coords in xy space for node density
 *   xyHex:   0 -> ?,    0 -> ?   incoming coords in honeycomb space for main map
 * xyWorld:   0 -> 256,  0 -> 256 googlemap xy world coords
 *  latLng: -90 -> 90, -45 -> 45  latitude, longitude (order as y, x)
 *
 * Honeycomb space is indexed like so:
 *         -----       -----
 *        /     \     /     \
 *   -----  1,0  -----  3,0  |
 *  /     \     /     \     /
 * |  0,0  -----  2,0  -----
 *  \     /     \     /     \
 *   -----  1,1  -----  3,1  |
 *        \     /     \     /
 *         -----       -----
 *
 * Tranformation functions:
 *
 *        xyWorld  to  latLng   exports.get_LatLng
 *         latLng  to  xyWorld  get_xyWorld
 *         latLng  to  xyHex    get_xyHex_from_xyWorld
 *          xyHex  to  xyWorld  get_xyWorld_from_xyHex
 *          xyHex  to  latLng   get_latLng_from_xyHex
 *           xyIn  to  xyWorld  get_xyIn_from_xyWorld
 *        xyWorld  to  xyIn     get_xyWorld_from_xyIn
 */

import util from '/imports/common/util.js';
import './coords.html';
import rx from '/imports/common/rx'

var SHOW_COORDS = false; // true = show them, false = not

// Global: googlemap world size in xy coordinates.
var XY_WORLD_SIZE = 256;

// Global: specifies a distance to shift the whole grid down and right from
// the top left corner of the map. This lets us keep the whole thing away
// from the edges of the "earth", where Google Maps likes to wrap.
var XY_OFFSET = XY_WORLD_SIZE / 2.7;

// Global: scaling factor from input coordinates to xy world coordinates.
var xyScale = 1;

// Hexagon side length, height & width in xy world coordinates for main map
var sideLen = 0;
var hexWidth = 0;
var hexHeight = 0;

var initialized = false;
var unsub = {}

function findScale (maxX, maxY) {

    // Find the scaling factor to convert xyHex to xyWorld
    maxXy = Math.max(maxX, maxY);
    xyScale = (XY_WORLD_SIZE / 4) / maxXy;
    maxXy = Math.round(maxXy);

    // Set the input coords range display
    if (SHOW_COORDS) {
        $('.inputRange').text('0 to ' + maxXy + ', 0 to ' + maxXy);
    }
}

function coordsMouseMove (e) {
    var xyWorld = exports.get_xyWorld(e.latLng),
        xy= get_xyHex_from_xyWorld(xyWorld.x, xyWorld.y);
    $('#xIn').text(util.round(xy.x, 1));
    $('#yIn').text(util.round(xy.y, 1));
    $('#xWorld').text(util.round(xyWorld.x, 2));
    $('#yWorld').text(util.round(xyWorld.y, 2));
    $('#lngCoord').text(util.round(e.latLng.lng()));
    $('#latCoord').text(util.round(e.latLng.lat()));
}

exports.getShowCoords = function () {
    return SHOW_COORDS;
}

exports.getSideLen = function () {
    return sideLen;
}

var FlatProjection = function () {};
var BlankMapType = function () {};

function initMapType () {

    // See https://developers.google.com/maps/documentation/javascript/maptypes#Projections
    FlatProjection.prototype.fromLatLngToPoint = function(latLng) {
        // Given a LatLng from -90 to 90 and -180 to 180, transform to an
        // x, y Point from 0 to 256 and 0 to 256
        var xyWorld = new google.maps.Point((latLng.lng() + 180) * 256 / 360,
            (latLng.lat() + 90) * 256 / 180);
        
        return xyWorld;
    }

    FlatProjection.prototype.fromPointToLatLng = function(point, noWrap) {
        // Given a an x, y Point from 0 to 256 and 0 to 256, transform to
        // a LatLng from -90 to 90 and -180 to 180
        var latLng = new google.maps.LatLng(point.y * 180 / 256 - 90,
            point.x * 360 / 256 - 180, noWrap);
        
        return latLng;
    }

    // Define a Google Maps MapType that's all blank
    // See https://developers.google.com/maps/documentation/javascript/examples/maptype-base
    BlankMapType.prototype.tileSize = new google.maps.Size(256,256);
    BlankMapType.prototype.maxZoom = 19;

    BlankMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        // This is the element representing this tile in the map
        // It should be an empty div
        var div = ownerDocument.createElement("div");
        div.style.width = this.tileSize.width + "px";
        div.style.height = this.tileSize.height + "px";
        div.style.backgroundColor = rx.get('background');
        
        return div;
    }

    BlankMapType.prototype.name = "Blank";
    BlankMapType.prototype.alt = "Blank Map";
    BlankMapType.prototype.projection = new FlatProjection();
}

export class BlankMap extends BlankMapType{};

exports.get_LatLng = function (x, y) {

    // Transform latLng to xyWorld
    return FlatProjection.prototype.fromPointToLatLng(
        new google.maps.Point(x, y));
}

exports.get_xyWorld = function (latLng) {

    // Transform latLng to xyWorld
    return FlatProjection.prototype.fromLatLngToPoint(latLng);
}

exports.get_xyWorld_from_xyIn = function (x, y) {

    // Transform xyIn to xyWorld. scale then offset
    return {
        x: (x * xyScale + XY_OFFSET),
        y: (y * xyScale + XY_OFFSET)
    };
}

exports.get_xyWorld_from_xyHex = function (xHex, yHex) {

    // Transform xyHex coordinates into xyWorld. scale then offset
    var x = xHex * hexWidth,
        y = yHex * hexHeight;

    // Odd columns get bumped up.
    if (xHex % 2 == 1) {
        y -= hexHeight / 2;
    }

    // Apply the offset.
    return {
        x: x + XY_OFFSET,
        y: y + XY_OFFSET,
    }
}

function get_xyIn_from_xyWorld (x, y) {

    // Transform xyWorld to xyIn. offset then scale
    return {
        x: ((x - XY_OFFSET) / xyScale),
        y: ((y - XY_OFFSET) / xyScale)
    };
}

function get_xyHex_from_xyWorld (xWorld, yWorld) {

    // Transform xyWorld coordinates to xyHex. offset then scale
    var x = xWorld - XY_OFFSET,
        y = yWorld - XY_OFFSET;

    // Find the honeycomb x-coordinate.
    var xi = Math.floor(x / hexWidth);

    // Odd columns get bumped down.
    if (xi % 2 == 1) {
        y += hexHeight / 2;
    }

    // Apply the scaling factor.
    return {
        x: x / hexWidth,
        //x: xi, // for integer honeycomb grid index
        y: y / hexHeight,
        //y: Math.floor(y / hexHeight),  // for integer honeycomb grid index
    };
}

exports.get_latLng_from_xyHex = function (x, y) {

    // Transform xyHex to latLng
    var xyWorld = exports.get_xyWorld_from_xyHex(x, y);
    return exports.get_LatLng(xyWorld.x, xyWorld.y);
}

exports.findDimensions = function (max_x, max_y) {

    // Find the hexagon side length, height and width.

    // Find the scale for transforming from input coords to xy world coords
    findScale(max_x, max_y);

    sideLen = (xyScale) * (2.0 / 3.0);
    hexWidth = 3.0/2.0 * sideLen;
    hexHeight = Math.sqrt(3) * sideLen;
}

exports.getHexLatLngCoords = function (center, len) {

    // Define a hexagon in latLng coordinates, given in xyWorld coordinates
    // @param c: the center point as {x: val, y: val}
    // @param len: length of the hexagon side
    var ht = Math.sqrt(3) * len,
        x = center.x,
        y = center.y;

    return [
        exports.get_LatLng(x - len, y),
        exports.get_LatLng(x - len / 2, y - ht / 2),
        exports.get_LatLng(x + len / 2, y - ht / 2),
        exports.get_LatLng(x + len, y),
        exports.get_LatLng(x + len / 2, y + ht / 2),
        exports.get_LatLng(x - len / 2, y + ht / 2),
    ];
}

exports.findPolygonExtents = function (hexagonKeys, xyMapSize) {

    // Find the extents of the visible google polygons
        var i,
            j,
            verts,
            v,
            min,
            max,
        latMin = 0,
        latMax = 0,
        lngMin = 0,
        lngMax = 0;
    for (i in hexagonKeys) {
        verts = polygons[hexagonKeys[i]].getPath();
        for (j = 0; j < verts.getLength(); j += 1) {
            v = verts.getAt(j);
            latMin = Math.min(latMin, v.lat());
            latMax = Math.max(latMax, v.lat());
            lngMin = Math.min(lngMin, v.lng());
            lngMax = Math.max(lngMax, v.lng());
        }
    }
    min = exports.get_xyWorld(new google.maps.LatLng(latMin, lngMin));
    max = exports.get_xyWorld(new google.maps.LatLng(latMax, lngMax));

    var XY = {};
    XY.xSize = max.x - min.x;
    XY.ySize = max.y - min.y;
    XY.scale = xyMapSize / Math.max(XY.xSize, XY.ySize);
    XY.xSize = XY.xSize * XY.scale;
    XY.ySize = XY.ySize * XY.scale;
    XY.yMin = min.y;
    XY.xMin = min.x;
    return XY;
}

exports.centerToLatLng = function (centerIn) {

    // If needed, create the center or translate from an array to latLng.
    var center = centerIn;
    if (_.isNull(center)) {
        center = [0, 0];
    }
    if (Array.isArray(center)) {

        // This is stored as an array of two numbers rather
        // than as the google-specific latLng.
        center = new google.maps.LatLng(center[0], center[1]);
    }
    return center;
};

showCoords = () => {
    if (rx.get('init.map') !== 'rendered') {
        return
    }
    
    unsub.showCoords()
    
    $('#coords').show();

    var map = googlemap,
        $el = $('#visualization');

    // Set up the handler of mousemove on the map
    google.maps.event.addListener(map, 'mousemove', coordsMouseMove);
}

exports.init = function () {

    if (initialized ) return;
    initialized = true;
    
    initMapType();
    
    if (SHOW_COORDS) {
        unsub.showCoords = rx.subscribe(showCoords)
    }
}
