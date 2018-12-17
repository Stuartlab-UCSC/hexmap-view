// hexagon.js
// Handle things to do with hexagons.

import '/imports/common/navBar.html';
import hexagons from '/imports/mapPage/viewport/hexagons'

Template.navBarT.helpers({
    mapViewLayoutSelected: function () {
        var page = Session.get('page'),
            mapView = Session.get('mapView');
        return (page && page === 'mapPage' && mapView &&
            mapView === 'honeycomb') ? 'selected' : '';
    },
    mapViewXySelected: function () {
        var page = Session.get('page'),
            mapView = Session.get('mapView');
        return (page && page === 'mapPage' && mapView &&
            mapView === 'xyCoords') ? 'selected' : '';
    },
    transparentSelected: function () {
        return (Session.get('transparent')) ? 'selected' : '';
    },
});

function showHoverInfo () {
    if (hexagons.setHoverInfoShowing()) {
        text = 'Hide Node Hover';
    } else {
        text = 'Show Node Hover';
    }
    $('#navBar .showHoverInfo').text(text)
}

exports.init = function () {

    // Default the mapView to honeycomb.
    Session.set('mapView', Session.get('mapView') || 'honeycomb');

    // Default the transparency value.
    Session.set('transparent', Session.get('transparent') || false);

    // Show/hide depending on development mode.
    if (DEV) {
        $('#navBar .transparent').show();
    } else {
        $('#navBar .transparent').hide();
    }

    // Set some event handlers
    $('#navBar li.mapLayout').on('click', function () {
        Session.set('mapView', 'honeycomb');
        Session.set('transparent', false);
        hexagons.getAssignmentsForMapViewChange();
    });

    $('#navBar li.xyCoordView').on('click', function () {
        Session.set('mapView', 'xyCoords');
        Session.set('transparent', true);
        hexagons.getAssignmentsForMapViewChange();
    });
    $('#navBar .transparent').on('click', function () {
        Session.set('transparent', !Session.get('transparent'));
        hexagons.setOpacity()
    });
    $('#navBar .showHoverInfo').on('click', showHoverInfo);
};
