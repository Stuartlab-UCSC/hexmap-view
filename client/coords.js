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
 *        xyWorld  to  latLng   get_LatLng
 *         latLng  to  xyWorld  get_xyWorld
 *         latLng  to  xyHex    get_xyHex_from_xyWorld
 *          xyHex  to  xyWorld  get_xyWorld_from_xyHex
 *          xyHex  to  latLng   get_latLng_from_xyHex
 *           xyIn  to  xyWorld  get_xyIn_from_xyWorld
 *        xyWorld  to  xyIn     get_xyWorld_from_xyIn
 */

/* global $ */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    SHOW_COORDS = false, // true = show them, false = not

    // Global: googlemap world size in xy coordinates.
    XY_WORLD_SIZE = 256;

    // Global: specifies a distance to shift the whole grid down and right from
    // the top left corner of the map. This lets us keep the whole thing away
    // from the edges of the "earth", where Google Maps likes to wrap.
    XY_OFFSET = XY_WORLD_SIZE / 4;

    // Global: scaling factor from input coordinates to xy world coordinates.
    xyScale = 1;
 
    // Hexagon side length, height & width in xy world coordinates for main map
    sideLen = 0;
    hexWidth = 0;
    hexHeight = 0;

    var initialized = false;

    // Define a flat projection
    FlatProjection = function () {
    }
    BlankMapType = function () {
    }

    initMapType = function() {

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
            div.style.backgroundColor = (Session.equals('page', 'gridPage'))
                ? 'white'
                : Session.get('background');
            
            return div;
        }

        BlankMapType.prototype.name = "Blank";
        BlankMapType.prototype.alt = "Blank Map";
        BlankMapType.prototype.projection = new FlatProjection();
    }

    function findScale (maxX, maxY) {

        // Find the scaling factor to convert xyHex to xyWorld
        maxXy = Math.max(maxX, maxY);
        xyScale = (XY_WORLD_SIZE / 2) / maxXy;
        maxXy = Math.round(maxXy);

        // Set the input coords range display
        if (SHOW_COORDS) {
            $('.inputRange').text('0 to ' + maxXy + ', 0 to ' + maxXy);
        }
    }
 
    get_LatLng = function (x, y) {

        // Transform latLng to xyWorld
        return FlatProjection.prototype.fromPointToLatLng(
            new google.maps.Point(x, y));
    }

    get_xyWorld = function (latLng) {

        // Transform latLng to xyWorld
        return FlatProjection.prototype.fromLatLngToPoint(latLng);
    }

    get_xyWorld_from_xyIn = function (x, y) {

        // Transform xyIn to xyWorld. scale then offset
        return {
            x: (x * xyScale + XY_OFFSET),
            y: (y * xyScale + XY_OFFSET)
        };
    }

    get_xyWorld_from_xyHex = function (xHex, yHex) {

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

    get_xyIn_from_xyWorld = function  (x, y) {

        // Transform xyWorld to xyIn. offset then scale
        return {
            x: ((x - XY_OFFSET) / xyScale),
            y: ((y - XY_OFFSET) / xyScale)
        };
    }

    get_xyHex_from_xyWorld = function  (xWorld, yWorld) {

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

    get_latLng_from_xyHex = function (x, y) {

        // Transform xyHex to latLng
        var xyWorld = get_xyWorld_from_xyHex(x, y);
        print ('xyWorld:', xyWorld);
        return get_LatLng(xyWorld.x, xyWorld.y);
    }

    findDimensions = function (max_x, max_y) {

        // Find the hexagon side length, height and width.

        // Find the scale for transforming from input coords to xy world coords
        findScale(max_x, max_y);
 
        sideLen = (xyScale) * (2.0 / 3.0);
        hexWidth = 3.0/2.0 * sideLen;
        hexHeight = Math.sqrt(3) * sideLen;
    }

    getHexLatLngCoords = function (center, len) {

        // Define a hexagon in latLng coordinates, given in xyWorld coordinates
        // @param c: the center point as {x: val, y: val}
        // @param len: length of the hexagon side
        var ht = Math.sqrt(3) * len,
            x = center.x,
            y = center.y;

        return [
            get_LatLng(x - len, y),
            get_LatLng(x - len / 2, y - ht / 2),
            get_LatLng(x + len / 2, y - ht / 2),
            get_LatLng(x + len, y),
            get_LatLng(x + len / 2, y + ht / 2),
            get_LatLng(x - len / 2, y + ht / 2),
        ];
    }

    findPolygonExtents = function (hexagonKeys, xyMapSize) {

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
        min = get_xyWorld(new google.maps.LatLng(latMin, lngMin));
        max = get_xyWorld(new google.maps.LatLng(latMax, lngMax));

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

    function coordsMouseMove (e) {
        var xyWorld = get_xyWorld(e.latLng),
            xy;
        if (Session.equals('page', 'gridPage')) {
            xy = get_xyIn_from_xyWorld(xyWorld.x, xyWorld.y);
        } else {
            xy = get_xyHex_from_xyWorld(xyWorld.x, xyWorld.y);
        }
        $('#xIn').text(round(xy.x, 1));
        $('#yIn').text(round(xy.y, 1));
        $('#xWorld').text(round(xyWorld.x, 2));
        $('#yWorld').text(round(xyWorld.y, 2));
        $('#lngCoord').text(round(e.latLng.lng()));
        $('#latCoord').text(round(e.latLng.lat()));
    }

    initCoords = function () {

        if (initialized || !SHOW_COORDS) return
        initialized = true;

        $('#coords').show();

        var map,
            $el;

        if (Session.equals('page', 'gridPage')) {
            map = getGridMap();
            $el = $('#gridMap');
        } else {
            map = googlemap;
            $el = $('#visualization');
        }

        // Set up the handler of mousemove on the map
        google.maps.event.addListener(map, 'mousemove', coordsMouseMove);
    }
 
    Session.set('initializedMapType', true);
})(app);
