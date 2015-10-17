// svg.js

// A tool to download an svg file of the current viewport

/* global $, FlatProjection, add_tool, polygons, google, googlemap, find_polygons_in_rectangle, oper, window */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var xyMapSize = 5120,
        dims = null,
        initiated = false;

    initSvg = function () {

        if (initiated) return;
        initiated = true;

        add_tool("svg", "SVG", function() {

            function googleToSvgPoly (gp, dims) {

                // Transform a google polygon to an svg polygon
                var verts = gp.getPath(),
                    points = '',
                    i,
                    xy;

                // Transform world coord vertices to our svg xy space
                    for (i = 0; i < verts.getLength(); i += 1) {
                    xy = get_xyMap(verts.getAt(i), dims);
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

            function googleToSvg () {

                // Transform google elements to svg format
                var i,
                    sPoly,
                    googlePolygonKeys = get_polygons(),
                    dims,
                    svg;
                    
                dims = findPolygonExtents(googlePolygonKeys, xyMapSize);

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
                    + " fill='" + Session.get('background') + "'"
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

            var svg = googleToSvg();
            $('#tool_svg').attr({
                href: "data:text/plain;base64," + window.btoa(svg),
                download: "hex.svg",
            });

            // Deselect the tool.
            tool_activity(false);

        }, 'Download visible part of map as SVG', 'mapOnly');
    }
})(app);
