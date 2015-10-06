// grid.js
// This handles the adaptive grid that was used to calculate region-based stats.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    // our map: lng: -90 -> 90  x: 0 -> 128
    //          lat: -45 -> 45  y: 0 -> 128

    var xyMapSize = 256,
        GRID_OFFSET = 256 / 4,
        SEED_RADIUS = 1000000,
        gridMap = null,
        dims = null,
        initialized = false,
        hexes = [],
        dots = [];

    function buildGrid(layout) {
        var file = ctx.project + 'grid_' + layout + '.tab';
        $.get(file, function(tsv_data) {
        
            // This is an array of lines, with two points each:
            //
            //  x1  y1  x2  y2
            //  x3  y3  x4  y4
            //  ...
            var parsed = $.tsv.parseRows(tsv_data),
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
                    zIndex: 3,
                });
                line.setMap(gridMap);
            });
        });
    }

    function buildScatter(layout) {
        var file = ctx.project + 'xyPreSquiggle_' + layout + '.tab';
        $.get(file, function(tsv_data) {
        
            // This is an array of sample locations, in the form:
            //
            //  s1  x1  y1
            //  s2  x2  y2
            //  ...

            // Parse the file
            var parsed = $.tsv.parseRows(tsv_data),
                xyPointsRaw = _.filter(parsed, function (row) {
                    return (row.length === 3);
                }),
                xyPointsObj,
                xyPointsMap,
                hexPoints,
                rawDims;

            xyPointsRaw = _.map(xyPointsRaw, function (row) {
                return [row[1], row[2]]
            });

            dims = findGridExtents(xyMapSize, xyPointsRaw);

            // Scale to create object coords of (0, 0) -> (xyMapSize/2, xyMapSize/2)
            // so the map will not wrap around the world east and west. And add
            // an offset to put the map in the center of the full map space
            xyPointsMap = _.map(xyPointsRaw, function(row) {
                return [(row[0] * dims.scale / 2) + (xyMapSize / 4),
                        (row[1] * dims.scale / 2) + (xyMapSize / 4)];
            });

/* TODO later for hexagons

            // Find the dimensions of a hexagon
            hexDim = findHexagonDims(dims.xMax, dims.yMax);

            // Draw the point as a hexagon
            _.each(xyPointsMap, function (xyPoint) {

                // Find the hexagon points
                hexPoints = getHexLatLngCoords(xyPoint, hexDim.len, hexDim.wt, hexDim.ht)
                var line = new google.maps.Polyline({
                    path: hexPoints,
                    strokeColor: '#888',
                    strokeOpacity: 1.0,
                    strokeWeight: 0,
                    fillColor: '#00F',
                    fillOpacity: 0.3,
                    zIndex: 2,
                });
                line.setMap(gridMap);
            });
*/

            console.log('zoom', ctx.zoom);

            // Draw the point as a circle
            _.each(xyPointsMap, function (xyPoint) {
                var llPoint = get_LatLng(xyPoint[0], xyPoint[1]),
                    opts = {
                        strokeColor: '#000',
                        strokeOpacity: 1,
                        strokeWeight: 0,
                        fillColor: '#00F',
                        fillOpacity: 0.3,
                        map: gridMap,
                        center: llPoint,
                        radius: SEED_RADIUS / Math.pow(2, ctx.zoom),
                        zIndex: 2,
                    }
                    hexes.push(new google.maps.Circle(opts));
                    opts['strokeWeight'] = 1;
                    opts['radius'] /= 12;
                    dots.push(new google.maps.Circle(opts));
            });
            
            initGridDrawn();
        });
    }

    function adjustForZoom () {
        ctx.zoom = gridMap.getZoom();

        console.log('zoom', ctx.zoom);

        var hexRadius = SEED_RADIUS / Math.pow(2, ctx.zoom),
            dotRadius = hexRadius / 12;

        _.each(hexes, function (hex) {
            hex.setOptions({
                radius: hexRadius,
            });
        });
        _.each(dots, function (dot) {
            dot.setOptions({
                radius: dotRadius,
            });
        });
    }

    function initGridMap () {
        mapTypeDef();
        var mapOptions = {
            center: ctx.center,
            zoom: ctx.zoom,
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

    function reInitGridMap() {
        initGridMap();
        buildScatter(current_layout_index);
        buildGrid(current_layout_index);
    }

    getGridMap = function () {
        return gridMap;
    }

    initGrid = function () {

        if (initialized) return;
        initialized = true;

        // Minor setup if this is the main map page
        if (Session.equals('page', 'mapPage')) {
            add_tool("to-grid", "Methods", function() {
                $('.gridPage').click();
                tool_active = false;
            });
            return;
        }

        // Initialize the grid page and grid map
        $('.mapOnly').hide();
        reInitGridMap();
        add_tool("to-map", "Hex Map", function() {
            $('.mapPage').click();
            tool_active = false;
        });
    }
})(app);
