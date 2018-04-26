/*
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
import colorEdit from '/imports/mapPage/color/colorEdit';
import colorMix from '/imports/mapPage/color/colorMix';
import coords from '/imports/mapPage/viewport/coords';
import createMap from '/imports/mapPage/calc/createMap';
import data from '/imports/mapPage/data/data';
import download from '/imports/mapPage/data/download';
import gChart from '/imports/mapPage/shortlist/gChart';
import hexagons from '/imports/mapPage/viewport/hexagons';
import viewport from '/imports/mapPage/viewport/viewport';
import Layer from '/imports/mapPage/longlist/Layer';
import layout from '/imports/mapPage/head/layout';
import legend from '/imports/mapPage/color/legend';
import perform from '/imports/common/perform';
import reflect from '/imports/mapPage/calc/reflect';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import selectNode from '/imports/mapPage/shortlist/select';
import setOper from '/imports/mapPage/shortlist/setOper';
import snake from '/imports/mapPage/init/snake.js';
import sort from '/imports/mapPage/longlist/sort';
import sortUi from '/imports/mapPage/longlist/sortUi';
import tool from '/imports/mapPage/head/tool';
import util from '/imports/common/util';
import utils from '/imports/common/utils';

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
Template.mapPage.rendered = function () {
    rx.set('inited.dom');
};

// Phase 6c init: when the active layers have been added to the shortlist
//                and layout selector has been populated,
//                and the map has rendered
//                and the layer summary loaded
//                complete initialization.
function areLayoutsPopulated () {
    var R = rx.getState();
    /*
    console.log('\nareLayoutsPopulated()')
    console.log('init.activeAttrs', R['init.activeAttrs'])
    console.log('inited.attrTypes', R['inited.attrTypes'])
    console.log('init.layoutNames', R['init.layoutNames'])
    console.log('init.map', R['init.map'])
    console.log('inited.attrSummary', R['inited.attrSummary'])
    */
    if (R['init.activeAttrs'] === 'inShortlist' &&
        R['inited.attrTypes'] &&
        R['init.layoutNames'] === 'populated' &&
        R['init.map'] === 'rendered' &&
        R['inited.attrSummary']) {
        
        unsubFx.areLayoutsPopulated();
        perform.log('6c-init:complete initialization');

        // Initial those that need data retrieved.
        layout.initList();

        // Timeout to allow the map to render.
        setTimeout(function () {
            Session.set('shortlist', shortlistSaved);
            shortlist.complete_initialization();
            perform.log(' 6c-init:after-timeout');
            sortUi.init();

            import lazyLoader from '/imports/mapPage/init/lazyLoader';
            lazyLoader.init();
            legend.init();
            reflect.init();
            tool.initLabel();
            download.init();
            colorEdit.init();
            
            import infoWindow from '/imports/mapPage/viewport/infoWindow';
            infoWindow.init();
            setOper.init();
            createMap.init();
            selectNode.init();
            gChart.init();
            if (!DEV) {
                perform.log('google-analytics-loading');
                util.googleAnalytics();
            }
            rx.set('initialized');
        });
    }
}

// Phase 6a init: when the layout names have been received,
//                populate the layout selector.
function areLayoutNamesReceived () {
    if (rx.get('init.layoutNames') === 'received') {

        unsubFx.areLayoutNamesReceived();
        perform.log('6a-init:layout-names-received');

        layout.initList();
        rx.set('init.layoutNames.populated');
    }
}

// Phase 5 init: when the map has been rendered,
//               request the secondary data.
function isMapRendered () {
    if (rx.get('init.map') === 'rendered') {
    
        unsubFx.isMapRendered();
        perform.log('5-init:request-secondary-data');
        
        // If there are no layers, refresh to get 'no layer color'.
        if (rx.get('firstAttr') === null) {
            colorMix.refreshColors();
            rx.set('snake.map.hide');
        }
        
        // Timeout to allow the map to render.
        setTimeout(function () {
            perform.log(' 5-init:after-timeout');

            // Populate the longlist.
            import longlist from '/imports/mapPage/longlist/longlist';
            longlist.init();
            
            // Populate the shortlist with only the active layers by faking
            // the shortlist state var.
            shortlistSaved = Session.get('shortlist');
            Session.set('shortlist', rx.get('activeAttrs'));
            shortlist.init();
            rx.set('init.activeAttrs.inShortlist');
        });
    }
}

function loadGoogleMapApi () {
    
    // Request google map api
    Meteor.autorun(function (autorun) {
        if (GoogleMaps.loaded()) {
            autorun.stop();
            rx.set('inited.googleMapApi');
        }
    });

    // Pause to let other processing complete, like the snake display.
    setTimeout(function () {
        GoogleMaps.load(
            { v: '3', key: 'AIzaSyBb8AJUB4x-xxdUCnjzb-Xbcg0-T1mPw3I' });
    });
}

