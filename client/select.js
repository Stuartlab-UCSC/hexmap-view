
// select.js: Handle the various ways to select hexagons.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

        // boundaries of the selectable area
    var MIN_LAT = -90,
        MAX_LAT = 90,
        MIN_LNG = -95,
        MAX_LNG = 85,

        // Handles of map listeners
        preClickHandle,
        startHandle,
        moveHandle,
        midHandle,
        stopHandle,
        
        savedCursor, // the cursor to return to after the selection is complete
        startLatLng, // Starting point of the selection area
        shape, // google maps selection bounding shape
        isRectangle, // rectangle or polygon?
        guide, // Bounding lines of the selectable area
        color; // Of the selection polygon and area

    function setCursor (cursor) {
        googlemap.setOptions({ draggableCursor: cursor });
    }

    function createRectangle () {

        // Make a rectangle for the selection
        return new google.maps.Rectangle({
            fillColor: color,
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: 1,
            fillOpacity: 0.2,
            clickable: false,
            map: googlemap,
            bounds: new google.maps.LatLngBounds(startLatLng, startLatLng),
            zIndex: 9,
        });
    }

    function createPolygon (paths) {

        // Make a polygon for the selection
        return new google.maps.Polygon({
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: 1.0,
            fillColor: color,
            fillOpacity: 0.2,
            clickable: false,
            map: googlemap,
            paths: paths,
            zIndex: 9,
        });
    }

    function findHexagonsInSelection () {

        // Select the hexagons that are contained within the given polygon.

        // This holds an array of all signature names in our selection polygon.
        var inSelection = [],
            googlePolygonKeys = get_polygons();

        for (i in googlePolygonKeys) {
            var contains = true;
            verts = polygons[googlePolygonKeys[i]].getPath();
            for (j = 0; j < verts.getLength(); j += 1) {
                v = verts.getAt(j);
                 if (!google.maps.geometry.poly.containsLocation(v, shape)) {
                    contains = false;
                    break;
                }
            }
            if (contains) {
                inSelection.push(googlePolygonKeys[i]);
            }
        }
        select_list(inSelection, "user selection");
    }

    function inSelectable (event) {

        // Check for the mouse being inside the selectable area
        if (event.latLng.lng() > MIN_LNG
                && event.latLng.lng() < MAX_LNG
                && event.latLng.lat() > MIN_LAT
                && event.latLng.lat() < MAX_LAT) {
            setCursor('crosshair');
            return true;
        } else {
            setCursor('not-allowed');
            return false;
        }
    }
        
    function finishSelect (event) {

        // Handle the final click of the selection

        // Ignore if outside the selectable area
        if (!inSelectable(event)) return;

        // Don't trigger again
        remove_tool_listener(stopHandle);

        // Stop the dynamic updates.
        remove_tool_listener(moveHandle);

        // The end of the selection
        var latLng = event.latLng;

        if (isRectangle) {

            // Find the paths of the rectangle as if it were a polygon
            var paths = [
                new google.maps.LatLng(startLatLng.lat(), startLatLng.lng()),
                new google.maps.LatLng(latLng.lat(), startLatLng.lng()),
                new google.maps.LatLng(latLng.lat(), latLng.lng()),
                new google.maps.LatLng(startLatLng.lat(), latLng.lng()),
            ];

            // Replace the rectangle with a polygon
            shape.setMap(null);
            shape = createPolygon(paths);

        } else { // polygon

            // Don't trigger a mid-point click again.
            remove_tool_listener(midHandle);

            // Add the last point of the polygon
            shape.getPath().push(event.latLng);

         }

        // Enable the zoom-by-double-click after a delay
        // so the map doesn't pick up the double-click
        setTimeout(function () {
            googlemap.setOptions({
                disableDoubleClickZoom: false,
                draggable: true,
                scrollwheel: true,
            });
        }, 500);

         // Create a selection polygon & find the hexagons in it
         setCursor(savedCursor);
         findHexagonsInSelection();

        // Remove the shapes
        shape.setMap(null);
        guide.setMap(null);
        shape = guide = null;
    }

    function preview (event) {

        // This holds a selection preview event handler that should happen
        // when we mouse over the map after pressing the first point.

        // Ignore if outside the selectable area
        if (!inSelectable(event)) return;

        var latLng = event.latLng;
        if (isRectangle) {
            if(latLng.lng() < startLatLng.lng()) {
                // The user has selected a backwards rectangle, which wraps
                // across the place where the globe is cut. None of our 
                // selections ever need to do this.
                
                // Make the rectangle backwards
                shape.setBounds(new google.maps.LatLngBounds(
                    latLng, startLatLng));    
                
            } else {
                // Make the rectangle forwards
                shape.setBounds(new google.maps.LatLngBounds(
                    startLatLng, latLng));    
            }
        } else { // this is a polygon
            shape.getPath().pop();
            shape.getPath().push(latLng);
        }
    }

    function midSelect (event) {

        // Handle a mid-point click of the selection for a polygon

        // Ignore if outside the selectable area
        if (!inSelectable(event)) return;

        shape.getPath().push(event.latLng);
    }
        
    function startSelect (event) {

        // Handle the first click of the selection

        // Ignore if outside the selectable area
        if (!inSelectable(event)) return;

        // Don't trigger again
        remove_tool_listener(startHandle);

        // Store the start of the selection
        startLatLng = event.latLng;

        // Add a mouse move listener for interactivity
        // Works over the map, hexes, or the shape.
        remove_tool_listener(preClickHandle);
        moveHandle = add_tool_listener("mousemove", preview);

        var stopClick;
        if (isRectangle) {
            shape = createRectangle();
            stopClick = 'click';
        } else {
            shape = createPolygon([startLatLng, startLatLng], true);
            stopClick = 'dblclick';
            midHandle = add_tool_listener("click", midSelect);
        }

        // Attach the stop listener.
        // The listener can still use its own handle because variable 
        // references are resolved at runtime.
        stopHandle = add_tool_listener(stopClick, finishSelect, function() {
            tool_active = false; // this tool is no longer selected
        });
    }

    function setUp() {

        // Disable some events on the map
        googlemap.setOptions({
            disableDoubleClickZoom: true,
            draggable: false,
            scrollwheel: false,
        });

        // Add a listener to start the selection where the user clicks
        startHandle = add_tool_listener("click", startSelect);

        // Add a listener to change the curser if the
        // mouse goes outside the selectable area
        preClickHandle = add_tool_listener("mousemove", inSelectable);

        // Set the selection color depending on the background
        var guideColor;
        if (Session.equals('background', 'white')) {
            color = 'black';
            guideColor = '#ddd';
        } else {
            color = 'white';
            guideColor = '#666';
        }

        // Display guidelines so the user may not try to wrap around the world
        guide = new google.maps.Polygon({
            fillOpacity: 0,
            strokeColor: guideColor,
            strokeWeight: 1,
            strokeOpacity: 1.0,
            clickable: false,
            map: googlemap,
            zIndex: 8,
            paths: [
                {lat: MIN_LAT, lng: MIN_LNG},
                {lat: MAX_LAT, lng: MIN_LNG},
                {lat: MAX_LAT, lng: MAX_LNG},
                {lat: MIN_LAT, lng: MAX_LNG},
            ]
        });
    }

    function addRectSelectTool() {

        // This executes when the toolbar button is pressed.
        isRectangle = true;
        setUp();
    }

    function addPolySelectTool() {

        // This executes when the toolbar button is pressed.
        isRectangle = false;
        setUp();
    }

    initSelect = function () {
    
        // Add the button for the rectangular select to the toolbar
        add_tool("SelectRectangle", "SelectRectangle", addRectSelectTool,
            'Select hexagons using a rectangular region', 'mapOnly');
    
        // Add the button for the polygon select to the toolbar
        add_tool("SelectPolygon", "SelectPolygon", addPolySelectTool,
            'Select hexagons using a polygonal region', 'mapOnly');
    }
})(app);
