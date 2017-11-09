// Handle the navigation bar

import Utils from '/imports/common/utils.js';
import './navBar.html';
import './navBar.css';

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
            import Hexagons from '/imports/mapPage/viewport/hexagons.js';
            Hexagons.getAssignmentsForMapViewChange();
        } else {
            Utils.pageReload('mapPage');
        }
    });


    // Whenever the user changes, including logout, check to see
    // if the user has job credentials.
    setTimeout(function () {
    
        // Use a timeout to make this independent of the initMapPage autorun.
        Meteor.autorun( function () {
            var user = Meteor.user(); // jshint ignore: line
            if (user) {
                Meteor.call('is_user_in_role', ['jobs', 'dev'],
                    function (error, results) {
                        if (results) {
                            Session.set('jobCredential', true);
                        } else {
                            Session.set('jobCredential', false);
                        }
                    }
                );
            } else {
                Session.set('jobCredential', false);
            }
        });
    });
};
