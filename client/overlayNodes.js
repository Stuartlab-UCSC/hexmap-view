
// overlayNodes.js
// Drop new nodes onto the map

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var markers = {},
        listeners = [];

    showOverlayNodes = function () {

        var nodes = Session.get('overlayNodes');
        _.each (Object.keys(nodes), function (n) {
            markers[n] = new google.maps.Marker({
                position: get_latLng_from_xyIn(nodes[n].x, nodes[n].y),
                map: googlemap,
                title: n,
                animation: google.maps.Animation.DROP,
            });

            addHexagon(nodes[n].x, nodes[n].y, n, true);
        });
    }

    initOverlayNodes = function () {

        // Called after the map is drawn
        //return;
        console.log('initOverlayNodes');

        // Stub to simulate what should already be in Session:overlayNodes
        Session.set('overlayNodes', {
            mySample1: {
               x: 153,
               y: 135,
            },
            /*
            mySample2: {
               x: 167.91,
               y: 57.73,
            },
            */
        });

        if (!Session.equals('overlayNodes', undefined)) {
            showOverlayNodes();
        }
    }
})(app);

