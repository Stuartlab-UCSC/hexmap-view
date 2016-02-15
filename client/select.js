
// select.js: Handle the various ways to select hexagons.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

        // boundaries of the selectable area
    var MIN_LAT = -90,
        MAX_LAT = 90,
        MIN_LNG = -95,
        MAX_LNG = 85,
        GUIDE_COLOR = 'orange',

        // Handles of map listeners
        preClickHandle,
        startHandle,
        moveHandle,
        midHandle,
        stopHandle,
        
        savedCursor, // Cursor to return reinstate after the selection is complete
        startLatLng, // Starting point of the selection area
        shape, // Google maps selection boundary: rectangle or polygon
        isRectangle, // Rectangle or polygon?
        guide, // Bounding lines of the selectable area
        color; // Color of the selection boundary and fill

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

    function hexagonCursor (on) {

        // Set the cursor on or off when hovering over the hexagons
        _.each(get_polygons(), function(hex) {
            polygons[hex].setOptions({clickable: on});
        });
    }

    function findHexagonsInPolygon () {
        // TODO use this routine instead of find_polygons_in_rectangle
        // everywhere else

        // Select the hexagons that are contained within the given polygon.
        var inSelection = _.filter(get_polygons(), function(hex) {
            var contains = true;
            verts = polygons[hex].getPath();
            for (j = 0; j < verts.getLength(); j += 1) {
                v = verts.getAt(j);
                 if (!google.maps.geometry.poly.containsLocation(v, shape)) {
                    contains = false;
                    break;
                }
            }
            return contains;
        });
        select_list(inSelection, "user selection");
    }

    function inSelectable (event) {

        // Check for the mouse being inside the selectable area
        if (event.latLng.lng() > MIN_LNG
                && event.latLng.lng() < MAX_LNG
                && event.latLng.lat() > MIN_LAT
                && event.latLng.lat() < MAX_LAT) {
            setCursor('crosshair');
            guide.setOptions({strokeWeight: 0});
            return true;
        } else {
            setCursor('help');
            guide.setOptions({strokeWeight: 1});
            return false;
        }
    }
        
    function finishSelect (event) {

        // Handle the final click of the selection

        // Ignore if outside the selectable area
        inSelectable(event);

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

        // Enable the zoom-by-double-click,
        // after a delay so the map doesn't pick up the double-click
        setTimeout(function () {
            googlemap.setOptions({
                disableDoubleClickZoom: false,
                draggable: true,
                scrollwheel: true,
            });
        }, 500);

         // Create a selection polygon & find the hexagons in it
         setCursor(savedCursor);
         findHexagonsInPolygon();

        // Remove the bounding polygons and reset the hover curser for hexagons
        shape.setMap(null);
        guide.setMap(null);
        shape = guide = null;
        hexagonCursor(true);
    }

    function midSelect (event) {

        // Handle a mid-point click of the selection for a polygon

        // Change cursor and bounding box if needed
        inSelectable(event);

        shape.getPath().push(event.latLng);
    }
        
    function preview (event) {

        // This holds a selection preview event handler that should happen
        // when we mouse over the map after pressing the first point.

        // Change cursor and bounding box if needed
        inSelectable(event);

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

    function startSelect (event) {

        // Handle the first click of the selection

        // Ignore if outside the selectable area
        inSelectable(event);

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
            tool_activity(false); // this tool is no longer selected
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
        color = (Session.equals('background', 'white'))
            ? 'black'
            : 'white';

        // Create guidelines so the user might understand
        // the selection area might wrap around the world
        guide = new google.maps.Polygon({
            fillOpacity: 0,
            strokeColor: GUIDE_COLOR,
            strokeWeight: 0,
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

        // Turn off the cursor for hovering over hexagons
        hexagonCursor(false);
    }

    function select_string(string) {

        // The actual text to selection import function used by that tool
        // Given a string of hex names, one per line, make a selection of all those
        // hexes.
        
        // This is an array of signature names entered.
        var to_select = [];
        
        // This holds the array of lines. Split on newlines (as seen in
        // jQuery.tsv.js)
        var lines = string.split(/\r?\n/);
        
        for(var i = 0; i < lines.length; i++) {
            // Trim and add to our requested selection
            var line = lines[i].trim();
            if (line.length > 0) {
                to_select.push(lines[i].trim());
            }
        }

        if (to_select.length > 0) {
        
            // Add a selection with as many of the requested hexes as actually exist and
            // pass the current filters.
            select_list(to_select);

        // TODO future use
        } else if (to_select.length > 0) {

            // With only one selected, we will assume the user does not want to
            // create a selection, but just find this hexagon
            infoWindowFindHexagon(to_select[0]);
        }
    }

    function selectImport() {

        // A tool for importing a list of hexes as a selection
        // Make the import form
        var import_form = $("<form/>").attr("title", 
            "Select by Identifier");

        import_form.append($("<div/>").text("Hexagon IDs, one per line:"));

        // A big text box
        var text_area = $("<textarea/>").addClass("import");
            import_form.append(text_area);
        
            import_form.append($("<div/>").text(
                "Open a file:"));
            
        // This holds a file form element
        var file_picker = $("<input/>").attr("type", "file").addClass("import");
        
        import_form.append(file_picker);
        
        file_picker.change(function(event) {
            // When a file is selected, read it in and populate the text box.
            
            // What file do we really want to read?
            var file = event.target.files[0];
            
            // Make a FileReader to read the file
            var reader = new FileReader();
            
            reader.onload = function(read_event) {  
                // When we read with readAsText, we get a string. Just stuff it
                // in the text box for the user to see.
                text_area.text(reader.result);
            };
            
            // Read the file, and, when it comes in, stick it in the textbox.
            reader.readAsText(file);
        });
        
        import_form.dialog({
            dialogClass: 'dialog',
            modal: true,
            width: '20em',
            buttons: {
                "Select": function() {
                    // Do the import of the data. The data in question is always
                    // in the textbox.
                    
                    // Select all the entered hexes
                    select_string(text_area.val());
                    
                    // Finally, close the dialog
                    $(this).dialog("close");
                    
                    // Done with the tool
                        tool_activity(false);
                }   
            },
            close: function() {
                // They didn't want to use this tool.
                    tool_activity(false);
            }
        });
    }

    function selected (ev, ui) {

        // This executes when one of the select toolbar buttons is pressed.
        var tool = ui.item.data('sel');

        if (tool === 'rectangle') {
            isRectangle = true;
            setUp();

        } else if (tool === 'polygon') {
            isRectangle = false;
            setUp();

        } else { // The import function must have been selected
            selectImport();
        }
    }

    initSelect = function () {

        var $menu = $('#selectMenu');
        $menu.menu({
            select: selected,
        });

        $menu.show();
    }
})(app);
