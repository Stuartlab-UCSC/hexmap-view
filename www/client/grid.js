// grid.js
// This handles the node density visualizations.

var app = app || {}; 

(function (hex) { 
    //'use strict';

    // our map range: lng: -90 -> 90   x: 0 -> 128
    //                lat: -45 -> 45   y: 0 -> 128

    Template.navBarT.helpers({

        viewEdges: function () {
            return Session.get('viewEdges') ? 'Hide ' : 'Show ';
        },
    });

    var xyMapSize = 256,
        GRID_OFFSET = 256 / 4,
        HEX_COLOR = '#00F',
        HEX_LEN_SEED = 9,
        RADIUS_SEED = 100000,
        TINY_BIT = 0.000001,
        SIMILAR_COLOR = '#888',
        SIMILAR_OPACITY = 0.5,
        TOP_SIMILARITIES = 6, // Number of lines to draw from each node
        OUTGOING_COLOR = '#F00',
        INCOMING_COLOR = '#0C0',
        INCOMING_FONT_COLOR = '#080',
        INOUT_COLOR = '#777',
        gridMap = null,
        dims = null,
        initialized = false,
        hexes = {},
        edges,
        infoHex,
        edgesDrawn = new ReactiveVar(),
        autorun,
        highlights = {};

    function status(msg) {
 
        // Let the user know the status and give the UI a chance to update
        Meteor.setTimeout(function () {
            var d = new Date();
        }, 0);
    }
 
    function killAutorun () {
        if (autorun) autorun.stop();
    }
 
    function initAutorun () {
        autorun = Tracker.autorun( function () {
        
            // If a view is requested for  edges & it's drawn,
            // kill the snake. If one of the views is not requested, that
            // object does not need to be drawn.
            // The timeout were estimated using a pancan12 map.
            var eDrawn = edgesDrawn.get();
            var eView = Session.get('viewEdges');
            
            if (eDrawn) {
                Meteor.setTimeout(function () {
                    Session.set('mapSnake', false);
                }, 2000);
                killAutorun();
            } else if (!eView) {
                Session.set('mapSnake', false);
                killAutorun();
            }
        });
    }

    function xyPathsToMvc (node, neighbors, pathsIn) {
 
        // Make an array of neighbors into an array of MVCArray paths between
        // the node and the neighbors. If paths are given, append to it.
        var paths = [];
        if (pathsIn) {
            paths = pathsIn;
        }
        _.each(neighbors, function(neighbor) {
            var p0 = hexes[node].xyCenter,
                p1 = hexes[neighbor].xyCenter,
                path = [get_LatLng(p0[0], p0[1]), get_LatLng(p1[0], p1[1])],
                mvc = new google.maps.MVCArray(path);
               
            // Draw this edge
            paths.push(mvc);
        });
        return paths;
    }

    function drawEdges () {
 
        // Draw the directed graph
        status('drawEdges()');
        var file = 'neighbors_' + Session.get('layoutIndex') + '.tab';

        Meteor.call('getTsvFile', file, ctx.project, function (error, parsed) {
            status('drawEdges() data received');

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
            if (typeof parsed === 'string'
                && parsed.slice(0,5).toLowerCase() === 'error') {
                banner('error', parsed);
                return;
            }
            
            var opts = {
                strokeColor: SIMILAR_COLOR,
                strokeOpacity: SIMILAR_OPACITY,
                strokeWeight: 1,
                zIndex: 2,
                map: gridMap,
                paths: [],
            };

            // Find the outgoing edges for each node
            _.each(parsed, function (row) {
                var node = row[0];
                hexes[node].outNodes = row.slice(1);

                // Save the paths for this node's outgoing edges
                opts.paths = (xyPathsToMvc(node, hexes[node].outNodes, opts.paths));
            });
            
            // Draw all of the edges
            edges = new google.maps.Polygon(opts);

            status('drawEdges() done');
            edgesDrawn.set(true);
        });
    }

    function viewEdgesMenuClick () {
        Session.set('mapSnake', true);
        initAutorun();
        Session.set('viewEdges', !Session.get('viewEdges'));
        Meteor.setTimeout(function () {  // Let the UI catch up

            if (Session.equals('viewEdges', true)) {
     
                // We want to show the directed graph
                if (edgesDrawn.get()) {
     
                    // Set the map of the existing graph lines so they show
                    edges.setMap(gridMap);
                } else {
     
                    // Generate the graph
                    drawEdges();
                }

            } else if (edges) {
     
                // We want to hide the directed graph, so set their maps to null
                edges.setMap(null);
                _.each(highlights, function (highlight) {
                    highlight.setPaths([]);
                });
            }
            tool_activity(false);
        }, 500);
    }

    function initHighlights (infocard, infoCardRow) {
        var opts = {
            strokeColor: OUTGOING_COLOR,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            zIndex: 3,
            map: gridMap,
            paths: [],
        };
        highlights.out = new google.maps.Polygon(opts);
        opts.strokeColor = INCOMING_COLOR;
        highlights.in = new google.maps.Polygon(opts);
        opts.strokeColor = INOUT_COLOR;
        highlights.inOut = new google.maps.Polygon(opts);
    }

    function infoWindowShowing (infocard, infoCardRow) {
 
        // Fills the info window with this hexagon's ID and its outgoing and
        // incoming neighbors. Also highlights the edges with each neighbor.
        if (!highlights.out) {
            initHighlights();
        }
 
        var info = hexes[infoHex],
            inNodes = [],
            outNodes = [];

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
        var outPaths = [];
        _.each(info.outNodes, function (neighbor, i) {
            
            // Add this outgoing neighbor to the info card
            var label = '';
            if (i === 0) {
                label = 'Outgoing';
            }
            var row = infoCardRow(label, neighbor, gridMap);
            row.find('.info-value').css('color', OUTGOING_COLOR);
            cardOut.append(row);
        });
 
        // Loop through the infoHex's incoming neighbors
        var nodes = {in: [], out: [], inOut: []},
            firstIncoming = true;
 
        console.log('hexes', hexes);
 
        _.each(hexes, function (hex, key) {
            var i = -1;
            if (hex.outNodes) {
                i = hex.outNodes.indexOf(infoHex);
            }
            if (i > -1) {
            
                // Add this outgoing neighbor to the info card
                var label = '';
                if (firstIncoming) {
                    label = 'Incoming';
                    firstIncoming = false;
                }
                var row = infoCardRow(label, hex.signature, gridMap)
                row.find('.info-value').css('color', INCOMING_FONT_COLOR);
                cardIn.append(row);
            
                // Save this incoming node
                nodes.in.push(key);
            }
        });
 
        // Find any overlapping in and out going edges
        _.each(info.outNodes, function (out) {
            var i = nodes.in.indexOf(out);
            if (i > -1) {
                nodes.inOut.push(out);
                nodes.in.splice(i, 1);
            } else {
                nodes.out.push(out);
            }
        });

        // Set the paths for each node direction
        _.each(highlights, function (highlight, dir) {
            var paths = xyPathsToMvc(infoHex, nodes[dir]);
            highlight.setPaths(paths);
        });
    }

    function hexOpacity () {
        return ((ctx.gridZoom - 1) / 20) +  0.05;
    }

    function adjustForZoom () {
 
        // When zooming keep the hexagons the same size
        // and increase opacity when zooming in.
        status('adjustForZoom()');
        ctx.gridZoom = gridMap.getZoom();
        var opacity = hexOpacity();

        var hexLen = HEX_LEN_SEED / Math.pow(2, ctx.gridZoom),
            add = hexLen / 20;

        _.each(hexes, function (hex) {
            var line = [get_LatLng(hex.xyCenter[0]-add, hex.xyCenter[1]-add),
                        get_LatLng(hex.xyCenter[0]+add, hex.xyCenter[1]+add)],
                xy = {x: hex.xyCenter[0], y: hex.xyCenter[1]},
                path = getHexLatLngCoords(xy, hexLen);

            hex.polygon.setOptions({ path: path, fillOpacity: opacity});
            hex.dot.setOptions({ path: line });
        });
        status('adjustForZoom() done');
    }

    function drawPreSquiggleHexagons (points, pointNames) {

        // Set up the options common to all hexagons
        status('drawPreSquiggleHexagons()');
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
            var xy = {x: xyPoint[0], y: xyPoint[1]};
            hexOpts.path = getHexLatLngCoords(xy, hexLen);

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
                if (Session.equals('viewEdges', true)) {
                    infoHex = hex.signature;
                    showInfoWindow(event, hex, xyPoint[0], xyPoint[1], gridMap, infoWindowShowing);
                }
            });
            hexes[pointNames[i]] = hex;
            
        });
        status('drawPreSquiggleHexagons() done');
 
        // Draw the directed graph if the user wants to
        if (Session.equals('viewEdges', true)) {
            drawEdges();
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
            findDimensions(dims.xMaxIn, dims.yMaxIn);
            initCoords();

            // Scale to create object coords of (0, 0) -> (xyMapSize/2, xyMapSize/2)
            // so the map will not wrap around the world east and west. And add
            // an offset to put the map in the center of the full map space
            xyPointsMap = _.map(xyPointsRaw, function(row) {
                return [(row[0] * dims.scale / 2) + (xyMapSize / 4),
                        (row[1] * dims.scale / 2) + (xyMapSize / 4)];
            });

            drawPreSquiggleHexagons(xyPointsMap, pointNames);
        });
    }

    function createGridMap () {
 
        // Creates the google map for methods
        initMapType();
 
        var mapOptions = {
            center: ctx.gridCenter,
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
            ctx.gridCenter = gridMap.getCenter();
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
        idims.xMaxIn = xMax;
        idims.yMaxIn = yMax;

        return idims;
    }

    getGridMap = function () {
        return gridMap;
    }
 
    initGrid = function () {
        
        if (initialized) return;
        initialized = true;
 
        // Hide the loading snake after things are drawn
        edgesDrawn.set(false);
        initAutorun();

        // Initialize the grid map
        createGridMap();
 
        // Initalize utilities not dependent on the initial UI draw
        initInfoWindow (gridMap);
        Download.init();
 
        // Create a link to the methods
        add_tool("methods", function(ev) {
            if (!$(ev.target).hasClass('disabled')) {
                $('.gridPage').click();
                tool_activity(false);
            }
        }, 'Map of nodes before final layout');
 
        // Register a callback for the view graph menu click
        add_tool("viewEdges", viewEdgesMenuClick, 'Directed graph of node relationships');
    }
})(app);
