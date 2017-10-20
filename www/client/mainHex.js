// mainHex.js

import { Meteor } from 'meteor/meteor';
import Coords from '/imports/mapPage/viewport/coords.js';
import CreateMap from '/imports/mapPage/calc/createMap.js';
import Grid from '/imports/densityPage/grid.js';
import Perform from '/imports/common/perform.js';
import State from '/imports/common/state.js';
import Tool from '/imports/mapPage/head/tool.js';
import Utils from '/imports/common/utils.js';
import '/imports/homePage/home.html';

// We need this order to retain the correct cascading effect.
import '/imports/lib/jquery-ui.css';
import '/imports/common/colorsFont.css';
import '/imports/common/navBar.css';

import mapPageInit from '/imports/mapPage/init/mapPageInit.js';

import '/imports/homePage/home.css';

var VERSION = 'Version 1.0';

Session.set('domLoaded', false);
window.addEventListener("load", function(event) {
    Session.set('domLoaded', true);
});

Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

Template.homePage.onRendered(function () {
    Tool.init();
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
    setTimeout(function () { // The timeout allows the google libs to load
        $(window).resize(Utils.resizeMap);
        ctx.gridCenter = Coords.centerToLatLng(ctx.gridCenter);
        Grid.init();
        
        // Resize the map to fill the available space
        Meteor.setTimeout(Utils.resizeMap, 0);
    }, 0);
}

// When the state has been loaded...
Session.set('stateLoaded', false);
function isStateLoaded (autorun) {
    if (Session.get('stateLoaded')) {
        autorun.stop();
        Perform.log('init:state-loaded');
        
        // Set timeout so the init routines will not be owned by this autorun.
        setTimeout(function () {
            if (Session.equals('page', 'mapPage')) {
                mapPageInit.init();
            }
        });
    }
}
Meteor.autorun(isStateLoaded);

Meteor.startup(() => {
    Perform.init();
    ctx = State.init();
});
