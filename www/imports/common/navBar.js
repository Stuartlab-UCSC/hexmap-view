// Handle the navigation bar

import project from '/imports/mapPage/head/project';
import utils from '/imports/common/utils';
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
        $('body').find('.mapShow').hide();
        $('body').find('.homeShow').show();
        $('body').css('overflow-y', 'auto');

    } else if (Session.equals('page', 'mapPage')) {
        $('body').find('.homeShow').hide();
        $('body').find('.mapShow').show();
        $('body').css('overflow-y', 'hidden');
    }
    
    // Hide the delete map item to start.
    document.querySelector('#navBar .deleteMap')
        .style.setProperty('display', 'none')
    
    // Add a click listener to the Home menu item.
    $('body').on('click', '.home', function() {
        utils.loadPage('homePage');
    });
    
    // Add a click listener to the Delete Map item.
    $('#navBar').on('click', '.deleteMap', function() {
        project.deleteMap()
    });
};
