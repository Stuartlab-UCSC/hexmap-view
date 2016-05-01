// grid.js
// This handles some visualizations of methods use in the layout generation.

var app = app || {}; // jshint ignore:line

graphLines = undefined;

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
        GRID_OFFSET = 256 / 4,
        HEX_COLOR = '#00F',
        ORPHAN_COLOR = '#F00',
        WINDOW_COLOR = '#888',
        SIMILAR_COLOR = '#888',
        HILITE_COLOR = '#F00',
        HEX_LEN_SEED = 9,
        RADIUS_SEED = 100000,
        TINY_BIT = 0.000001,
        TOP_SIMILARITIES = 6, // Number of lines to draw from each node
        gridMap = null,
        dims = null,
        initialized = false,
        hexes = {},
        windowLines = [],
        infoHex,
        prevInfoHex;

    function drawWindows() {
 
        // Draw the adaptive windows used for layout-aware stats
        var file = 'grid_' + Session.get('layoutIndex') + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {

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
                strokeOpacity: 1.0,
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
        });
    }

    function viewWindowsMenuClick () {
        Session.set('viewWindows', !Session.get('viewWindows'));
        if (Session.equals('viewWindows', true)) {
 
            // We want to show the windows
            if (windowLines.length > 0) {
 
                // Set the map of the existing window lines so they show
                _.each(windowLines, function (line) {
                    line.setMap(gridMap);
                });
            } else {
 
                // Generate the windows
                drawWindows();
            }
        } else if (windowLines.length > 0) {
 
            // We want to hide the windows, so set their maps to null
            _.each(windowLines, function (line) {
                line.setMap(null);
            });
        }
        tool_activity(false);
    }

    function drawSimilarityLines (row) {

        // Find the nodes most similar to this node
        // There may be a faster way to do this than sorting
        var node = row[0]
            opacity = [0.1, 0.2, 0.3],
            weight = [1, 1.5, 2],
            color = ['#f00', '#0f0', '#00f'],
            opts = {
                strokeColor: SIMILAR_COLOR,
                strokeOpacity: 1.0,
                strokeWeight: 10,
                zIndex: 2,
                map: gridMap,
            };
        graphLines[node] = {};
        graphLines[node].lines = [];
        graphLines[node].neighbors = row.slice(1);
 
        _.each(graphLines[node].neighbors, function(neighbor) {
               
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
                graphLines[node].lines.push(new google.maps.Polyline(opts));
            });
        });
    }

    function drawGraph () {
 
        // Draw the directed graph
        var file = 'neighbors_' + Session.get('layoutIndex') + '.tab';
        graphLines = {};

        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {

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
                drawSimilarityLines(row);
            });
        });
    }
 
    function infoWindowShowing () {
        if (graphLines) {
            if (prevInfoHex) {
                _.each(graphLines[prevInfoHex].lines, function (line) {
                    line.setOptions({
                        strokeColor: SIMILAR_COLOR,
                        zIndex: 2,
                    });
                });
            }
            _.each(graphLines[infoHex].lines, function (line) {
                line.setOptions({
                    strokeColor: HILITE_COLOR,
                        zIndex: 3,
                });
            });
        }
    }
 
    function setGraphMap(map) {
        _.each(graphLines, function (node) {
            _.each(node.lines, function (line) {
                line.setMap(map);
            });
        });
    }

    function viewGraphMenuClick () {
        Session.set('viewGraph', !Session.get('viewGraph'));
        if (Session.equals('viewGraph', true)) {
 
            // We want to show the directed graph
            if (graphLines) {
 
                // Set the map of the existing graph lines so they show
                setGraphMap(gridMap);
            } else {
 
                // Generate the graph
                drawGraph();
            }

        } else if (graphLines) {
 
            // We want to hide the directed graph, so set their maps to null
             setGraphMap(null);
        }
        tool_activity(false);
    }

    function findOrphans() {

        // Find those points, pre-hexagon assignment,
        // that were not mapped to this layer's grid
        var file = 'gridOrphans_' + Session.get('layoutIndex') + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {

            // This is an array of points names.
            var orphans;
            if (error) {
                orphans = [];
            } else {
                orphans = _.map(parsed, function (row) {
                    return row[0];
                });
            }

            findNodePoints(orphans);
        });
    }

    function adjustForZoom () {
        ctx.gridZoom = gridMap.getZoom();

        var hexLen = HEX_LEN_SEED / Math.pow(2, ctx.gridZoom),
            add = hexLen / 20;

        _.each(hexes, function (hex) {
            var line = [get_LatLng(hex.xyCenter[0]-add, hex.xyCenter[1]-add),
                        get_LatLng(hex.xyCenter[0]+add, hex.xyCenter[1]+add)],
                path = getHexLatLngCoords(hex.xyCenter, hexLen);

            hex.polygon.setOptions({ path: path });
            hex.dot.setOptions({ path: line });
        });
    }

    drawHexagons = function (points, pointNames, orphans) {

        // Set up the options common to all hexagons
        var hexLen = HEX_LEN_SEED / Math.pow(2, ctx.gridZoom),
            add = hexLen / 20,
            hexOpts = {
                fillColor: HEX_COLOR,
                fillOpacity: 0.1,
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

            // The color depends on whether it is an orphan or not
            if (orphans.length > 0) {
                var orphan = _.contains(orphans, pointNames[i]);
                if (orphan) {
                    hexOpts['fillColor'] = ORPHAN_COLOR;
                } else {
                    hexOpts['fillColor'] = HEX_COLOR;
                }
            }
            // Find the hexagon points
            hexOpts.path = getHexLatLngCoords(xyPoint, hexLen);

            // Find the center point
            dotOpts.path = [get_LatLng(xyPoint[0]-add, xyPoint[1]-add),
                             get_LatLng(xyPoint[0]+add, xyPoint[1]+add)];

            // Render the hexagon and its center, and save them in an array
            var hex = {
                xyCenter: xyPoint,
                name: pointNames[i],
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
    }

    function findNodePoints(orphans) {

        // Render the points before they were assigned to hexagons
        var file = 'xyPreSquiggle_' + Session.get('layoutIndex') + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            function (error, parsed) {;

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
            
            // Draw the grid if the user wants to
            if (Session.equals('viewWindows', true)) {
                drawWindows();
            }
            
            // Draw the directed graph if the user wants to
            if (Session.equals('viewGraph', true)) {
                drawGraph();
            }
            
            // Scale to create object coords of (0, 0) -> (xyMapSize/2, xyMapSize/2)
            // so the map will not wrap around the world east and west. And add
            // an offset to put the map in the center of the full map space
            xyPointsMap = _.map(xyPointsRaw, function(row) {
                return [(row[0] * dims.scale / 2) + (xyMapSize / 4),
                        (row[1] * dims.scale / 2) + (xyMapSize / 4)];
            });

            drawHexagons(xyPointsMap, pointNames, orphans);
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
            streetViewControl: false
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

        // Register a callback for the view graph menu click
        add_tool("viewGraph", viewGraphMenuClick);

        // Register a callback for the view windows menu click
        add_tool("viewWindows", viewWindowsMenuClick);

        // Initialize the grid page and grid map
        createMap();
        findOrphans();
        initCoords(dims);
    }
})(app);
