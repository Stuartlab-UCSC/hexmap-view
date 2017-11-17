// mainHex.js

import { Meteor } from 'meteor/meteor';
import auth from '/imports/common/auth.js';
import coords from '/imports/mapPage/viewport/coords.js';
import createMap from '/imports/mapPage/calc/createMap.js';
import Grid from '/imports/densityPage/grid.js';
import mapPageInit from '/imports/mapPage/init/mapPageInit.js';
import navBar from '/imports/common/navBar.js';
import perform from '/imports/common/perform.js';
import rx from '/imports/common/rx.js';
import rxInternal from '/imports/common/rxInternal.js';
import state from '/imports/common/state.js';
import tool from '/imports/mapPage/head/tool.js';
import utils from '/imports/common/utils.js';

// We need this order to retain the correct cascading effect.
import '/imports/lib/jquery-ui.css';
import '/imports/common/colorsFont.css';
import '/imports/common/navBar.css';

VERSION = '1.0';

document.addEventListener('DOMContentLoaded', function(event) {
	rx.set(rx.act.INIT_APP_DOM_LOADED)
});

var unsubFx = {};

Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

Template.gridPage.onRendered(function () {
    initGridMapContainer();
});

function initGridMapContainer () { // jshint ignore: line
    setTimeout(function () { // The timeout allows the google libs to load
        $(window).resize(utils.resizeMap);
        ctx.gridCenter = coords.centerToLatLng(ctx.gridCenter);
        Grid.init();
        
        // Resize the map to fill the available space
        Meteor.setTimeout(utils.resizeMap, 0);
    }, 0);
}

// When the state has been loaded...
function isStateLoaded () {
    var R = rx.getState();
    if (R[rx.bit.initAppCtxLoaded] &&
        R[rx.bit.initAppStateLoaded]) {

        unsubFx.isStateLoaded();
        perform.log('init:state-loaded');
        
        auth.init();
        navBar.init();

        if (Session.equals('page', 'mapPage')) {
            mapPageInit.init();
        } else if (Session.equals('page', 'homePage')) {
            import('/imports/homePage/home.js').then(home => home.init());
        }
    }
}

Meteor.startup(() => {
    perform.init();
    rxInternal.init();
    unsubFx.isStateLoaded = rx.subscribe(isStateLoaded);
    ctx = state.init();
    rx.set(rx.act.INIT_APP_CTX_LOADED);
});
