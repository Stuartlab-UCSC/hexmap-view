// mainHex.js

import { Meteor } from 'meteor/meteor';
import Coords from '/imports/leg/coords.js';
import CreateMap from '/imports/leg/createMap.js';
import Download from '/imports/leg/download.js';
import Grid from '/imports/leg/grid.js';
import InitMapPage from '/imports/app/initMapPage.js';
import Perform from '/imports/app/perform.js';
import State from '/imports/leg/state.js';
import Tool from '/imports/leg/tool.js';
import Utils from '/imports/app/utils.js';
import '/imports/leg/htmlCss/aHexagram.css';
import '/imports/leg/htmlCss/colorsFont.css';
import '/imports/leg/htmlCss/hexagram.html';
import '/imports/home/home.html';
import '/imports/home/home.css';

var VERSION = 'Version 1.0';

window.addEventListener("load", function(event) {
    Session.set('domLoaded', true);
});
/*
Template.localStoreT.created = function () {

    // This template is only used to initialize state and
    // begin the initial data download.
    
    // Get the googlemaps API.
    $.getScript( "https://maps.googleapis.com/maps/api/js?key=AIzaSyBb8AJUB4x-xxdUCnjzb-Xbcg0-T1mPw3I" )
        .done(function( script, textStatus ) {
            console.log( textStatus );
        })
        .fail(function( jqxhr, settings, exception ) {
            console.log( "Failed to load googlemaps API" );
        });
};
*/
Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

Template.homePage.onRendered(function () {
    Session.set('mapSnake', false);
    Tool.init();
    Download.init();
    CreateMap.init();  // TODO why?
});

Template.gridPage.onRendered(function () {
    initGridMapContainer();
    Tool.init();
});

Template.navBarT.helpers({
    version: function () {
        if (DEV) {
            return VERSION + ' DEV';
        } else {
            return VERSION;
        }
    },
});

Template.homePage.helpers({
    projects: function () {
        return [
            { id: 'Pancan12/SampleMap', png: 'pancan12.png' },
            { id: 'Pancan12/GeneMap', png: 'pancan12gene.png' },
            { id: 'Gliomas', png: 'gliomas-paper.png' },
            { id: 'QuakeBrain', png: 'QuakeBrain.png' },
            { id: 'pCHIPS', png: 'pchips.png' },
            { id: 'mgmarin_public/PCAWG_JuncBASE_CassetteExonPSIs',
                label: 'PCAWG JuncBASE CassetteExonPSIs',
                linkAnchor: 'PCAWGJuncBASE',
                png: 'PCAWG_JuncBASE.png' },
        ];
    },
    id: function () {
        return this.id;
    },
    label: function () {
        if (this.label) {
            return this.label;
        } else {
            return this.id;
        }
    },
    png: function () {
        return this.png;
    },
    linkAnchor: function () {
        if (this.linkAnchor) {
            return this.linkAnchor.toLowerCase();
        } else if (this.label) {
            return this.label.toLowerCase();
        } else {
            return this.id.toLowerCase();
        }
    },
    version: function () {
        if (DEV) {
            return VERSION + ' DEV';
        } else {
            return VERSION;
        }
    },
});

function initGridMapContainer () { // jshint ignore: line
    Session.set('mapSnake', true);
    setTimeout(function () { // The timeout allows the google libs to load
        $(window).resize(Utils.resizeMap);
        ctx.gridCenter = Coords.centerToLatLng(ctx.gridCenter);
        Grid.init();
        
        // Resize the map to fill the available space
        Meteor.setTimeout(Utils.resizeMap, 0);
    }, 0);
}

Meteor.startup(() => {
    Perform.init();
    ctx = State.init();
    Perform.log('Meteor.startup for project: ' + ctx.project);
    if (Session.equals('page', 'mapPage')) {
        InitMapPage.init();
    }
});
