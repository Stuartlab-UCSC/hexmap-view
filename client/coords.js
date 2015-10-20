// coords.js
// Handle the coordinates along with google map type and projection.

/* global $ */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var SHOW_COORDS = false, // true = show them, false = not
        xyMapSize = 256,
        dims,
        initialized = false;

    // Define a flat projection
    FlatProjection = function () {
    }
    BlankMapType = function () {
    }

    mapTypeDef = function() {

        // See https://developers.google.com/maps/documentation/javascript/maptypes#Projections
        FlatProjection.prototype.fromLatLngToPoint = function(latLng) {
            // Given a LatLng from -90 to 90 and -180 to 180, transform to an x, y Point 
            // from 0 to 256 and 0 to 256   
            var point = new google.maps.Point((latLng.lng() + 180) * 256 / 360, 
                (latLng.lat() + 90) * 256 / 180);
            
            return point;

        }

        FlatProjection.prototype.fromPointToLatLng = function(point, noWrap) {
            // Given a an x, y Point from 0 to 256 and 0 to 256, transform to a LatLng from
            // -90 to 90 and -180 to 180
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
        // Given a point x, y in map space (0 to 256), get the corresponding LatLng
        return FlatProjection.prototype.fromPointToLatLng(
            new google.maps.Point(x, y));
    }

    getHexLatLngCoords= function (c, len) {

        // Define a hexagon in latLng coordinates, given in xy coordinates
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
        
    findHexagonDims = function (maxX, maxY, zoom, gridSizeIn, wiggleIn) {

        // Find the hexagon dimensions given a maximum X and Y
        // @param maxX
        // @param maxY
        // @param zoom: a zoom level
        // @param gridSize: grid size in the x and y extents
        // @param wiggle: some extra room to account for
        var side_length_x,
            side_length_y,
            sideLen
            wt,
            ht,
            gridSize = _.isUndefined(gridSizeIn) ? 256 : gridSizeIn, // 256 for squiggled hexagons
            wiggle = _.isUndefined(wiggleIn) ? 0 : wiggleIn; // 2 for squiggled hexagons

        var side_length_x = (gridSize)/ (maxX + wiggle) * (2.0 / 3.0);

        // Divide the space into rows and calculate the side length
        // from hex height. Remember to add an extra row for wiggle.
        var side_length_y = ((gridSize)/(maxY + wiggle)) / Math.sqrt(3);

        // How long is a hexagon side in world coords?
        // Shrink it from the biggest we can have so that we don't wrap off the 
        // edges of the map. Divide by 2 to make it fit a grid half the
        // dimensions of the std rgrid
        //var sideLen = Math.min(side_length_x, side_length_y) / 2.0;
        var sideLen = Math.min(side_length_x, side_length_y) / Math.pow(2, zoom);

        // How tall is a hexagon?
        var ht = Math.sqrt(3) * sideLen;

        // How much horizontal space is needed per hex on average, stacked the
        // way we stack them (wiggly)?
        var wt = 3.0/2.0 * sideLen;

        return {len: sideLen, wt: wt, ht: ht}
    }

    get_xyPix = function (latLng) {

        // Given a point LatLng in the range, -90:90, -180:180, get the
        // corresponding point in pixel space, 0:256, 0,256
        return FlatProjection.prototype.fromLatLngToPoint(latLng);
    }

    get_xyMap = function (latLng, dims) {

        // Convert world coordinates within the current viewport
        // to xy map coordinates

        // Transform the world coordinates to xy in the range: 1 - 256
        var xy = get_xyPix(latLng),

            // Offset the xy by the minimum xy of the google polygons,
            // then scale it to our big svg map
            x = (xy.x - dims.xMin) * dims.scale,
            y = (xy.y - dims.yMin) * dims.scale;

        return {x:x, y:y};
    }

    get_polygons = function () {
        var rect = googlemap.getBounds();

        // Because we have a wrap-around map, the lng bounds
        // are always -180:180 for getBounds().
        return find_polygons_in_rectangle(rect.getSouthWest(), rect.getNorthEast());
    }

    findPolygonExtents = function (googlePolygonKeys, xyMapSize) {

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
        min = get_xyPix(new google.maps.LatLng(latMin, lngMin));
        max = get_xyPix(new google.maps.LatLng(latMax, lngMax));

        dims = {};
        dims.xSize = max.x - min.x;
        dims.ySize = max.y - min.y;
        dims.scale = xyMapSize / Math.max(dims.xSize, dims.ySize);
        dims.xSize = dims.xSize * dims.scale;
        dims.ySize = dims.ySize * dims.scale;
        dims.yMin = min.y;
        dims.xMin = min.x;
        return dims;
    }

    initCoords = function () {

        if (initialized || !SHOW_COORDS) return
        initialized = true;

        $('#coords').show();

        var map,
            $el;

        // hide some labels so the coordinates will show instead
        $('#layout-row, #sortText').hide();

        if (Session.equals('page', 'gridPage')) {
            map = getGridMap();
            $el = $('#gridMap');
            dims = findGridExtents(xyMapSize);
        } else {
            map = googlemap;
            $el = $('#visualization');
            dims = findPolygonExtents(get_polygons(), xyMapSize);
        }

        // Set up the handler of mousemove on the map
        google.maps.event.addListener(map, 'mousemove', function (e) {
            var xyMap = get_xyPix(e.latLng),
                xyObj = get_xyMap(e.latLng, dims);
            $('#xObjCoord').text(Math.round(xyObj.x));
            $('#yObjCoord').text(Math.round(xyObj.y));
            $('#xMapCoord').text(Math.round(xyMap.x));
            $('#yMapCoord').text(Math.round(xyMap.y));
            $('#lngCoord').text(Math.round(e.latLng.lng()));
            $('#latCoord').text(Math.round(e.latLng.lat()));
        });
        $el.on('mousemove', function(e) {
            $('#xScrCoord').text(e.screenX);
            $('#yScrCoord').text(e.screenY);
        });

    }
})(app);
