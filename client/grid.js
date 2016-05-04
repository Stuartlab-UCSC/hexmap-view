// grid.js
// This handles some visualizations of methods use in the layout generation.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    // our map range: lng: -90 -> 90   x: 0 -> 128
    //                lat: -45 -> 45   y: 0 -> 128

    Template.navBarT.helpers({

        viewGraph: function () {
            return Session.get('viewGraph') ? 'Hide ' : 'Show ';
        },

        viewWindows: function () {
            return Session.get('viewWindows') ? 'Hide ' : 'Show ';
        }
    });

    var xyMapSize = 256,
        ONE_SEGMENT = true, // false for 3 segments per node pair
        GRID_OFFSET = 256 / 4,
        HEX_COLOR = '#00F',
        WINDOW_COLOR = '#888',
        HEX_LEN_SEED = 9,
        RADIUS_SEED = 100000,
        TINY_BIT = 0.000001,
        SIMILAR_COLOR = '#888',
        SIMILAR_OPACITY = 0.5,
        TOP_SIMILARITIES = 6, // Number of lines to draw from each node
        OUTGOING_COLOR = '#F00',
        INCOMING_COLOR = '#0C0',
        INCOMING_FONT_COLOR = '#080',
        gridMap = null,
        dims = null,
        initialized = false,
        hexes = {},
        windowLines = [],
        infoHex,
        prevInfoHex,
        edgesDrawn = new ReactiveVar(),
        windowsDrawn = new ReactiveVar(),
        autorun;

    function status(msg) {
 
        // Let the user know the status and give the UI a chance to update
        Meteor.setTimeout(function () {
            var d = new Date();
            console.log(d.getMinutes(), d.getSeconds(), d.getMilliseconds(), msg);
        }, 0);
    }
 
    function killAutorun () {
        if (autorun) autorun.stop();
    }
 
    function initAutorun () {
        autorun = Tracker.autorun( function () {
        
            // If a view is requested for windows or edges & it's drawn,
            // kill the snake. If one of the views is not requested, that
            // object does not need to be drawn.
            var eDrawn = edgesDrawn.get();
            var wDrawn = windowsDrawn.get();
            var eView = Session.get('viewGraph');
            var wView = Session.get('viewWindows');
            
            if (wDrawn && (eDrawn || !eView)) {
                Session.set('loadingMap', false);
                killAutorun();
            } else if (eDrawn && !wView) {
                Session.set('loadingMap', false);
                killAutorun();
            } else if (!wView && !eView) {
                Session.set('loadingMap', false);
                killAutorun();
            }
        });
    }
 
    function drawWindows() {
        status('drawWindows()');
 
        // Draw the adaptive windows used for layout-aware stats
        var file = 'grid_' + Session.get('layoutIndex') + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {
            status('drawWindows() data received');

            // This is an array of lines, with two points each:
            //
            //  x1  y1  x2  y2
            //  x3  y3  x4  y4
            //  ...

            if (error) {
                banner('error', 'Sorry, the file containing the windows was not found. (grid_*.tab)')
                return;
            }
            if (parsed.slice(0,5) === 'Error') {
                banner('error', parsed);
                return;
            }
            
            var opts = {
                strokeColor: WINDOW_COLOR,
                strokeOpacity: 0.5,
                strokeWeight: 1,
                zIndex: 4,
                map: gridMap,
            };
            _.each(parsed, function(row) {
                var xyLine = [[parseFloat(row[0]), parseFloat(row[1])],
                        [parseFloat(row[2]), parseFloat(row[3])]];
                opts.path = _.map(xyLine, function (xyPoint) {
                    var point = get_LatLng(xyPoint[0] * dims.scale / 2 + GRID_OFFSET,
                                             xyPoint[1] * dims.scale / 2 + GRID_OFFSET);
                    return point;
                });
                windowLines.push(new google.maps.Polyline(opts));
            });
            windowsDrawn.set(true);
            status('drawWindows()');
        });
    }

    function viewWindowsMenuClickInner () {
        Session.set('viewWindows', !Session.get('viewWindows'));

        if (Session.equals('viewWindows', true)) {
 
            // We want to show the windows
            if (windowsDrawn.get()) {
 
                // Set the map of the existing window lines so they show
                _.each(windowLines, function (line) {
                    line.setMap(gridMap);
                });
            } else {
 
                // Generate the windows
                drawWindows();
            }
        } else if (windowsDrawn.get()) {
 
            // We want to hide the windows, so set their maps to null
            _.each(windowLines, function (line) {
                line.setMap(null);
            });
        }
        tool_activity(false);
    }

    function viewWindowsMenuClick () {
        initAutorun();
        Meteor.setTimeout(viewWindowsMenuClickInner, 10);
    }

    function setGraphMap(map) {
        status('setGraphMap()');
        _.each(hexes, function (node) {
            _.each(node.lines, function (line) {
                line.setMap(map);
            });
        });
        status('setGraphMap() done');
    }

    function drawEdges (row) {

        // Find the nodes most similar to this node
        var node = row[0]
            opacity = [0.1, 0.2, 0.3],
            weight = [1, 1.5, 2],
            color = ['#f00', '#0f0', '#00f'],
            opts = {
                strokeColor: SIMILAR_COLOR,
                strokeOpacity: SIMILAR_OPACITY,
                strokeWeight: 1,
                zIndex: 2,
                map: gridMap,
            };
        hexes[node].lines = [];
        hexes[node].neighbors = row.slice(1);
 
        if (!ONE_SEGMENT) {
 
            // Draw each line in three segments rather than one
            _.each(hexes[node].neighbors, function(neighbor) {
                   
                // Break down the line between two nodes into 3 segments
                var p0 = hexes[node].xyCenter,
                    p1 = hexes[neighbor].xyCenter,
                    x3 = (p1[0] - p0[0]) / 3, // 1/3 of x distance
                    xf = 0, //(p1[0] - p0[0]) / 100, // fudge factor to reduce overlap of segments
                    y3 = (p1[1] - p0[1]) / 3, // 1/3 of y distance
                    yf = 0, //(p1[1] - p0[1]) / 100, // fudge factor to reduce overlap of segments
                    lines = [
                        [[ p0[0], p0[1] ], [ p0[0] + x3, p0[1] + y3 ]],
                        [[ p0[0] + x3+xf, p0[1] + y3+yf ], [ p0[0] + x3*2, p0[1] + y3*2 ]],
                        [[ p0[0] + x3*2+xf, p0[1] + y3*2+yf ], [ p1[0], p1[1] ]],
                    ];
                   
                _.each(lines, function (line, k) {
                    opts.path = _.map(line, function (point) {
                        return get_LatLng(point[0], point[1]);
                    });
                    opts.strokeWeight = weight[k];
                    
                    // Draw the line between the two nodes as 3 segments
                    hexes[node].lines.push(new google.maps.Polyline(opts));
                });
            });
        } else {
 
            // Draw the lines with one segment between each node
            _.each(hexes[node].neighbors, function(neighbor) {
                var p0 = hexes[node].xyCenter,
                    p1 = hexes[neighbor].xyCenter;
                   
                opts.path = [get_LatLng(p0[0], p0[1]), get_LatLng(p1[0], p1[1])];
                   
                // Draw each line with one segment rather than three
                hexes[node].lines.push(new google.maps.Polyline(opts));
            });
        }
    }

    function getEdgeInfo () {
 
        // Draw the directed graph
        status('getEdgeInfo()');
        var file = 'neighbors_' + Session.get('layoutIndex') + '.tab';

        Meteor.call('getTsvFile', file, ctx.project, function (error, parsed) {
            status('getEdgeInfo() data received');

            // This is an array of nodes and their neighbors with the primary
            // node at the front of each row:
            //
            //  node1  nodeA  nodeB  nodeC ...
            //  node2  nodeX  nodeY  nodeZ ...
            //  ...

            if (error) {
                banner('error',
                    'Sorry, the file containing the similarities was not found. ('
                    + file + ')');
                return;
            }
            if (parsed.slice(0,5) === 'Error') {
                banner('error', parsed);
                return;
            }
            // Draw the lines for each node
            _.each(parsed, function (row) {
                drawEdges(row);
            });
            status('getEdgeInfo() done');
            edgesDrawn.set(true);
        });
    }

    function viewGraphMenuClickInner () {
        Session.set('viewGraph', !Session.get('viewGraph'));

        if (Session.equals('viewGraph', true)) {
 
            // We want to show the directed graph
            if (edgesDrawn.get()) {
 
                // Set the map of the existing graph lines so they show
                setGraphMap(gridMap);
            } else {
 
                // Generate the graph
                getEdgeInfo();
            }

        } else if (edgesDrawn.get()) {
 
            // We want to hide the directed graph, so set their maps to null
            setGraphMap(null);
        }
        tool_activity(false);
    }

    function viewGraphMenuClick () {
        initAutorun();
        Tracker.flush();
        Meteor.setTimeout(viewGraphMenuClickInner, 10);
    }

    function infoWindowShowing (infocard, infoCardRow) {
 
        // This is called after the info window is created so we can fill it
        var info = hexes[infoHex];
 
        if (prevInfoHex) {
 
            // Set the last highlighted outgoing edges back to normal
            _.each(hexes[prevInfoHex].lines, function (line) {
                line.setOptions({
                    strokeColor: SIMILAR_COLOR,
                    strokeOpacity: SIMILAR_OPACITY,
                    strokeWeight: 1,
                    zIndex: 2,
                });
            });
 
            // Set the last highlighted incoming edges back to normal
            _.each(hexes[prevInfoHex].incoming, function (line) {
                line.setOptions({
                    strokeColor: SIMILAR_COLOR,
                    strokeOpacity: SIMILAR_OPACITY,
                    strokeWeight: 1,
                    zIndex: 2,
                });
            });
            delete hexes[prevInfoHex].incoming;
        }
 
        // Display the hexagon name and set up the columns
        infocard.css('overflow', 'hidden');

        infocard.append(infoCardRow("ID", info.signature, gridMap)
            .addClass("info-name"));
        var cardOut = $("<div/>").css({
                display: 'inline-block',
                'vertical-align': 'top',
                'margin-right': '1em',
                }),
            cardIn = $("<div/>").css({
                'display': 'inline-block',
                'vertical-align': 'top',
            });
        infocard.append(cardOut);
        infocard.append(cardIn);

        // Loop through the infoHex's outgoing neighbors
        var firstOutgoing = true;
        _.each(info.lines, function (line, i) {
            
            // Add this outgoing neighbor to the info card
            var label = '',
                neighbor = info.neighbors[i];
            if (i === 0) {
                label = 'Outgoing';
            }
            var row = infoCardRow(label, neighbor, gridMap);
            row.find('.info-value').css('color', OUTGOING_COLOR);
            cardOut.append(row);
            
            // Highlight this node's outgoing edges
            line.setOptions({
                strokeColor: OUTGOING_COLOR,
                strokeOpacity: 1.0,
                strokeWeight: 2,
                zIndex: 3,
            });
        });
 
        // Loop through the infoHex's incoming neighbors
        info.incoming = [];
        _.each(hexes, function (hex) {
            var i = hex.neighbors.indexOf(infoHex);
            if (i > -1) {
            
                // Add this outgoing neighbor to the info card
                var label = '';
                if (firstOutgoing) {
                    label = 'Incoming';
                    firstOutgoing = false;
                }
                var row = infoCardRow(label, hex.signature, gridMap)
                row.find('.info-value').css('color', INCOMING_FONT_COLOR);
                cardIn.append(row);
            
                // Highlight the infoHex's incoming edge from this hex
                hex.lines[i].setOptions({
                    strokeColor: INCOMING_COLOR,
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    zIndex: 3,
                });
                info.incoming.push(hex.lines[i]);
            }
        });
    }
 
    function hexOpacity () {
        return ((ctx.gridZoom - 1) / 20) +  0.05;
    }

    function adjustForZoom () {
        status('adjustForZoom()');
        ctx.gridZoom = gridMap.getZoom();
        var opacity = hexOpacity();

        var hexLen = HEX_LEN_SEED / Math.pow(2, ctx.gridZoom),
            add = hexLen / 20;

        _.each(hexes, function (hex) {
            var line = [get_LatLng(hex.xyCenter[0]-add, hex.xyCenter[1]-add),
                        get_LatLng(hex.xyCenter[0]+add, hex.xyCenter[1]+add)],
                path = getHexLatLngCoords(hex.xyCenter, hexLen);

            hex.polygon.setOptions({ path: path, fillOpacity: opacity});
            hex.dot.setOptions({ path: line });
        });
        status('adjustForZoom() done');
    }

    drawHexagons = function (points, pointNames) {

        // Set up the options common to all hexagons
        status('drawHexagons()');
        var hexLen = HEX_LEN_SEED / Math.pow(2, ctx.gridZoom),
            add = hexLen / 20,
            hexOpts = {
                fillColor: HEX_COLOR,
                fillOpacity: hexOpacity(),
                map: gridMap,
                strokeWeight: 0,
                zIndex: 2,
            },
            dotOpts = {
                fillColor: '#000',
                map: gridMap,
                strokeColor: '#000',
                strokeWeight: 1,
                zIndex: 3,
            };

        // Draw the point as a hexagon with a dot in the middle
        _.each(points, function (xyPoint, i) {

            // Find the hexagon points
            hexOpts.path = getHexLatLngCoords(xyPoint, hexLen);

            // Find the center point
            dotOpts.path = [get_LatLng(xyPoint[0]-add, xyPoint[1]-add),
                             get_LatLng(xyPoint[0]+add, xyPoint[1]+add)];

            // Render the hexagon and its center, and save them in an array
            var hex = {
                xyCenter: xyPoint,
                signature: pointNames[i],
                polygon: new google.maps.Polygon(hexOpts),
                dot: new google.maps.Polyline(dotOpts),
            };
            google.maps.event.addListener(hex.polygon, "click", function (event) {
                prevInfoHex = infoHex;
                infoHex = hex.signature;
                showInfoWindow(event, hex, xyPoint[0], xyPoint[1], gridMap, infoWindowShowing);
            });
            hexes[pointNames[i]] = hex;
            
        });
        status('drawHexagons() done');
 
        // Draw the grid if the user wants to
        if (Session.equals('viewWindows', true)) {
            drawWindows();
        }
        
        // Draw the directed graph if the user wants to
        if (Session.equals('viewGraph', true)) {
            getEdgeInfo();
        }
    }

    function findNodePoints() {

        // Render the points before they were assigned to hexagons
        status('findNodePoints()');
        var file = 'xyPreSquiggle_' + Session.get('layoutIndex') + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {;
            status('findNodePoints() data received');

            // This is an array of point locations, in the form:
            //  s1  x1  y1
            //  s2  x2  y2
            //  ...

            // Parse the file
            var xyPointsRaw,
                pointNames,
                xyPointsMap;

            if (error) {
                alert('Sorry, the file of pre-squiggle hexagons was not found so '
                    + 'there is nothing to display. (xyPreSquiggle_*.tab)')
                return;
            }

            // Strip out any comment lines or lines that are too short
            var cleaned = _.filter(parsed, function (row) {
                return (row[0].indexOf('#') < 0 && (row.length === 3));
            });

            // Find the IDs of the points and the x,y positions
            pointNames = _.map(cleaned, function (row) {
                return row[0];
            });
            xyPointsRaw = _.map(cleaned, function (row) {
                return [row[1], row[2]]
            });

            // Find the extents of the map so we and normalize it to our
            // standard size.
            dims = findGridExtents(xyMapSize-TINY_BIT, xyPointsRaw);
            
            // Scale to create object coords of (0, 0) -> (xyMapSize/2, xyMapSize/2)
            // so the map will not wrap around the world east and west. And add
            // an offset to put the map in the center of the full map space
            xyPointsMap = _.map(xyPointsRaw, function(row) {
                return [(row[0] * dims.scale / 2) + (xyMapSize / 4),
                        (row[1] * dims.scale / 2) + (xyMapSize / 4)];
            });

            drawHexagons(xyPointsMap, pointNames);
        });
    }

    function createMap () {
 
        // Creates the google map for methods
        mapTypeDef();
        var mapOptions = {
            center: ctx.center,
            zoom: ctx.gridZoom,
            mapTypeId: "blank",
            // Don't show a map type picker.
            mapTypeControlOptions: {
                  mapTypeIds: []
            },
            // Or a street view man that lets you walk around various Earth places.
            streetViewControl: false,
            minZoom: 2,
        };

        // Create the actual map
        gridMap = new google.maps.Map(document.getElementById("gridMap"),
            mapOptions);
            
        // Attach the blank map type to the map
        gridMap.mapTypes.set("blank", new BlankMapType());

        // Add a listener for the center changing
        google.maps.event.addListener(gridMap, "center_changed", function(event) {
            ctx.center = gridMap.getCenter();
            //Session.set('center', gridMap.getCenter());
        });
    
        // Add a listener for the zoom changing
        google.maps.event.addListener(gridMap, "zoom_changed", adjustForZoom);
 
        findNodePoints();
    }

    findGridExtents = function (xyMapSize, xyPoints) {
        if (!_.isNull(dims)) return dims;

        var xMax = xyPoints[0][0],
            yMax = xyPoints[0][1],
            xSize,
            ySize,
            idims = {};

        idims.xMin = xMax;
        idims.yMin = yMax;

        _.each(xyPoints, function (point) {
            var x = parseFloat(point[0]),
                y = parseFloat(point[1]);
            if (!isNaN(x) || !isNaN(y)) {
                xMax = Math.max(xMax, point[0]);
                yMax = Math.max(yMax, point[1]);
                idims.xMin = Math.min(idims.xMin, point[0]);
                idims.yMin = Math.min(idims.yMin, point[1]);
            }
        });
        xSize = xMax - idims.xMin;
        ySize = yMax - idims.yMin;

        // Use a scale that is half the size of the map to
        // prevent it from wrapping around the world
        idims.scale = xyMapSize / Math.max(xSize, ySize);
        idims.xSize = xSize * idims.scale;
        idims.ySize = ySize * idims.scale;
        idims.xMin *= idims.scale;
        idims.yMin *= idims.scale;
        idims.xMax = xMax * idims.scale;
        idims.yMax = yMax * idims.scale;

        return idims;
    }

    getGridMap = function () {
        return gridMap;
    }
 
    initGrid = function () {
        
        if (initialized) return;
        initialized = true;
 
        // Hide the loading snake after things are drawn
        windowsDrawn.set(false);
        edgesDrawn.set(false);
        initAutorun();

        // Initialize the grid page and grid map
        createMap();
        initCoords(dims);
        initInfoWindow (gridMap);

        // Register a callback for the view graph menu click
        add_tool("viewGraph", viewGraphMenuClick);

        // Register a callback for the view windows menu click
        add_tool("viewWindows", viewWindowsMenuClick);
    }
})(app);
