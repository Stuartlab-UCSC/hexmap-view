
// overlayNodes.js
// Drop new nodes onto the map

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var markers = {},
        listeners = [];

    showOverlayNodes = function () {

        var nodes = Session.get('overlayNodes'),
            pinColor = "ff0000",
            origImage = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
            scale = 2,

            // TODO: this scaled marker does not work through the current
            // google maps meteor package, so go with the default for now
            // InvalidValueError: setIcon: not a string; and no url property; and no path property
            marker = new google.maps.Marker({
                map: googlemap,
                icon: new google.maps.MarkerImage(
                    origImage,
                    //'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor,
                    //'http://www.gettyicons.com/free-icons/108/gis-gps/png/24/needle_left_yellow_2_24.png',
                    new google.maps.Size(24, 24),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(0, 24)
                )
            }),
            pinImage = new google.maps.MarkerImage(
                marker.getIcon().ra,
                new google.maps.Size(
                    marker.getIcon().size.width * scale,
                    marker.getIcon().size.height * scale
                ),
                new google.maps.Point(0,0),
                new google.maps.Point (
                    marker.getIcon().anchor.x * scale,
                    marker.getIcon().anchor.y * scale / 2
                )
            );
/*
            // TODO This method may be too old vor v3 api
            pinImage = new google.maps.MarkerImage(
                origImage.ra,
                // This actually makes a smaller pin
                new google.maps.Size(84, 136),
                new google.maps.Point(0,0),
                new google.maps.Point(42, 136));
                //new google.maps.Size(21, 34),   // default size
                //new google.maps.Point(0,0),     // default origin
                //new google.maps.Point(10, 34)); // default anchor
*/
        _.each (Object.keys(nodes), function (n) {
        
            markers[n] = new google.maps.Marker({
                //icon: pinImage,
                position: get_latLng_from_xyHex(nodes[n].x, nodes[n].y),
                map: googlemap,
                title: n,
                animation: google.maps.Animation.DROP,
            });

            // Render the overlay hexagon
            addHexagon(nodes[n].x, nodes[n].y, n, true);
        });
    }

    initOverlayNodes = function () {

        // Called after the map is drawn
        if (!Session.equals('overlayNodes', undefined)) {
            showOverlayNodes();
        }
    }
 
    OVERLAY_NODES = {
        // First
        'PNOC003-009': { x: 64.5, y: 228.3333333, },
        'PNOC003-011': { x: 43, y: 227.1666667 },
 
        // UCSF
        'C021_0017_RNA_new': { x: 43.6666666667, y: 240.666666667 },
        'C021_0016_RNA': { x: 40.8333333333, y: 226.833333333 },
        'C021_0006Relapse_RNA': { x: 52.6666666667, y: 232.666666667 },
        'C021_0003_RNA': { x: 43.8333333333, y: 233.0 },
 
        // Stanford
        'K1_S1': { x: 204.833333333, y: 194.666666667 },
        'K2_S2': { x: 206.0, y: 196.166666667 },
        'K3_S3': { x: 73.3333333333, y: 153.333333333 },
        'K4_S4': { x: 189.333333333, y: 195.666666667 },
        'K5_S9': { x: 251.166666667, y: 205.666666667 },
        'K6_S10': { x: 170.666666667, y: 200.166666667 },
        'K7_S11': { x: 170.666666667, y: 200.166666667 },
        'K8_S12': { x: 139.666666667, y: 354.5 },
        'K9_S5': { x: 230.166666667, y: 186.833333333 },
        'K10_S6': { x: 422.833333333, y: 106.5 },
        'K11_S7': { x: 221.833333333, y: 15.8333333333 },
        'K12_S8': { x: 217.5, y: 57.0 },
    };
})(app);

