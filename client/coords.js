// coords.js
// Handle the transformations between all coordinate systems.

/* We have three coordinate systems here:
 *
 *       xyIn:   0 -> ?,    0 -> ?   incoming coordinates
 *    xyWorld:   0 -> 256,  0 -> 256 googlemap xy world coordinates
 *     latLng: -90 -> 90, -45 -> 45  latitude, longitude (order as y, x)
 *
 * Tranformation functions:
 *
 *        xyWorld  to  latLng   get_LatLng()
 *         latLng  to  xyWorld  get_xyWorld()
 *         latLng  to  xyIn     get_xyIn_from_xyWorld()
 *           xyIn  to  xyWorld  get_xyWorld_from_xyIn
 *           xyIn  to  latLng   get_latLng_from_xyIn
 */

/* global $ */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var SHOW_COORDS = false, // true = show them, false = not

    // Global: googlemap world size in xy coordinates.
    XY_WORLD_SIZE = 256;

    // Global: specifies a distance to shift the whole grid down and right from
    // the top left corner of the map. This lets us keep the whole thing away
    // from the edges of the "earth", where Google Maps likes to wrap.
    XY_OFFSET = XY_WORLD_SIZE / 4;

    // Global: scaling factor from input coordinates to xy world coordinates.
    xyScale = 1;

    var initialized = false;

    // Define a flat projection
    FlatProjection = function () {
    }
    BlankMapType = function () {
    }

    mapTypeDef = function() {

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
    },

    get_LatLng = function (x, y) {

        // Transform latLng to xyWorld
        return FlatProjection.prototype.fromPointToLatLng(
            new google.maps.Point(x, y));
    }

    function get_xyWorld (latLng) {

        // Transform latLng to xyWorld
        return FlatProjection.prototype.fromLatLngToPoint(latLng);
    }

    findScale = function (maxX, maxY) {

        // Find the scaling factor to convert xyIn to xyWorld
        xyScale = (XY_WORLD_SIZE / 2) / Math.max(maxX, maxY)
        console.log ('xyScale, max:', xyScale, Math.max(maxX, maxY));
    }
 
    get_xyIn_from_xyWorld = function  (x, y) {

        // Transform xyWorld to xyIn. offset then scale
        // =(D3 - 64) / $B$11
        return {
            x: ((x - XY_OFFSET) / xyScale),
            y: ((y - XY_OFFSET) / xyScale)
        };
    }

    get_xyWorld_from_xyIn = function (x, y) {

        // Transform xyIn to xyWorld. scale then offset
        // =$B$11 * C2 + 64
        return {
            x: (x * xyScale + XY_OFFSET),
            y: (y * xyScale + XY_OFFSET)
        };
    }

    get_latLng_from_xyIn = function (x, y) {

        // Transform xyIn to latLng
        var xyWorld = get_xyWorld_from_xyIn(x, y);
        print ('xyWorld:', xyWorld);
        return get_LatLng(xyWorld.x, xyWorld.y);
    }

    getHexLatLngCoords= function (c, len) {

        // TODO should use hexagons.js code instead
        // Define a hexagon in latLng coordinates, given in xyWorld coordinates
        // @param c: the center point as [x,y]
        // @param len: length of the hexagon side
        // @param ht: height of the hexagon

        // If the center is an array, it is in xy coordinates, otherwise the
        // center is a latLng object which needs to be converted to xy
        // coordinates
        var ht = Math.sqrt(3) * len;

        return [
            get_LatLng(c[0] - len, c[1]),
            get_LatLng(c[0] - len / 2, c[1] - ht / 2),
            get_LatLng(c[0] + len / 2, c[1] - ht / 2),
            get_LatLng(c[0] + len, c[1]),
            get_LatLng(c[0] + len / 2, c[1] + ht / 2),
            get_LatLng(c[0] - len / 2, c[1] + ht / 2),
        ];
    }

    get_polygons = function () {

        // This finds all the polygons entirely within the rectangle
        var rect = googlemap.getBounds();

        // Because we have a wrap-around map, the lng bounds
        // are always -180:180 for getBounds().
        return find_polygons_in_rectangle(rect.getSouthWest(), rect.getNorthEast());
        // TODO replace this call with the better one in select.js
    }

    findPolygonExtents = function (googlePolygonKeys, xyWorldSize) {

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
        for (i in googlePolygonKeys) {
            verts = polygons[googlePolygonKeys[i]].getPath();
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
        XY.scale = XY_SCALE = xyWorldSize / Math.max(XY.xSize, XY.ySize);
        XY.xSize = XY.xSize * XY.scale;
        XY.ySize = XY.ySize * XY.scale;
        XY.yMin = min.y;
        XY.xMin = min.x;
        return XY;
    }

    coordsMouseMove = function (e) {
        var xyWorld = get_xyWorld(e.latLng),
            xyIn = get_xyIn_from_xyWorld(xyWorld.x, xyWorld.y);
        $('#xIn').text(round(xyIn.x, 2));
        $('#yIn').text(round(xyIn.y, 2));
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
            XY = findGridExtents(XY_WORLD_SIZE);
        } else {
            map = googlemap;
            $el = $('#visualization');
            XY = findPolygonExtents(get_polygons(), XY_WORLD_SIZE);
        }

        // Set up the handler of mousemove on the map
        google.maps.event.addListener(map, 'mousemove', coordsMouseMove);
    }
})(app);
