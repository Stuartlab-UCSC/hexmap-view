// hexagon.js
// Handle things to do with hexagons.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    // Global: hold objects of polygons by signature name
    polygons = {};

    // What's the minimum number of pixels that sideLen must represent at the
    // current zoom level before we start drawing hex borders?
    var MIN_BORDER_SIZE = 10;

    // And how thick should the border be when drawn?
    var HEX_STROKE_WEIGHT = 2;

    function renderHexagon (row, column, overlayNode) {

        // Make a new hexagon representing the hexagon at the given xy object
        // space before transform to xy world space.
        // Returns the Google Maps polygon.
 
        var xy = get_xyWorld_from_xyHex(column, row),
            x = xy.x,
            y = xy.y;
 
        var coords = getHexLatLngCoords(xy, sideLen);

        // Construct the Polygon
        var hexagon = new google.maps.Polygon({
            paths: coords,
            strokeOpacity: 1.0,
            fillColor: "#FF0000",
            fillOpacity: 1.0,
            zIndex: overlayNode ? 200 : 1, // overlays are on top
        });
        setHexagonStroke(hexagon);
        
        // Attach the hexagon to the global map
        // if (overlayNode) // OVERLAY TODO
        hexagon.setMap(googlemap);
 
        // Save the honeycomb coordinates with the hexagon
        hexagon.xHex = column;
        hexagon.yHex = row;

        // Set up the click listener to move the global info window to this hexagon
        // and display the hexagon's information
        // TODO use a session var
        google.maps.event.addListener(hexagon, "click", function (event) {
            showInfoWindow(event, hexagon, xy.x, xy.y);
        });

        // Subscribe the tool listeners to events on this hexagon
        subscribe_tool_listeners(hexagon);
        
        return hexagon;
    } 

    function setHexagonStroke(hexagon) {
        // Given a polygon, set the weight of hexagon's border stroke, in number of
        // screen pixels, and the border color.

        // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
        // So this holds the number of pixels that the global length sideLen 
        // corresponds to at this zoom level.
        var weight = (sideLen * Math.pow(2, ctx.zoom) >= MIN_BORDER_SIZE)
                ? HEX_STROKE_WEIGHT
                : 0;

        hexagon.setOptions({
            strokeWeight: weight,
            strokeColor: Session.get('background'),
        });
    }

    function assignmentValues (layout_index) {

        // Download the signature assignments to hexagons and fill in the global
        // hexagon assignment grid.
        var file = "assignments" + layout_index +".tab"
        Meteor.call('getTsvFile', file,
            ctx.project, function (error, parsed) {;

            // This is an array of rows, which are arrays of values:
            // id, x, y

            if (error) {
                projectNotFound(file);
                return;
            }

            // This holds the maximum observed x & y
            var max_x = max_y = 0;
            polygons = {};

            // Find the max x and y.
            for (var i = 0; i < parsed.length; i++) {
                var x = parseInt(parsed[i][1]),
                    y = parseInt(parsed[i][2]);
                max_x = Math.max(x, max_x);
                max_y = Math.max(y, max_y);
            }

            findDimensions(max_x, max_y);

            // Loop through again and draw the polygons, now that
            // we know how big they have to be.
            for (var i = 0; i < parsed.length; i++) {

                // Get the label
                var label = parsed[i][0];
                
                if (label == "") {
                    // Blank line
                    continue;
                }
                
                // Get the x coord
                var x = parseInt(parsed[i][1]);
                // And the y coord
                var y = parseInt(parsed[i][2]);

                addHexagon (x, y, label);
            }
            
            // Now that the polygons exist, do the initial redraw to set all
            // their colors corectly. In case someone has messed with the
            // controls.
            // TODO: can someone yet have messed with the controlls?
            refresh();

            // Trigger an idle event to initialize tools requiring polygons
            // to be drawn
            setTimeout(function () {
                initMapDrawn();
                /*
                // TODO This doesn't always work, so we need a better way
                mapDrawnListener = google.maps.event.addListener(
                    googlemap, 'idle', initMapDrawn);
                var center = googlemap.getCenter()
                googlemap.setCenter(new google.maps.LatLng(
                    center.lat(), center.lng()));
                */
                }, 1000);
        });
    }

    addHexagon = function (x, y, label, overlayNode) {

        // Make a hexagon on the Google map and store that.
        // x and y are in object coordinates before transform to world xy coords
        var hexagon = renderHexagon(y, x, overlayNode);

        // Store by label
        polygons[label] = hexagon;
        
        // Set the polygon's signature so we can look stuff up for it when 
        // it's clicked.
        hexagon.signature = label;
    }

    // Turns off hex borders if we zoom out far enough, and turn them on
    // again if we come back.
    setHexagonStrokes = function () {
        for (var signature in polygons) {
            setHexagonStroke(polygons[signature]);
        }
    }

    setHexagonColor = function (hexagon, color) {

        // Given a polygon, set the hexagon's current background 
        // color.
        hexagon.setOptions({
            fillColor: color
        });
    }

    initHexagons = function (layout_index) {
        assignmentValues(layout_index);
    }
})(app);
