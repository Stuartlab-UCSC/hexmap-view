// hexagon.js
// Handle things to do with hexagons.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    // Specifies a distance to shift the whole grid down and right from the top
    // left corner of the map. This lets us keep the whole thing away from the
    // edges of the "earth", where Google Maps likes to wrap.
    var GRID_OFFSET = 256/4;

    // Hexagon side length, height & width in xy world coordinates
    var sideLen,
        hexWidth,
        hexHeight;

    // What's the minimum number of pixels that sideLen must represent at the
    // current zoom level before we start drawing hex borders?
    var MIN_BORDER_SIZE = 10;

    // And how thick should the border be when drawn?
    var HEX_STROKE_WEIGHT = 2;

    // This holds an object of polygons by signature name
    polygons = {};

    function renderHexagon (row, column, overlayNode) {

        // Make a new hexagon representing the hexagon at the given xy object
        // space before transform to xy world space.
        // Returns the Google Maps polygon.
        
        // First, what are x & y in 0-256 world coordinates?
        var x = column * hexWidth;
        var y = row * hexHeight;
        if (column % 2 == 1) {
            // Odd columns go up
            y -= hexHeight / 2; 
        }
        
        // Apply the grid offset to this hex
        x += GRID_OFFSET;
        y += GRID_OFFSET;
        
        // That got X and Y for the top left corner of the bounding box. Shift
        // to the center.
        x += sideLen;
        y += hexHeight / 2;
        
        // Offset the whole thing so no hexes go off the map when they wiggle up
        y += hexHeight / 2;
        
        // This holds an array of all the hexagon vertices
        var coords = [
            get_LatLng(x - sideLen, y),
            get_LatLng(x - sideLen / 2, y - hexHeight / 2),
            get_LatLng(x + sideLen / 2, y - hexHeight / 2),
            get_LatLng(x + sideLen, y),
            get_LatLng(x + sideLen / 2, y + hexHeight / 2),
            get_LatLng(x - sideLen / 2, y + hexHeight / 2),
        ];
        
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
        // if (overlayNode) // OVERLAY
        hexagon.setMap(googlemap);
        
        // Set up the click listener to move the global info window to this hexagon
        // and display the hexagon's information
        // TODO use a session var
        google.maps.event.addListener(hexagon, "click", function (event) {
            showInfoWindow(event, hexagon, x, y);
        });
        // OVERLAY
        //google.maps.event.addListener(hexagon, 'mousemove', coordsMouseMove);

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

    function findDimensions(max_x, max_y) {

        console.log('max x, y', max_x, max_y);

        // Find the dimensions for the general case of transforming
        // object coordinates to xy world coordinates

        // Find the dimensions of hexagons in world xy coordinates
        // We need to fit this whole thing into a 256x256 grid.
        // How big can we make each hexagon?
        // TODO: Do the algebra to make this exact. Right now we just make a
        // grid that we know to be small enough.
        // Divide the space into one column per column, and calculate 
        // side length from column width. Add an extra column for dangling
        // corners.
        var side_length_x = (256)/ (max_x + 2) * (2.0 / 3.0);

        // Divide the space into rows and calculate the side length
        // from hex height. Remember to add an extra row for wiggle.
        var side_length_y = ((256)/(max_y + 2)) / Math.sqrt(3);

        // How long is a hexagon side in world xy coords?
        // Shrink it from the biggest we can have so that we don't wrap off the 
        // edges of the map. Divide by 2 to make it fit a 128x128 grid
        sideLen = Math.min(side_length_x, side_length_y) / 2.0;
        console.log('sideLen:', sideLen);

        // How much horizontal space is needed per hex on average, stacked the 
        // way we stack them (wiggly)?
        hexWidth = 3.0/2.0 * sideLen;

        // How tall is a hexagon?
        hexHeight = Math.sqrt(3) * sideLen;

        // Finally,
    }

    function assignmentValues (layout_index) {

        console.log('top of assignmentValues');

        // Download the signature assignments to hexagons and fill in the global
        // hexagon assignment grid.
        Meteor.call('getTsvFile', "assignments" + layout_index +".tab",
            ctx.project, Session.get('proxPre'), function (error, parsed) {;

            // This is an array of rows, which are arrays of values:
            // id, x, y

            if (error) {
                projectNotFound();
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
            
            // Now that the polygons exist, do the initial redraw to set all their
            // colors corectly. In case someone has messed with the controls.
            // TODO: can someone yet have messed with the controlls?
            refresh();

            // Trigger an idle event to initialize tools requiring polygons
            // to be drawn
            center = googlemap.getCenter()
            googlemap.setCenter(new google.maps.LatLng(center.lat(),
                center.lng() + .000000001));
            mapDrawnListener = google.maps.event.addListener(
                googlemap, 'idle', initMapDrawn);

        console.log('bottom of assignmentValues');

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
        //initOverlayNodes();
    }
})(app);
