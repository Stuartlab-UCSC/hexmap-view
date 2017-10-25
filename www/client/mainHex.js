// mainHex.js

import { Meteor } from 'meteor/meteor';

import Action from '/imports/store/action.js';
import ReducerCreator from  '/imports/store/reducerCreator.js';
import Coords from '/imports/mapPage/viewport/coords.js';
import CreateMap from '/imports/mapPage/calc/createMap.js';
import Grid from '/imports/densityPage/grid.js';
import mapPageInit from '/imports/mapPage/init/mapPageInit.js';
import Perform from '/imports/common/perform.js';
import State from '/imports/common/state.js';
import Tool from '/imports/mapPage/head/tool.js';
import Utils from '/imports/common/utils.js';

// We need this order to retain the correct cascading effect.
import '/imports/lib/jquery-ui.css';
import '/imports/common/colorsFont.css';
import '/imports/common/navBar.css';

VERSION = '1.0';

Session.set('domLoaded', false);
window.addEventListener("load", function(event) {
    Session.set('domLoaded', true);
});
var unsubFx = {};

Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

Template.gridPage.onRendered(function () {
    initGridMapContainer();
    NavBar.init();
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
function isStateLoaded () {
    if (rx.getState().initCtxLoad &&
        rx.getState().initStateLoad) {

        unsubFx.isStateLoaded();
        Perform.log('init:state-loaded');
        
        if (Session.equals('page', 'mapPage')) {
            mapPageInit.init();
        } else if (Session.equals('page', 'homePage')) {
           import('/imports/homePage/home.js').then(home => home.init());
        }
    }
}

function subscribeToStore () {
    unsubFx.isStateLoaded = rx.subscribe(isStateLoaded);
}

Meteor.startup(() => {
    Perform.init();
    ReducerCreator.init();
    subscribeToStore();
    ctx = State.init();
    rx.dispatch({ type: Action.INIT_CTX_LOADED })
});
