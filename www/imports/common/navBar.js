// Handle the navigation bar

import utils from '/imports/common/utils.js';
import './navBar.html';
import './navBar.css';

VERSION = '1.0';

Template.navBarT.helpers({
    version: function () {
        if (DEV) {
            return VERSION + ' DEV';
        } else {
            return VERSION;
        }
    },
});

exports.init = function () {

    // Initialize for the page we are on, first enabling all
    $('#navBar *').removeClass('disabled');
    if (Session.equals('page', 'homePage')) {
        $('body').find('.mapShow, .gridShow').hide();
        $('body').find('.homeShow').show();
        $('body').css('overflow-y', 'auto');

    } else if (Session.equals('page', 'mapPage')) {
        $('body').find('.homeShow, .gridShow').hide();
        $('body').find('.mapShow').show();
        $('body').css('overflow-y', 'hidden');

    } else if (Session.equals('page', 'gridPage')) {
        $('body').find('.homeShow, .mapShow').hide();
        $('body').find('.gridShow').show();
        $('body').css('overflow-y', 'hidden');
    }
    
    $('#navBar li.mapLayout').on('click', function () {
        Session.set('mapView', 'honeycomb');
        Session.set('transparent', false);
        if (Session.equals('page', 'mapPage')) {
            import hexagons from '/imports/mapPage/viewport/hexagons.js';
            hexagons.getAssignmentsForMapViewChange();
        } else {
            utils.pageReload('mapPage');
        }
    });
};
