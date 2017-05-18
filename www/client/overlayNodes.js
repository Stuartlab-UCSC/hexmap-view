
// overlayNodes.js
// Drop new nodes onto the map

var app = app || {}; 

(function (hex) { 
    //'use strict';

    var DEFAULT_MARKER_COLOR = 'ff0000',
        DEFAULT_MARKER_SCALE = 2,
        MARKER_WIDTH = 21,
        MARKER_HEIGHT = 34,
        MARKER_IMAGE = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|",
        markerScaledSize,
        markers = {},
        node_id = new ReactiveVar(),
        color = new ReactiveVar(),
        scale = new ReactiveVar(),
        $markerInfoWindow,
        initialized = false,
        infoWindow; // The info window for the marker, not a node.
 
    Template.markerInfoWindow.helpers({
        node_id: function () {
            return node_id.get();
        },
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

    function addMarkerClickListener(marker) {
        marker.listener = marker.addListener('click', function() {
            markerClick(marker);
        });
    }
 
    function closeInfoWindow (marker) {
 
        // Detach our DOM contents to use later
        $markerInfoWindow = $markerInfoWindow.detach();
        
        // Close the info window on the map and destroy
        if (infoWindow) {
            infoWindow.close();
            infoWindow = null;
        }
 
        // Add back the click listener
        addMarkerClickListener(marker);
    }

    function markerClick(marker) {
 
        // Handle a click on the marker
 
        // Disable the click listener while the infoWindow is open
        google.maps.event.removeListener(marker.listener);
 
        // Create a new infoWindow
        closeInfoWindow(marker);
        infoWindow = new google.maps.InfoWindow({
            content: $markerInfoWindow[0],
        });
        node_id.set(marker.node_id);
        $markerInfoWindow.show();
        infoWindow.open(googlemap, marker);
        $('#markerInfoWindow .color').focus();
 
        // Whenever the color or scale value changes, update the marker
        Tracker.autorun(function () {
            marker.setIcon(getIcon());
        });

        // On input in the color text, change the color value
        $('#markerInfoWindow .color').on('input', function (ev) {
            var val = ev.target.value;
            
            // Remove any leading '#'
            if (val.length === 7 && val.indexOf('#') === 0) {
                val = ev.target.value.slice(1);
            }
            if (val.length === 6 && val.indexOf('#') < 0) {
                color.set(val);
                marker.color = val;
            }
        });

        // On return key down in the color text, go to the next field
        $('#markerInfoWindow .color').on('keydown', function (ev) {
            if (ev.which == 13) {
                $('#markerInfoWindow .scale').focus();
                ev.preventDefault();
            }
        });

        // On input in the scale text, change the scale value
        $('#markerInfoWindow .scale').on('input', function (ev) {
            var val = ev.target.value;
            if (val.length > 0 && !isNaN(val)) {
                scale.set(val);
                marker.scale = val;
            }
        });
 
        // On return key down in the scale text, close the infoWindow
        $('#markerInfoWindow .scale').on('keydown', function (ev) {
            if (ev.which == 13) {
                closeInfoWindow(marker);
                ev.preventDefault();
            }
        });

        infoWindow.addListener('closeclick', function() {
            closeInfoWindow(marker);
        });

    }

    showOverlayNodes = function () {

        if (!initialized || _.isUndefined(Session.get('overlayNodes'))) {
            return;
        }

        // Allow the ui to catch up so we can see the pin drop
        setTimeout(function () {
        
            var nodes = Session.get('overlayNodes');

            _.each (Object.keys(nodes), function (n) {
            
                // Remove any previous markers
                if (markers[n]) {
                    markers[n].setMap(null);
                }
            
                markers[n] = new google.maps.Marker({
                    icon: getIcon(),
                    position: get_latLng_from_xyHex(nodes[n].x, nodes[n].y),
                    map: googlemap,
                    animation: google.maps.Animation.DROP,
                    title: n,
                });
                markers[n].node_id = n, // Our attribute, not google's
                markers[n].color = DEFAULT_MARKER_COLOR, // Our attribute, not google's
                markers[n].scale = DEFAULT_MARKER_SCALE, // Our attribute, not google's
                
                // Add a listener for clicking on the marker
                addMarkerClickListener(markers[n]);

                // Render the overlay hexagon
                addHexagon(nodes[n].x, nodes[n].y, n, true);
            });
        }, 500);
    }

    initOverlayNodes = function () {
 
        // Called after the map is drawn
        if (initialized) return;
 
        initialized = true;
        node_id.set('');
        color.set(DEFAULT_MARKER_COLOR);
        scale.set(DEFAULT_MARKER_SCALE);
        showOverlayNodes();
        $markerInfoWindow = $('#markerInfoWindow');
    }
 
    getOverlayNodeGroup = function (nodeGroup) {
        return nodeGroups[nodeGroup];
    }

    nodeGroups = {
        'Q5_EM_236,K12_S8,K11_S7': {
            'Q5_EM_236': { x: 24.0, y: 11.0},
            'K12_S8': { x: 21.5, y: 12.5},
            'K11_S7': { x: 21.5, y: 19.5},
        },
    };
 
    JING_OVERLAY_NODES = {
        'surgical sample': { x: 203, y: 172},
        'relapse sample': { x: 224, y: 210},
    }

    OVERLAY_NODES_YOUNGWOOK_QUANTILE_NORMALIZATION = {
        'sd01': { x: 240.5, y: 147.0},
        'sd02': { x: 127.5, y: 292.0},
        'sd03': { x: 257.5, y: 245.5},
        'sd04': { x: 115.5, y: 117.0},
        'sd05': { x: 132.5, y: 314.5},
        'sd06': { x: 95.5, y: 202.0},
        'sd07': { x: 127.5, y: 292.0},
        'sd08': { x: 206.5, y: 120.0},
        'sd09': { x: 226.5, y: 180.5},
        'sd10': { x: 127.5, y: 292.0},
    }
 
    OVERLAY_NODES_YOUNGWOOK_EXPONENTIAL_NORMALIZATION = {
        'sd01': { x: 252.0, y: 236.5},
        'sd02': { x: 247.5, y: 236.5},
        'sd03': { x: 257.0, y: 236.5},
        'sd04': { x: 149.0, y: 114.0},
        'sd05': { x: 234.5, y: 239.0},
        'sd06': { x: 255.5, y: 240.0},
        'sd07': { x: 255.5, y: 236.5},
        'sd08': { x: 255.5, y: 239.5},
        'sd09': { x: 255.5, y: 242.0},
        'sd10': { x: 255.5, y: 239.5},
    }
 
    OVERLAY_NODES_YOUNGWOOK_ORIGINAL = {
        'sd01': { x: 240.5, y: 235.0},
        'sd02': { x: 128.0, y: 292.0},
        'sd03': { x: 228.0, y: 318.5},
        'sd04': { x: 113.5, y: 110.5},
        'sd05': { x: 132.5, y: 314.0},
        'sd06': { x: 227.5, y: 364.0},
        'sd07': { x: 141.5, y: 307.5},
        'sd08': { x: 258.0, y: 246.0},
        'sd09': { x: 259.0, y: 221.0},
        'sd10': { x: 128.0, y: 293.5},
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

