// svg.js

// A tool to download an svg file of the current viewport

/* global $, FlatProjection, add_tool, polygons, google, googlemap, find_polygons_in_rectangle, selected_tool, window */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    initSvg = function () {

        function get_xy(latLng) {
            // Given a point LatLng in the range, -90:90, -180:180, get the
            // corresponding point in pixel space, 0:256, 0,256
            return FlatProjection.prototype.fromLatLngToPoint(latLng);
        }

        add_tool("download", "Download", function() {
            var svgMapSize = 5120;


            function get_svgXy(latLng, dims) {

                // Convert world coordinates within the current viewport
                // to our svg xy coordinates

                // Transform the world coordinates to xy in the range: 1 - 256
                var xy = get_xy(latLng),

                    // Offset the xy by the minimum xy of the google polygons,
                    // then scale it to our big svg map
                    x = (xy.x - dims.xMin) * dims.scale,
                    y = (xy.y - dims.yMin) * dims.scale;

                return {x:x, y:y};
            }

            function googleToSvgPoly (gp, dims) {

                // Transform a google polygon to an svg polygon
                var verts = gp.getPath(),
                    points = '',
                    i,
                    xy;

                // Transform world coord vertices to our svg xy space
                    for (i = 0; i < verts.getLength(); i += 1) {
                    xy = get_svgXy(verts.getAt(i), dims);
                    points += ' ' + xy.x + ',' + xy.y;
                }

                    // Write the svg for this polygon
                return "<polygon"
                    + " points='" + points
                    + "' fill='" + gp.fillColor
                    + "' fill-opacity='" + gp.fillOpacity
                    + "' stroke='" + gp.strokeColor
                    + "' stroke-width='" + 1
                    //+ "' stroke-width='" + gp.strokeWeight
                    + "' stroke-opacity='" + gp.strokeOpacity
                    + " ' />\n";
            }

            function findPolygonExtents(googlePolygonKeys) {

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
                    lngMax = 0,
                    dims = {};
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
                min = get_xy(new google.maps.LatLng(latMin, lngMin));
                max = get_xy(new google.maps.LatLng(latMax, lngMax));

                dims.xSize = max.x - min.x;
                dims.ySize = max.y - min.y;
                dims.scale = svgMapSize / Math.max(dims.xSize, dims.ySize);
                dims.xSize = dims.xSize * dims.scale;
                dims.ySize = dims.ySize * dims.scale;
                dims.yMin = min.y;
                dims.xMin = min.x;
                return dims;
            }

            function googleToSvg (googlePolygonKeys) {

                // Transform google elements to svg format
                var i,
                    sPoly,
                    i,
                    min,
                    max,
                    dims = findPolygonExtents(googlePolygonKeys),

                    // Define the svg element,
                    // setting its size to that of the visible polygons area
                    svg = "<svg xmlns:svg='http://www.w3.org/2000/svg'"
                        + " width='" + dims.xSize
                        + "' height='" + dims.ySize
                        + "' style='z-index:102;border: 1px solid black'"
                        + ">\n";

                // Add a background to the svg area
                svg += "'<rect"
                    + " x='1' y='1'"
                    + " width='100%'"
                    + " height='100%'"
                    + " fill='white'" // TODO use var instead of literal
                    + " ></rect>\n";

                // Transform each polygon to xy space
                for (i in googlePolygonKeys) {
                     sPoly = googleToSvgPoly(polygons[googlePolygonKeys[i]], dims);
                     if (sPoly !== null) {
                        svg += sPoly;
                     }
                }

                return svg + "</svg>\n";
            }

            function getViewport() {
                var rect = googlemap.getBounds(),
                    viewport;

                // TODO Because we have a wrap-around map, the lng bounds
                // are always -180:180 for getBounds(). How do we get the viewport?

                viewport = {
                    start: rect.getSouthWest(),
                    end: rect.getNorthEast()
                };
                return viewport;
            }

            function init () {

                var viewport = getViewport(),
                    googleElements = find_polygons_in_rectangle(
                            viewport.start, viewport.end
                        ),
                    svg = googleToSvg(googleElements, viewport);
                $('#svgAnchor').empty();

                    // Add a hidden download file link. The "download"
                    // attribute makes the browser save it, and the
                    // href data URI holds the data
                    var $link = $('<a/>')
                        .attr({
                            download: 'hex.svg',
                            href: 'data:text/plain;base64,' + window.btoa(svg)
                        })
                        .text('download')
                        .css('display', 'none');
                    $('#body').append($link);
                    $link[0].click();
                    $link.remove();
                }

        init();

		// Deselect the tool.	
        ctx.selected_tool = undefined;

    }, 'Download visible part of map as SVG');
    };
})(app);
