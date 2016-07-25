
// select.js: Handle the various ways to select hexagons.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var //PREVIEW_COLORS = true, // This is sort of slow, so may not be fun to use
        SHOW_PREVIEW_HEXAGONS = false, // This will be ignored unless PREVIEW_COLORS is true
 
        // boundaries of the selectable area
        MIN_LAT = -90,
        MAX_LAT = 90,
        MIN_LNG = -95,
        MAX_LNG = 85,
        PREVEW_COLOR = 'grey',
        SELECTING_CURSOR = 'crosshair',

        // Handles of map listeners
        startHandle,
        moveHandle,
        midHandle,
        stopHandle,
 
        savedCursor, // Cursor to return reinstate after the selection is complete
        startLatLng, // Starting point of the selection area
        shape, // rectangular or polygonal selection boundary in latLng
        isRectangle, // Rectangle or polygon?
        color, // Color of the selection boundary and fill
        previewHexNames = [], // hexagon names in selection preview
        previewHexes = []; // hexagons in selection preview

    function setCursor (cursor) {
        googlemap.setOptions({ draggableCursor: cursor });
        if (cursor === SELECTING_CURSOR) {
 
            // During selection, we also want to set the cursor on the shape
            // to the seleting cursor.
            shape.setOptions({
                clickableCursor: cursor,
                draggableCursor: cursor,
            });
        }
    }

    function createRectangle () {

        // Make a rectangle for the selection
        var latLng = new google.maps.LatLng(0,0);
        return new google.maps.Rectangle({
            fillColor: color,
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: 1,
            fillOpacity: 0.2,
            clickable: false,
            draggable: true,
            map: googlemap,
            bounds: new google.maps.LatLngBounds(latLng, latLng),
            zIndex: 9,
        });
    }

    function createPolygon (paths, preview) {
 
        // Make a polygon for the selection
        var strokeOpacity = 1.0,
            fillOpacity = 0.2,
            draggable = true;
 
        // If we are making a preview hexagon while selecting.
        if (preview) {
            strokeOpacity = 0.0;
            fillOpacity = 0.6;
            draggable = false;
        }

        return new google.maps.Polygon({
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: strokeOpacity,
            fillColor: color,
            fillOpacity: fillOpacity,
            clickable: false,
            draggable: draggable,
            map: googlemap,
            paths: paths,
            zIndex: 9,
        });
    }

    function hexagonCursor (on) {

        // Set the cursor on or off when hovering over the hexagons
        _.each(polygons, function(hex) {
            hex.setOptions({clickable: on});
        });
    }

    function clearPreviewHexagons () {
 
        // Clear the previous preview hexagons
        if (SHOW_PREVIEW_HEXAGONS) {
            _.each(previewHexNames, function(hex) {
                previewHexes[hex].setMap(null);
            });
            previewHexNames = [];
            previewHexes = {};
        } else {
            _.each(previewHexNames, function(hex) {
                polygons[hex].setOptions({fillColor: polygons[hex].saveColor});
                delete polygons[hex].saveColor;
            });
            previewHexNames = [];
        }
    }
        
    function findHexagonsInPolygon (bounds, isRect) {

        // Select hexagons that are contained within the given polygon/rectangle.
        var inBounds = _.filter(Object.keys(polygons), function(hex) {
            var verts = polygons[hex].getPath();
            var contains = true;
            for (j = 0; j < verts.getLength(); j += 1) {
                v = verts.getAt(j);
                if ((isRect && !bounds.contains(v)) ||
                    (!isRect && !google.maps.geometry.poly.containsLocation(v, bounds))) {
                    contains = false;
                    break;
                }
            }
            return contains;
        });
        return inBounds;
    }

    function boundsToPath (latLng1, latLng2) {
 
        // Converts rectangular bounds to a polygon path
        return [
            new google.maps.LatLng(latLng1.lat(), latLng1.lng()),
            new google.maps.LatLng(latLng2.lat(), latLng1.lng()),
            new google.maps.LatLng(latLng2.lat(), latLng2.lng()),
            new google.maps.LatLng(latLng1.lat(), latLng2.lng()),
        ];
    }

    function finishSelect (event) {

        if (event.latLng.lat() === startLatLng.lat()
            && event.latLng.lng() === startLatLng.lng()) {
 
            // Ignore this event since it is the same as the start point.
            return;
        }

        // Handle the final event of the selection

        // Don't trigger this handler again
        stopHandle.remove();

        // Stop the dynamic preview updates.
        moveHandle.remove();

        // The end of the selection
        var latLng = event.latLng;

        if (isRectangle) {

            // Replace the path to include this last point
            shape.setPath(boundsToPath(startLatLng, latLng));

        } else { // polygon

            // Don't trigger a mid-point click again.
            midHandle.remove();

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

        select_list(findHexagonsInPolygon(shape), "user selection");

        // Remove the bounding polygons and reset the hover curser for hexagons
        shape.setMap(null);
        shape = null;
        hexagonCursor(true);
    }

    function midSelect (event) {

        // Handle a mid-point click of the selection for a polygon
        shape.getPath().push(event.latLng);
    }
        
    function colorPreviewHexagons () {
 
        if (SHOW_PREVIEW_HEXAGONS) {
 
            // Create the preview hexagons
            _.each(previewHexNames, function(hex) {
                previewHexes[hex] =
                    createPolygon(polygons[hex].getPath(), true);
            });
        } else {
 
            // Change the fill color of the preview hexagons
            _.each(previewHexNames, function(hex) {
                polygons[hex].saveColor = polygons[hex].fillColor;
                polygons[hex].setOptions({fillColor: PREVEW_COLOR});
            });
        }
    }
        
    function preview (event) {
 
        // This holds a selection preview event handler that should happen
        // when we mouse over the map after pressing the first point.
        // It updates the user's view of the selection polygon and
        // the hexagons within it.

        var latLng = event.latLng;
 
        if (isRectangle) {
            shape.setPath(boundsToPath(startLatLng, latLng));

        } else { // this is a polygon
 
            // If this is not the start point, remove the last point.
            if (shape.getPath().length > 1) {
                shape.getPath().pop();
            }
 
            shape.getPath().push(latLng);
        }
    }

    function startSelect (event) {
 
        // Handle the first click of the selection

        // Don't trigger again
        startHandle.remove();

        // Store the start of the selection
        startLatLng = event.latLng;

        // Add mouse move listeners for interactivity
        // Works over the map, hexes, or the shape.
        moveHandle = googlemap.addListener('mousemove', preview);
        shape.addListener('mousemove', preview);

        var stopEvent;
        if (isRectangle) {
            stopEvent ='mouseup';
        } else {
 
            // Replace the original fake path point used to create the polygon
            shape.getPath().pop();
            shape.getPath().push(startLatLng);

            midHandle = googlemap.addListener('mouseup', midSelect);
            shape.addListener('mouseup', midSelect);
            stopEvent = 'dblclick';
        }

        // Attach the stop listener.
        stopHandle = googlemap.addListener(stopEvent, finishSelect);
        shape.addListener(stopEvent, finishSelect);
 
        tool_activity(false);
    }

    function setUpShapeSelect() {

        // Disable some events on the map
        googlemap.setOptions({
            disableDoubleClickZoom: true,
            draggable: false,
            scrollwheel: false,
        });
 
        // Create a polygon as the rubber-band select polygon
        shape = createPolygon([new google.maps.LatLng(0,0)]);
 
        // Add a listener to start the selection where the user clicks
        startHandle = googlemap.addListener('mousedown', startSelect);
 
        // Turn off the cursor for hovering over hexagons
        hexagonCursor(false);
 
        // Set the cursor to let user know mouse mode has changed
        setCursor(SELECTING_CURSOR);
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
            "Select by Identifiers");

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

    function clicked(ev) {

        // This executes when one of the select navBar buttons is pressed.
        var $tool = $(ev.target);
 
        // Let the tool handler know this is active so another map tool cannot
        // be made active.
        tool_activity(true);

        // Set the selection color depending on the background
        color = (Session.equals('background', 'white'))
            ? 'black'
            : 'white';

        if ($tool.hasClass('rectangle')) {
            isRectangle = true;
            setUpShapeSelect();

        } else if ($tool.hasClass('polygon')) {
            isRectangle = false;
            setUpShapeSelect();

        } else { // The import function must have been selected
            selectImport();
        }
    }

    findHexagonsInViewport = function () {
 
        return findHexagonsInPolygon(googlemap.getBounds(), true)
    }
 
    initSelect = function () {
        $('#navBar .rectangle, #navBar .polygon, #navBar .import')
            .on('click', clicked);
    }

})(app);
