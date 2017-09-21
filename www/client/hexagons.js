// hexagon.js
// Handle things to do with hexagons.

import Ajax from '/imports/ajax.js';
import InfoWindow from '/imports/reactCandidates/infoWindow.js';

var app = app || {}; 

(function (hex) {

    // Global: hold objects of polygons by signature name
    polygons = {};

    // What's the minimum number of pixels that sideLen must represent at the
    // current zoom level before we start drawing hex borders?
    var MIN_BORDER_SIZE = 10;

    // And how thick should the border be when drawn?
    var HEX_STROKE_WEIGHT = 2;
 
    // Some number used to determine the length for xy coords mapView.
    var XY_HEX_LEN_SEED = 9;
 
    // The node assignments in honeycomb space
    var assignments;
 
    // The opacity value when transparent is enabled.
    var opacity;
 
    // The hover info flag
    var hoverInfoShowing = false;
 
    var backgroundAutorun;

    Template.navBarT.helpers({
        mapViewLayoutSelected: function () {  
            var page = Session.get('page'),
                mapView = Session.get('mapView');
            return (page && page === 'mapPage' && mapView &&
                mapView === 'honeycomb') ? 'selected' : '';
        },
        mapViewXyDisplay: function () {
            return DEV ? 'list-item' : 'none';
        },
        mapViewXySelected: function () {
            var page = Session.get('page'),
                mapView = Session.get('mapView');
            return (page && page === 'mapPage' && mapView &&
                mapView === 'xyCoords') ? 'selected' : '';
        },
        mapViewDensitySelected: function () {
            var page = Session.get('page');
            return (page && page === 'gridPage') ? 'selected' : '';
        },
        transparentDisplay: function () {
            return DEV ? 'list-item' : 'none';
        },
        transparentSelected: function () {
            return (Session.get('transparent')) ? 'selected' : '';
        },
    });

    function setOpacity () {
 
        if (Session.equals('transparent', true) &&
            Session.equals('mapView', 'xyCoords')) {
 
            var additive = 0.05;
 
            // On a black background, the opacity needs to be more.
            if (Session.equals('background', 'black')) {
                additive = 0.5;
            }

            // Opacity is a function of zoom: more zoom means more opaque.
            opacity = Math.min(1.0, ((ctx.zoom - 1) / 20) +  additive);
        } else {
            opacity = 1.0;
        }
    }
 
    function setZoomOptions(nodeId, xy, opts) {
 
        var polygonDrawn = polygons[nodeId] ? true : false;
        opts = opts || {};
 
        opts.fillOpacity = opacity;

        if (Session.equals('mapView', 'honeycomb')) {

            // Given a polygon, set the weight of hexagon's border stroke, in
            // number of screen pixels, and the border color.

            // API docs say: pixelCoordinate = worldCoordinate * 2 ^ zoomLevel
            // So this holds the number of pixels that the global length sideLen 
            // corresponds to at this zoom level.
            var weight = (sideLen * Math.pow(2, ctx.zoom) >= MIN_BORDER_SIZE)
                    ? HEX_STROKE_WEIGHT
                    : 0;
 
            opts.strokeWeight = weight;
            opts.strokeColor = Session.get('background');
            opts.strokeOpacity = 1.0;
        } else {
 
            // This must be an xyCoords mapview.
            // Retain the hexgon size, regardless of zoom.
            var hexLen = XY_HEX_LEN_SEED / Math.pow(2, ctx.zoom);
            opts.path = getHexLatLngCoords(xy, hexLen);
        }

        // If the hexagon has already been drawn...
        if (polygonDrawn) {
 
            // Change the drawn polygon options.
            polygons[nodeId].setOptions(opts);
        }
 
        // This has not yet been drawn yet,
        // so return with the modified shape options provided.
        return;
    }

    function renderHexagon (row, column, nodeId, opts) {

        // Make a new hexagon representing the hexagon at the given xy object
        // space before transform to xy world space.
        // Returns the Google Maps polygon.
 
        var xy = get_xyWorld_from_xyHex(column, row),
            mapView = Session.get('mapView'),
            thisSideLen = (mapView === 'honeycomb') ? sideLen : sideLen * 2,
            coords = getHexLatLngCoords(xy, thisSideLen)
            shapeOpts = {
                map: googlemap,
                //paths: coords,
                fillColor: Colors.noDataColor(),
                zIndex: (opts && opts.overlay) ? 200 : 1,
            };
 
        setZoomOptions(nodeId, xy, shapeOpts);
 
        if (mapView === 'honeycomb') {
            shapeOpts.path = getHexLatLngCoords(xy, sideLen);
        } else {
            shapeOpts.strokeWeight = 0;
        }

        // TODO can we process many polygons in one call to googlemaps?
        // Can we leave out the fill color until we have one?
        // Construct the Polygon
        var saveLabel
        var hexagon = new google.maps.Polygon(shapeOpts);
 
        // Save the honeycomb coordinates with the hexagon
        hexagon.xHex = column;
        hexagon.yHex = row;

        // Save the xy coordinates for later.
        hexagon.xy = xy;
 
        // Save other flags for later.
        hexagon.overlay = opts.overlay ? opts.overlay : undefined;
 
        // Set up the click listener to move the global info window to this hexagon
        // and display the hexagon's information
        google.maps.event.addListener(hexagon, "click", function (event) {
            InfoWindow.show(event, hexagon);
        });

        // Listen to mouse events on this hexagon
        Tool.subscribe_listeners(hexagon);
        
        return hexagon;
    } 

    createHexagons = function (draw) {

        // Create the hexagons from the positions data.
        setOpacity();
 
        // Clear any old polygons from the map.
        _.each(_.keys(polygons), removeHexagon);
        polygons = {};
        _.each(assignments, function (hex, id) {
            addHexagon (hex.x, hex.y, id);
        });
        if (draw) {
            refreshColors();
        }
    }

    removeHexagon = function (label) {
        google.maps.event.clearInstanceListeners(polygons[label]);
        polygons[label].setMap(null);
        delete polygons[label];
    }
 
    function removeHoverListeners (hexagon) {
        google.maps.event.removeListener(hexagon.mouseover);
        google.maps.event.removeListener(hexagon.mouseout);
        delete hexagon.mouseover;
        delete hexagon.mouseout;
    }
 
    function addHoverListeners (hexagon) {
        if (hoverInfoShowing) {
 
            // Set up the hover listeners to move the infowindow to this node
            // with just a node ID displayed.
            hexagon.mouseover = google.maps.event.addListener(hexagon,
                "mouseover", function (event) {
                    InfoWindow.show(event, hexagon, null, null, true);
                });
            hexagon.mouseout = google.maps.event.addListener(hexagon,
                "mouseout", function (event) {
                    InfoWindow.close(true);
                });
        }
    }

    addHexagon = function (x, y, label, opts) {

        // Make a hexagon on the Google map and store that.
        // x and y are in object coordinates before transform to world xy coords
        // opts:
        // @param opts.overlay: true for overlay

        var hexagon = renderHexagon(y, x, label, opts || {});

        // Store by label
        polygons[label] = hexagon;
 
        if (hoverInfoShowing) {
            addHoverListeners(hexagon);
        }
        
        // Set the polygon's signature so we can look stuff up for it when 
        // it's clicked.
        hexagon.signature = label;
    }
 
    hexagonZoomChanged = function () {
        setOpacity();
        for (var signature in polygons) {
            setZoomOptions(signature, polygons[signature].xy);
        }
    }

    setHexagonColor = function (hexagon, color) {

        // Given a polygon, set the hexagon's fill color.
        hexagon.setOptions({
            fillColor: color
        });
    };

    function showHoverInfo () {
        var el = $('#navBar .showHoverInfo');
        if (hoverInfoShowing) {
            hoverInfoShowing = false;
            _.each(polygons, removeHoverListeners);
            el.text('Show Node Hover');
        } else {
            hoverInfoShowing = true;
            _.each(polygons, addHoverListeners);
            el.text('Hide Node Hover');
        }
    }
 
    drawLayout = function (draw) {
 
        // Download the positions of nodes and fill in the global
        // hexagon assignment grid.
 
        // Get the appropriate coordinates depending on the map view.
        var mapView = Session.get('mapView'),
            id = (mapView === 'honeycomb') ? 'assignments' : 'xyPreSquiggle_';
        id += Session.get('layoutIndex');
 
        Ajax.get({
            id: id,
            success: function (parsed) {

                // This is an array of rows, which are arrays of values:
                // id, x, y

                // These hold the maximum observed x & y
                var max_x = max_y = 0;

                // Find the max x and y while storing the assignments
                assignments = {};
                var start = 0;
                
                if (parsed[0][0][0] === '#') {
                    start = 1;
                }

                // Show the number of nodes on the UI
                Session.set('nodeCount', parsed.length - start);
                
                for (var i = start; i < parsed.length; i++) {
                    var x = parsed[i][1],
                        y = parsed[i][2];
                    if (mapView === 'honeycomb') {
             
                        // Force the nodes into hexagonal grid coordinates.
                        x = parseInt(x);
                        y = parseInt(y);
                    }
                    assignments[parsed[i][0]] = {x: x, y: y};
                    max_x = Math.max(x, max_x);
                    max_y = Math.max(y, max_y);
                }

                findDimensions(max_x, max_y);
                Session.set('initedHexagons', true);
                setOpacity();

                if (draw) {
                    createHexagons(draw);
                }
            },
            error: function (error) {
                projectNotFound(id);
                return;
            },
        });
    }

    initHexagons = function () {
    
        // Default the mapView to honeycomb.
        Session.set('mapView', Session.get('mapView') || 'honeycomb');
 
        // Default the transparency and set the opacity value.
        Session.set('transparent', Session.get('transparent') || false);
 
        // Set some event handlers
        $('#navBar li.mapLayout').on('click', function () {
            Session.set('mapView', 'honeycomb');
            if (!Session.equals('page', 'mapPage')) {
                Hex.pageReload('mapPage');
            }
            drawLayout(true);
        });
        $('#navBar li.xyCoordView').on('click', function () {
            Session.set('mapView', 'xyCoords');
            drawLayout(true);
        });
        $('#navBar .transparent').on('click', function () {
            var transparent = Session.get('transparent');
            Session.set('transparent', !transparent);
            setOpacity();
            _.each(polygons, function(hex) {
                hex.setOptions({ fillOpacity: opacity });
            });
        });
        $('#navBar .showHoverInfo').on('click', showHoverInfo);
 
        // Get the node positions for the initial view.
        drawLayout(true);
    }
})(app);
