// viewport.js
// Run the hexagram visualizer client.

import '/imports/lib/color';
import colorMix from '/imports/mapPage/color/colorMix';
import coords from '/imports/mapPage/viewport/coords';
import hexagons from '/imports/mapPage/viewport/hexagons';
import rx from '/imports/common/rx';
import tool from '/imports/mapPage/head/tool';

exports.create = function  () {

    // Create the google map.
    var mapOptions = {
        center: ctx.center,
        backgroundColor: rx.get('background'),
        zoom: ctx.zoom,
        mapTypeId: "blank",
        // Don't show a map type picker.
        mapTypeControlOptions: {
            mapTypeIds: []
        },
        minZoom: 2,

        // Or a street view man that lets you walk around various Earth places.
        streetViewControl: false
    };

    // Create the actual map
    GoogleMaps.create({
        name: 'googlemap',
        options: mapOptions,
        element: document.getElementById("visualization"),
    });
    googlemap = GoogleMaps.maps.googlemap.instance;
        
    // Attach the blank map type to the map
    googlemap.mapTypes.set("blank", new coords.BlankMap());
    
    google.maps.event.addListener(googlemap, "center_changed", function() {
        ctx.center = googlemap.getCenter();
    });
    
    // We also have an event listener that checks when the zoom level changes,
    // and turns off hex borders if we zoom out far enough, and turns them on
    // again if we come back.
    google.maps.event.addListener(googlemap, "zoom_changed", function() {
        // Get the current zoom level (low is out)
        ctx.zoom = googlemap.getZoom();
        hexagons.zoomChanged();
    });
    
    // Listen to mouse events on this map
    tool.subscribe_listeners(googlemap);
};

exports.init = function () {

    // Initialize the google map and create the hexagon assignments
    exports.create();
    hexagons.create();
    colorMix.refreshColors();
};
