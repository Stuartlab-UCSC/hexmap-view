
// select.js: Handle the various ways to select hexagons.

import Layer from '/imports/mapPage/longlist/Layer.js';
import rx from '/imports/common/rx'
import tool from '/imports/mapPage/head/tool.js';

// boundaries of the selectable area
var SELECTING_CURSOR = 'crosshair',

    // Handles of map listeners
    startHandle,
    moveHandle,
    midHandle,
    stopHandle,

    savedCursor, // Cursor to reinstate after selection is complete
    startLatLng, // Starting point of the selection area
    shape, // rectangular or polygonal selection boundary in latLng
    isRectangle, // Rectangle or polygon?
    color; // Color of the selection boundary and fill

function setCursor (cursor) {
    var hexCursor = cursor ? false : true;
    googlemap.setOptions({ draggableCursor: cursor });
    if (cursor === SELECTING_CURSOR) {
    
        // During selection, we also want to set the cursor on the shape
        // to the seleting cursor.
        shape.setOptions({
            clickableCursor: cursor,
            draggableCursor: cursor,
        });
    }
    // Set the cursor on or off when hovering over the hexagons
    _.each(polygons, function(hex) {
        hex.setOptions({clickable: hexCursor});
    });
}

function createPolygon (paths) {

    // Make a polygon of the selector shape.
    return new google.maps.Polygon({
        strokeColor: color,
        strokeWeight: 1,
        strokeOpacity: 1.0,
        fillColor: color,
        fillOpacity: 0.2,
        clickable: false,
        draggable: true,
        map: googlemap,
        paths: paths,
        zIndex: 9,
    });
}

function findHexagonsInPolygon (shape) {
    
    // Select hexagons that are contained within given polygon/rectangle.
    var inBounds = _.filter(Object.keys(polygons), function(hex) {
        var verts = polygons[hex].getPath();
        var contains = true;
        for (var j = 0; j < verts.getLength(); j += 1) {
            var v = verts.getAt(j);
            if (!google.maps.geometry.poly.containsLocation(v, shape)) {
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

function resetEverything () {

    // Remove all of the google map handlers
    if (startHandle) { startHandle.remove(); }
    if (stopHandle) { stopHandle.remove(); }
    if (moveHandle) { moveHandle.remove(); }
    if (midHandle) { midHandle.remove(); }

    // Restore the saved cursors
    setCursor(undefined);
    
    // Remove the bounding polygons and reset the hover curser for hexagons
    if (shape) { shape.setMap(null); }
    shape = null;
}

function finishSelect (event) {

    if (event.latLng.lat() === startLatLng.lat() &&
        event.latLng.lng() === startLatLng.lng()) {

        // Ignore this event since it is the same as the start point.
        return;
    }

    // Handle the final event of the selection

    // The end of the selection
    var latLng = event.latLng;

    if (isRectangle) {

        // Replace the path to include this last point
        shape.setPath(boundsToPath(startLatLng, latLng));

    } else { // polygon

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
    Layer.create_dynamic_selection(findHexagonsInPolygon(shape));

    resetEverything();
}

function midSelect (event) {

    // Handle a mid-point click of the selection for a polygon
    shape.getPath().push(event.latLng);
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

    var stopEvent;
    if (isRectangle) {
        stopEvent ='mouseup';
    } else {

        // Replace the original fake path point used to create the polygon
        shape.getPath().pop();
        shape.getPath().push(startLatLng);

        midHandle = googlemap.addListener('mouseup', midSelect);
        stopEvent = 'dblclick';
    }

    // Attach the stop listener.
    stopHandle = googlemap.addListener(stopEvent, finishSelect);

    tool.activity(false);
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

    // Set the cursor to let user know mouse mode has changed
    setCursor(SELECTING_CURSOR);
}

function select_string(string) {

    // The actual text to selection import function used by that tool
    // Given a string of hex names, one per line, make a selection of all
    // those hexes.
    
    // This is an array of signature names entered.
    var to_select = [];
    
    // This holds the array of lines. Split on newlines.
    var lines = string.split(/\r?\n/);
    
    for(var i = 0; i < lines.length; i++) {
        // Trim and add to our requested selection
        var line = lines[i].trim();
        if (line.length > 0) {
            to_select.push(lines[i].trim());
        }
    }

    if (to_select.length > 0) {
    
        // Add a selection with as many of the requested hexes as actually
        // exist and pass the current filters.
        Layer.create_dynamic_selection(to_select);

    // TODO future use
    } else if (to_select.length > 0) {

        // With only one selected, we will assume the user does not want to
        // create a selection, but just find this hexagon
        infoWindowFindHexagon(to_select[0]);
    }
}

function prepSelect () {
    resetEverything();
    
    // Let the tool handler know this is active so another map tool cannot
    // be made active.
    tool.activity(true);

    // Set the selection color depending on the background
    color = (rx.get('background') === 'white') ? 'black' : 'white';
}

export function byNodeId() {

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
        
        reader.onload = function() {
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
                tool.activity(false);
            }   
        },
        close: function() {
            // They didn't want to use this tool.
            tool.activity(false);
        }
    });
}

export function byRectangle () {
    prepSelect();
    isRectangle = true;
    setUpShapeSelect();
}

export function byPolygon () {
    prepSelect();
    isRectangle = false;
    setUpShapeSelect();
}

function clicked(ev) {
    var $tool = $(ev.target);
    if ($tool.hasClass('rectangle')) {
        byRectangle();

    } else if ($tool.hasClass('polygon')) {
        isRectangle = false;
        setUpShapeSelect();

    } else { // The import function must have been selected
        byNodeId();
    }
}

exports.findHexagonsInViewport = function () {

    let bounds = googlemap.getBounds()
    let viewport = new google.maps.Polygon({
        map: googlemap,
        path: boundsToPath(bounds.getNorthEast(), bounds.getSouthWest()),
        strokeOpacity: 0,
        fillOpacity: 0,
    })
    let found = findHexagonsInPolygon(viewport)
    viewport.setMap(null);
    return found
}

exports.init = function () {
    $('#navBar .rectangle, #navBar .polygon, #navBar .import')
        .on('click', clicked);
}
