
// overlayNodes.js
// Drop new nodes onto the map

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var markers = {},
        listeners = [];

    showOverlayNodes = function () {

        var nodes = Session.get('overlayNodes'),
            pinColor = "FFFFFF",
            pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                new google.maps.Size(21, 34),
                new google.maps.Point(0,0),
                new google.maps.Point(10, 34));
        
        _.each (Object.keys(nodes), function (n) {
        
            markers[n] = new google.maps.Marker({
                icon: pinImage,
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
})(app);