// Phase 4 init: when the map prep is complete and user is authorized,
//               render the map.
function isMapPreppedAndUserAuthorized () {
    var R = rx.getState();
    /*
    console.log('\nisMapPreppedAndUserAuthorized()')
    console.log("R['init.map']:", R['init.map'])
    console.log("R['user.mapAuthorized']:", R['user.mapAuthorized'])
    */
    if (R['init.map'] === 'prepared' &&
        R['user.mapAuthorized'])  {
        
        unsubFx.isMapPreppedAndUserAuthorized();
        perform.log('4-init:render-map');
        
        // Request secondary data.
        data.requestLayoutNames(
            { rxAction: 'init.layoutNames.received' });
        data.requestAttributeTags();
        data.requestMapMeta();
        
        // This timeout prevents isMapRendered() from executing twice,
        // for some timing reason.
        setTimeout(function () {
            viewport.init();
            rx.set('init.map.rendered');
            setTimeout(function () {
                rx.set('snake.map.hide');
            });
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
    /*
    console.log('\nisReadyToRenderMap()')
    console.log("R['inited.layout']:", R['inited.layout'])
    console.log("R['inited.colormap']:", R['inited.colormap'])
    console.log("R['init.activeAttrs']:", R['init.activeAttrs'])
    console.log("R['inited.googleMapApi']:", R['inited.googleMapApi'])
    console.log("R['inited.dom']:", R['inited.dom'])
    */
    if (R['inited.layout'] &&
        R['inited.colormap'] &&
        R['init.activeAttrs'] === 'valuesLoaded' &&
        R['inited.googleMapApi'] &&
        R['inited.dom']) {
        
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
            rx.set('init.map.prepared');
        });
    }
}

// Phase 2b init: when the layer summary is received,
//                do the initial sort by density,
//                find an initial coloring layer if we haven't already.
function haveLayerSummary () {
    var R = rx.getState();
    /*
    console.log('\nhaveLayerSummary()')
    console.log('inited.attrSummary', R['inited.attrSummary'])
    console.log('inited.attrTypes', R['inited.attrTypes'])
    */
    if (R['inited.attrSummary'] &&
        R['inited.attrTypes']) {
    
        unsubFx.haveLayerSummary();
        perform.log('2b-init:find-first-layer-by-density');

        // Pause to let other processing complete.
        setTimeout(function () {
            perform.log(' 2b-init:after-timeout');

            // Do the initial sort.
            let first = rx.get('firstAttr');
            sort.initialDensitySort();
            
            // If there are any static layers...
            if (ctx.static_layer_names.length > 0) {
                if (!first) {
                    first = Session.get('sortedLayers')[0];
                    rx.set('firstAttr', { attr: first });
                }
                if (rx.get('activeAttrs').length < 1) {

                    // Load the first layer's data.
                    Session.set('shortlist', [first]);
                    rx.set('activeAttrs.updateAll', { attrs: [first] });
                    Layer.loadInitialActiveLayers();
                }

            } else {
            
                // No layers at all, so say they are loaded to proceed.
                rx.set('init.activeAttrs.valuesLoaded');
            }
        });
    }
}

// Phase 2a init: when data types are received,
//                look for initial color layer.
function haveDataTypes () {
    var R = rx.getState();
    /*
    console.log('\haveDataTypes()')
    console.log('inited.attrTypes', R['inited.attrTypes'])
    */
    if (R['inited.attrTypes']) {

        unsubFx.haveDataTypes();
        perform.log('2a-init:get-active-attr-values');
        
        let first = rx.get('firstAttr');

        // Pause to let other processing complete.
        setTimeout(function () {

            // Request the 'first' attr as the initial coloring layer
            // if we don't have active layers identified yet.
            if (first && rx.get('activeAttrs').length < 1) {
                Session.set('shortlist', [first]);
                rx.set('activeAttrs.updateAll', { attrs: [first] });
                Layer.loadInitialActiveLayers();
            }
        });
    }
}

// Phase 1b init: when the DOM has loaded,
//                show the loading snake.
function hasDomLoaded () {
    if (rx.get('inited.dom')) {
        unsubFx.hasDomLoaded();
        perform.log('1b-init:snakes,dom-loaded');
        
        snake.init();
        if (DEV) {
            document.querySelector('#navBar .devMessage').classList.add('dev');
        }
    }
}

// Phase 1a init: State has been received,
//                so request primary.
exports.init = function () {
    perform.log('1a-init:request-primary-data');

    // Iniitialize some session vars we don't want carried over
    // from the last session.
    Session.set('initedHexagons', false);
    Session.set('mapMeta', {});
    
    // Request the primary data.
    data.requestLayerSummary();
    data.requestLayoutAssignments();
    data.requestColormaps({ rxAction: 'inited.colormap' });
    
    // Subscribe to state changes.
    unsubFx.hasDomLoaded = rx.subscribe(hasDomLoaded);
    unsubFx.haveLayerSummary = rx.subscribe(haveLayerSummary);
    unsubFx.isReadyToRenderMap = rx.subscribe(isReadyToRenderMap);
    unsubFx.haveDataTypes = rx.subscribe(haveDataTypes);
    unsubFx.isMapPreppedAndUserAuthorized =
        rx.subscribe(isMapPreppedAndUserAuthorized);
    unsubFx.isMapRendered = rx.subscribe(isMapRendered);
    unsubFx.areLayoutsPopulated = rx.subscribe(areLayoutsPopulated);
    unsubFx.areLayoutNamesReceived  = rx.subscribe(areLayoutNamesReceived);

    // Initialize the data types arrays.
    ctx.bin_layers = [];
    ctx.cat_layers = [];
    ctx.cont_layers = [];
    

    // Request the initial coloring layers if we know them yet.
    let activeAttrs = rx.get('activeAttrs');
    let shortlist = Session.get('shortlist');
    if (activeAttrs.length > 0) {
        rx.set('firstAttr', { attr: activeAttrs[0] });
        Layer.loadInitialActiveLayers();
    } else if (shortlist.length > 0) {
        rx.set('firstAttr', { attr: shortlist[0] });
        rx.set('attrActive.updateAll', { attrs: [shortlist[0]] });
        Layer.loadInitialActiveLayers();
    }
    data.requestDataTypes();
    
    loadGoogleMapApi();
};
