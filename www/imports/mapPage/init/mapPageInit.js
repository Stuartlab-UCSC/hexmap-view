/*
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
import checkLayerBox from '/imports/mapPage/calc/checkLayerBox.js';
import colorEdit from '/imports/mapPage/color/colorEdit.js';
import coords from '/imports/mapPage/viewport/coords.js';
import createMap from '/imports/mapPage/calc/createMap.js';
import data from '/imports/mapPage/data/data.js';
import download from '/imports/mapPage/data/download.js';
import gChart from '/imports/mapPage/shortlist/gChart.js';
import hexagons from '/imports/mapPage/viewport/hexagons.js';
import hexagram from '/imports/mapPage/viewport/hexagram.js';
import Layer from '/imports/mapPage/longlist/layer.js';
import layout from '/imports/mapPage/head/layout.js';
import legend from '/imports/mapPage/color/legend.js';
import perform from '/imports/common/perform.js';
import reflect from '/imports/mapPage/calc/reflect.js';
import rx from '/imports/common/rx.js';
import shortlist from '/imports/mapPage/shortlist/shortlist.js';
import selectNode from '/imports/mapPage/shortlist/select.js';
import setOper from '/imports/mapPage/shortlist/setOper.js';
import sort from '/imports/mapPage/longlist/sort.js';
import sortUi from '/imports/mapPage/longlist/sortUi.js';
import state from '/imports/common/state.js';
import tool from '/imports/mapPage/head/tool.js';
import util from '/imports/common/util.js';
import utils from '/imports/common/utils.js';

import '/imports/mapPage/init/mapPage.html';

import '/imports/mapPage/init/mapPage.css';
import '/imports/mapPage/head/header.css';

var shortlistSaved;

// State unsubscribe functions.
var unsubFx = {};

Template.headerT.helpers({
    sort: function () {
        return Session.get('sort');
    },
    nodeCount: function () {
        return Session.get('nodeCount');
    },
});

function initSnakes () {
        
    // Manage the visibility of a progress snake given
    // relative-positioned parent anchor with a class of
    // snakeName = 'Anchor'.
    // @param snakeName snake ID with:
    //                  - an associated session variable of snakeName
    //                  - an associated relative parent anchor with a
    //                    class of snakeName + 'Anchor'
    function showHide (show, snakeName) {
        var $snake = $('.' + snakeName);
        if (show) {
            $snake.show();
        } else {
            $snake.hide();
        }
    }
    
    // Add the snakes to the dom.
    var $snake = $('<div/>')
          .addClass('mapSnake')
          .addClass('snake');
    $('body').append($snake);
    $snake = $('<div/>')
          .addClass('statsSnake')
          .addClass('snake');
    $('body').append($snake);

    Meteor.autorun(function () {
        showHide(Session.get('mapSnake'), 'mapSnake');
    });
    Meteor.autorun(function () {
        showHide(Session.get('statsSnake'), 'statsSnake');
    });
}

// Phase 6b init: when the active layers have been added to the shortlist
//                and layout selector has been populated,
//                and the map has rendered
//                complete initialization.
function areLayoutsPopulated () {
    var R = rx.getState();
    if (R[rx.bit.initAppActiveAttrsInShortlist] &&
        R[rx.bit.initAppLayoutsPopulated] &&
        R[rx.bit.initAppMapRendered]) {
        
        unsubFx.areLayoutsPopulated();
        perform.log('6b-init:complete initialization');

        // Timeout to allow the map to render.
        setTimeout(function () {
            perform.log(' 6b-init:after-timeout');
            Session.set('shortlist', shortlistSaved);
            shortlist.complete_initialization();
            layout.initList();
            sortUi.init();

            import lazyLoader from '/imports/mapPage/init/lazyLoader.js';
            lazyLoader.init();
            legend.init();
            checkLayerBox.init();
            reflect.init();
            tool.initLabel();
            download.init();
            colorEdit.init();
            
            import infoWindow from '/imports/mapPage/viewport/infoWindow.js';
            infoWindow.init();
            setOper.init();
            createMap.init();
            selectNode.init();
            gChart.init();
            state.initBookmark();
            if (!DEV) {
                perform.log('google-analytics-loading');
                util.googleAnalytics();
            }
            Session.set('mapSnake', false);
        });
    }
}

// Phase 6a init: when the layout names have been received,
//                populate the layout selector.
function areLayoutNamesReceived () {
    if (rx.get(rx.bit.initAppLayoutNamesReceived)) {

        unsubFx.areLayoutNamesReceived();
        perform.log('6a-init:layout-names-received');

        layout.initList();
        rx.set(rx.act.INIT_APP_LAYOUTS_POPULATED);
    }
}

// Phase 5 init: when the map has been rendered,
//               request the secondary data.
function isMapRendered () {
    if (rx.get(rx.bit.initAppMapRendered)) {
    
        unsubFx.isMapRendered();
        perform.log('5-init:request-secondary-data');
        
        // Timeout to allow the map to render.
        setTimeout(function () {
            perform.log(' 5-init:after-timeout');

            data.requestLayoutNames(
                { rxAction: rx.act.INIT_APP_LAYOUT_NAMES_RECEIVED });
            data.requestAttributeTags();
            data.requestMapMeta();
            
            // Populate the longlist.
            import longlist from '/imports/mapPage/longlist/longlist.js';
            longlist.init();
            
            // Populate the shortlist with only the active layers by faking
            // the shortlist state var.
            shortlistSaved = Session.get('shortlist');
            Session.set('shortlist', Session.get('active_layers'));
            shortlist.init();
            rx.set(rx.act.INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST);
        });
    }
}

// Phase 4 init: when the map prep is complete and user is authorized,
//               render the map.
function isMapPreppedAndUserAuthorized () {
    var R = rx.getState();
    if (R[rx.bit.initAppMapPrepared] &&
        R[rx.bit.initMapAuthorized])  {
        
        unsubFx.isMapPreppedAndUserAuthorized();
        perform.log('4-init:render-map');

        // Pause to let previous processing complete.
        setTimeout(function () {
            perform.log(' 4-init:after-timeout');
            hexagram.initMap();
            rx.set(rx.act.INIT_APP_MAP_RENDERED);
        });
    }
}

// Phase 3 init: when layout assignments have been received,
//               colormap has been received,
//               active attributes loaded,
//               google map api loaded,
//               and DOM loaded,
//               prepare to draw the map.
function isReadyToRenderMap () {
    var R = rx.getState();
    if (R[rx.bit.initLayoutPositionsLoaded] &&
        R[rx.bit.initMapColormapLoaded] &&
        R[rx.bit.initMapActiveAttrsLoaded] &&
        R[rx.bit.initAppGoogleMapApiLoaded] &&
        R[rx.bit.initAppDomLoaded]) {
        
        unsubFx.isReadyToRenderMap();
        perform.log('3-init:prep-map');

        // Pause to let other processing complete.
        setTimeout(function () {
            perform.log(' 3-init:after-timeout');
            coords.init();
            hexagons.init();

            // Prepare to draw the map.
            utils.resizeMap();
            $(window).resize(utils.resizeMap);
            $('#shortlist_holder').css('top', $('#navBar').height());
            ctx.center = coords.centerToLatLng(ctx.center);
            rx.set(rx.act.INIT_APP_MAP_PREPARED);
        });
    }
}

// Phase 2 init: when layer summary and types are received,
//               determine the first coloring layers & default first layer.
function haveActiveLayerIndex () {
    var R = rx.getState();
    if (R[rx.bit.initMapLayerSummaryLoaded] &&
        R[rx.bit.initMapLayerTypesLoaded]) {

        unsubFx.haveActiveLayerIndex();
        perform.log('2-init:request-active-layers');

        // Pause to let other processing complete.
        setTimeout(function () {
            perform.log(' 2-init:after-timeout');

            // If the first layer was not in the types data received,
            // sort by density to get a first layer.
            var first = Session.get('first_layer'),
                shortlist = Session.get('shortlist');
            if (!first) {

                // Sort the layers to find the first layer.
                sort.findFirstLayerByDensity();
            }
        
            // If there is now a first layer
            // and the shortlist is empty
            // and there are static layers,
            // add the first layer to the shortlist
            // and make the first_layer the active layer.
            first = Session.get('first_layer');
            if (first && shortlist.length < 1 &&
                ctx.static_layer_names.length > 0) {
                Session.set('shortlist', [first]);
                Session.set('active_layers', [first]);
            }
        
            // Load the initial active coloring layers.
            Layer.loadInitialActiveLayers();
        });
    }
}

function loadGoogleMapApi () {
    
    // Request google map api
    Meteor.autorun(function (autorun) {
        if (GoogleMaps.loaded()) {
            autorun.stop();
            rx.set(rx.act.INIT_APP_GOOGLE_MAP_API_LOADED);
        }
    });

    // Pause to let other processing complete, like the snake display.
    setTimeout(function () {
        GoogleMaps.load(
        { v: '3', key: 'AIzaSyBb8AJUB4x-xxdUCnjzb-Xbcg0-T1mPw3I' });
    });
}

// Phase 1b init: when the DOM has loaded,
//                load the googlemap api,
//                and show the loading snake.
function hasDomLoaded () {
    if (rx.get(rx.bit.initAppDomLoaded)) {
    
        unsubFx.hasDomLoaded();
        perform.log('1b-init:snakes,dom-loaded');
        initSnakes();
    }
}

// Phase 1a init: State has been received,
//                so request primary data and authorization.
exports.init = function () {
    perform.log('1a-init:request-primary-data');

    // Iniitialize some session vars we don't want carried over
    // from the last session.
    Session.set('initedHexagons', false);
    Session.set('mapSnake', true);
    Session.set('mapMeta', {});
    
    // Request the primary data.
    data.requestLayerSummary(
        { rxAction: rx.act.INIT_MAP_LAYER_SUMMARY_LOADED });
    data.requestDataTypes({ rxAction: rx.act.INIT_MAP_LAYER_TYPES_LOADED });
    data.requestLayoutAssignments();
    data.requestColormaps({ rxAction: rx.act.INIT_MAP_COLORMAP_LOADED });
    
    // Subscribe to state changes.
    unsubFx.hasDomLoaded = rx.subscribe(hasDomLoaded);
    unsubFx.isReadyToRenderMap = rx.subscribe(isReadyToRenderMap);
    unsubFx.haveActiveLayerIndex = rx.subscribe(haveActiveLayerIndex);
    unsubFx.isMapPreppedAndUserAuthorized =
        rx.subscribe(isMapPreppedAndUserAuthorized);
    unsubFx.isMapRendered = rx.subscribe(isMapRendered);
    unsubFx.areLayoutsPopulated = rx.subscribe(areLayoutsPopulated);
    unsubFx.areLayoutNamesReceived  = rx.subscribe(areLayoutNamesReceived);

    // Load the google maps API.
    loadGoogleMapApi();
};
