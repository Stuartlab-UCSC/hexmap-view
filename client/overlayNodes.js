
// overlayNodes.js
// Drop new nodes onto the map

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var DEFAULT_MARKER_COLOR = 'ff0000',
        DEFAULT_MARKER_SCALE = 2,
        MARKER_WIDTH = 21,
        MARKER_HEIGHT = 34,
        MARKER_IMAGE = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|",
        markerScaledSize,
        markers = {},
        color = new ReactiveVar(),
        scale = new ReactiveVar(),
        markerAutorun,
        $markerInfoWindow;
 
    Template.markerInfoWindow.helpers({
        color: function () {
            return color.get();
        },
        scale: function () {
            return scale.get();
        },
    });
 
    function getIcon () {
        return {
            url: MARKER_IMAGE + color.get(),
            scaledSize: new google.maps.Size(
                scale.get() * MARKER_WIDTH, scale.get() * MARKER_HEIGHT),
        }
    }

    function markerClick(marker) {
 
        // Handle a click on the marker
 
        // Create an infoWindow
        color.set(marker.color);
        scale.set(marker.scale);
        var infoWindow = new google.maps.InfoWindow({
            content: $markerInfoWindow[0],
        });
        $markerInfoWindow.show();
        infoWindow.open(googlemap, marker);
        $('#markerInfoWindow .color').focus();
 
        // Whenever the color or scale value changes, update the marker
        // TODO remove this to free mem?
        markerAutorun = Tracker.autorun(function () {
            marker.setIcon(getIcon());
        });

        // On input in the color text, change the color value
        $('#markerInfoWindow .color').on('input', function (ev) {
            if (ev.target.value.length === 6) {
                color.set(ev.target.value);
                marker.color = ev.target.value;
            }
        });

        // On input in the scale text, change the scale value
        $('#markerInfoWindow .scale').on('input', function (ev) {
            var val = ev.target.value;
            if (!isNaN(val)) {
                scale.set(val);
                marker.scale = val;
            }
        });
 
        // On close of the infoWindow, attach our contents to somewhere else
        // so they will be available next time.
        infoWindow.addListener('closeclick', function() {
            $markerInfoWindow = $markerInfoWindow.detach();
        });

    }

    showOverlayNodes = function () {

        var nodes = Session.get('overlayNodes');

        _.each (Object.keys(nodes), function (n) {
        
            markers[n] = new google.maps.Marker({
                icon: getIcon(),
                position: get_latLng_from_xyHex(nodes[n].x, nodes[n].y),
                map: googlemap,
                animation: google.maps.Animation.DROP,
                title: n,
            });
            markers[n].color = DEFAULT_MARKER_COLOR, // Our attribute, not google's
            markers[n].scale = DEFAULT_MARKER_SCALE, // Our attribute, not google's
            
            // Add a listener for clicking on the marker
            markers[n].addListener('click', function() {
                markerClick(markers[n]);
            });

            // Render the overlay hexagon
            addHexagon(nodes[n].x, nodes[n].y, n, true);
        });
    }

    initOverlayNodes = function () {
 
        // Called after the map is drawn
        color.set(DEFAULT_MARKER_COLOR);
        scale.set(DEFAULT_MARKER_SCALE);
        if (!Session.equals('overlayNodes', undefined)) {
            showOverlayNodes();
        }
        $markerInfoWindow = $('#markerInfoWindow');
    }
 
    OVERLAY_NODES = {
 
        // PNOC
        'PNOC003-009': { x: 64.5, y: 228.3333333,},
        'PNOC003-011': { x: 43, y: 227.1666667 },
 
        // UCSF
        'C021_0017_RNA_new': { x: 43.6666666667, y: 240.666666667 },
        'C021_0016_RNA': { x: 40.8333333333, y: 226.833333333 },
        'C021_0006Relapse_RNA': { x: 52.6666666667, y: 232.666666667 },
        'C021_0003_RNA': { x: 43.8333333333, y: 233.0 },
        'C021_0006_RNA': { x: 45.8333333333, y: 226.833333333},

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

