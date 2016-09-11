// svg.js

// A tool to download an svg file of the current viewport

/* global $, FlatProjection, add_tool, polygons, google, googlemap, oper, window */

var app = app || {}; 

(function (hex) { 
    //'use strict';

    var xyMapSize = 5120,
        dims = null,
        initiated = false,
        svg;

    function get_xySvgMap (latLng, dims) {

        // Convert world coordinates within the current viewport
        // to xy map coordinates

        // Transform the world coordinates to xy in the range: 1 - 256
        var xy = get_xyWorld(latLng),

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
            xy = get_xySvgMap(verts.getAt(i), dims);
            points += ' ' + xy.x + ',' + xy.y;
        }

            // Write the svg for this polygon
        return "<polygon"
            + " points='" + points
            + "' fill='" + gp.fillColor
            + "' fill-opacity='" + gp.fillOpacity
            + "' stroke='" + gp.strokeColor
            + "' stroke-width='" + 1
            + "' stroke-opacity='" + gp.strokeOpacity
            + " ' />\n";
    }

    function googleToSvg () {

        // Transform google elements to svg format
        var i,
            sPoly,
            hexagonKeys = findHexagonsInViewport(),
            dims,
            svg;
            
        dims = findPolygonExtents(hexagonKeys, xyMapSize);

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
        for (i in hexagonKeys) {
             sPoly = googleToSvgPoly(polygons[hexagonKeys[i]], dims);
             if (sPoly !== null) {
                svg += sPoly;
             }
        }

        return svg + "</svg>\n";
    }

    function mousedown(event) {

        // The handler for mousedown on the menu option
        // to prepare the svg first.
        svg = googleToSvg();
    }

    function click(event) {

        // The handler for clicking the menu option
        // to actually download it.
        $(event.target).attr("href",
            "data:text/plain;base64," + window.btoa(svg));
    }

    initSvg = function () {
        if (initiated) return;
        initiated = true;
        $('#svgDownload')
            .on('mousedown', mousedown)
            .on('click', click);
    }
})(app);
