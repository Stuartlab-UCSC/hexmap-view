// grid.js
// This handles the adaptive grid that was used to calculate region-based stats.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    // our map range: lng: -90 -> 90   x: 0 -> 128
    //                lat: -45 -> 45   y: 0 -> 128

    var xyMapSize = 256,
        GRID_OFFSET = 256 / 4,
        HEX_COLOR = '#00F',
        ORPHAN_COLOR = '#F00',
        HEX_LEN_SEED = 9,
        RADIUS_SEED = 100000,
        TINY_BIT = 0.000001,
        gridMap = null,
        dims = null,
        initialized = false,
        hexes = [];

    function buildGrid(layout) {
        var file = 'grid_' + layout + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            Session.get('proxPre'), function (error, parsed) {

            // This is an array of lines, with two points each:
            //
            //  x1  y1  x2  y2
            //  x3  y3  x4  y4
            //  ...

            var xyLines;

            if (error) {
                alert('Sorry, the file containing the grid points was not found ' +
                    'so only the pre-squiggle hexagons will be displayed. (grid_*.tab)')
                return;
            }

            // Remove any blank lines
            xyLines = _.filter(parsed, function (row) {
                return (row.length === 4);
            });

            xyLines = _.map(xyLines, function (row) {
                return [[parseFloat(row[0]), parseFloat(row[1])],
                        [parseFloat(row[2]), parseFloat(row[3])]];
            });

            _.each(xyLines, function (xyLine) {
                var llLine,
                    line;
                llLine = _.map(xyLine, function (xyPoint) {
                    var llPoint = get_LatLng(xyPoint[0] * dims.scale / 2 + GRID_OFFSET,
                                             xyPoint[1] * dims.scale / 2 + GRID_OFFSET);
                    return llPoint;
                });
                line = new google.maps.Polyline({
                    path: llLine,
                    strokeColor: '#888',
                    strokeOpacity: 1.0,
                    strokeWeight: 1,
                    zIndex: 4,
                });
                line.setMap(gridMap);
            });
        });
    }

    function findOrphans(layout) {

        // Find those points, pre-hexagon assignment,
        // that were not mapped to this layer's grid
        var file = 'gridOrphans_' + layout + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            Session.get('proxPre'), function (error, parsed) {;

            // This is an array of points names.
            var orphans;
            if (error) {
                orphans = [];
            } else {
                orphans = _.map(parsed, function (row) {
                    return row[0];
                });
            }

            buildScatter(layout, orphans);
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

    drawGridPoints = function (points, pointNames, orphans) {

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

            // Render the hexagon and its center, and save then in an array
            hexes.push({
                xyCenter: xyPoint,
                polygon: new google.maps.Polygon(hexOpts),
                dot: new google.maps.Polyline(dotOpts),
            });
        });
    }

    function buildScatter(layout, orphans) {

        // Render the points before they were assigned to hexagons
        var file = 'xyPreSquiggle_' + layout + '.tab';
        Meteor.call('getTsvFile', file, ctx.project,
            Session.get('proxPre'), function (error, parsed) {;

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

            // Find the extennts of the map so we and normalize it to our
            // standard size.
            dims = findGridExtents(xyMapSize-TINY_BIT, xyPointsRaw);
            buildGrid(layout);

            // Scale to create object coords of (0, 0) -> (xyMapSize/2, xyMapSize/2)
            // so the map will not wrap around the world east and west. And add
            // an offset to put the map in the center of the full map space
            xyPointsMap = _.map(xyPointsRaw, function(row) {
                return [(row[0] * dims.scale / 2) + (xyMapSize / 4),
                        (row[1] * dims.scale / 2) + (xyMapSize / 4)];
            });

            drawGridPoints(xyPointsMap, pointNames, orphans);
        });
    }

    function createMap () {
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

        if (Session.equals('page', 'homePage')) {
            return;
        }

        if (Session.equals('page', 'mapPage')) {

            // Create a link to the grid page from the map page
            add_tool("to-grid", "Methods", function() {
                $('.gridPage').click();
                tool_activity(false);
            });
            return;
        }

        // Initialize the grid page and grid map
        $('.mapOnly').hide();
        createMap();
        findOrphans(current_layout_index);
        add_tool("to-map", "Hex Map", function() {
            $('.mapPage').click();
            tool_activity(false);
        });
    }
})(app);
