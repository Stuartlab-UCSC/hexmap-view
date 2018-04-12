/*
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
import bookmark from '/imports/common/bookmark';
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
import snake from '/imports/common/snake.js';
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
    rx.set('init.headerLoaded');
};

// Phase 6b init: when the active layers have been added to the shortlist
//                and layout selector has been populated,
//                and the map has rendered
//                and the layer summary loaded
//                complete initialization.
function areLayoutsPopulated () {
    var R = rx.getState();
    if (R['init.activeAttrsInShortlist'] &&
        R['init.layoutsPopulated'] &&
        R['init.mapRendered'] &&
        R['init.attrSummaryLoaded']) {
        
        unsubFx.areLayoutsPopulated();
        perform.log('6b-init:complete initialization');

        // Timeout to allow the map to render.
        setTimeout(function () {
            perform.log(' 6b-init:after-timeout');
            Session.set('shortlist', shortlistSaved);
            shortlist.complete_initialization();
            layout.initList();
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
            bookmark.init();
            if (!DEV) {
                perform.log('google-analytics-loading');
                util.googleAnalytics();
            }
            rx.set('init.done');
        });
    }
}

// Phase 6a init: when the layout names have been received,
//                populate the layout selector.
function areLayoutNamesReceived () {
    if (rx.get('init.layoutNamesReceived')) {

        unsubFx.areLayoutNamesReceived();
        perform.log('6a-init:layout-names-received');

        layout.initList();
        rx.set('init.layoutsPopulated');
    }
}

// Phase 5 init: when the map has been rendered,
//               request the secondary data.
function isMapRendered () {
    if (rx.get('init.mapRendered')) {
    
        unsubFx.isMapRendered();
        perform.log('5-init:request-secondary-data');
        
        // If there are no layers, refresh to get 'no layer color'.
        if (!Session.get('first_layer')) {
            colorMix.refreshColors();
        }
        
        // Timeout to allow the map to render.
        setTimeout(function () {
            perform.log(' 5-init:after-timeout');

            data.requestLayoutNames(
                { rxAction: 'init.layoutNamesReceived' });
            data.requestAttributeTags();
            data.requestMapMeta();
            
            // Populate the longlist.
            import longlist from '/imports/mapPage/longlist/longlist';
            longlist.init();
            
            // Populate the shortlist with only the active layers by faking
            // the shortlist state var.
            shortlistSaved = Session.get('shortlist');
            Session.set('shortlist', Session.get('active_layers'));
            shortlist.init();
            rx.set('init.activeAttrsInShortlist');
        });
    }
}

// Phase 4 init: when the map prep is complete and user is authorized,
//               render the map.
function isMapPreppedAndUserAuthorized () {
    var R = rx.getState();
    if (R['init.mapPrepared'] &&
        R['user.mapAuthorized'])  {
        
        unsubFx.isMapPreppedAndUserAuthorized();
        perform.log('4-init:render-map');

        // Pause to let previous processing complete.
        setTimeout(function () {
            perform.log(' 4-init:after-timeout');
            viewport.init();
            rx.set('init.mapRendered');
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
    console.log("R['init.layoutPositionsLoaded']:", R['init.layoutPositionsLoaded'])
    console.log("R['init.colormapLoaded']:", R['init.colormapLoaded'])
    console.log("R['init.activeAttrsLoaded']:", R['init.activeAttrsLoaded'])
    console.log("R['init.googleMapApiLoaded']:", R['init.googleMapApiLoaded'])
    console.log("R['init.headerLoaded']:", R['init.headerLoaded'])
    */
    if (R['init.layoutPositionsLoaded'] &&
        R['init.colormapLoaded'] &&
        R['init.activeAttrsLoaded'] &&
        R['init.googleMapApiLoaded'] &&
        R['init.headerLoaded']) {
        
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
            rx.set('init.mapPrepared');
        });
    }
}

// Phase 2b init: when the layer summary is received,
//                we may want to find an initial coloring layer.
function haveLayerSummary () {
    var R = rx.getState();
    if (R['init.attrSummaryLoaded'] &&
        R['init.layerDataTypesProcessed']) {
    
        unsubFx.haveLayerSummary();
        perform.log('2b-init:find-first-layer-by-density');

        // Pause to let other processing complete.
        setTimeout(function () {
            perform.log(' 2b-init:after-timeout');

            // Do the initial sort.
            let first = Session.get('first_layer');
            sort.initialDensitySort();
        
            // If there was no first layer until the density sort
            // and there are static layers,
            // set the first attr to the first attr in the sort,
            // set the shortlist to the newly-found first layer,
            // set the active layers to the first layer,
            // and load the first layer data.
            if (!first && ctx.static_layer_names.length > 0) {
                first = Session.get('sortedLayers')[0];
                Session.set('first_layer', first);
                Session.set('shortlist', [first]);
                Session.set('active_layers', [first]);
                Layer.loadInitialActiveLayers();
            } else {
            
                // No layers at all, so say they are loaded to proceed.
                rx.set('init.activeAttrsLoaded');
            }
        });
    }
}

// Phase 2a init: when data types are received,
//                look for initial color layer.
function haveDataTypes () {
    var R = rx.getState();
    if (R['init.attrTypesLoaded']) {

        unsubFx.haveDataTypes();
        perform.log('2a-init:get-active-attr-values');
        
        // Pause to let other processing complete.
        setTimeout(function () {
            perform.log(' 2a-init:after-timeout');
            
            let active_layers = Session.get('active_layers');
            let shortlist = Session.get('shortlist');
            let first = Session.get('first_layer');

            // Request the initial coloring layers if we know them.
            if (active_layers.length > 0) {
                Session.set('first_layer', active_layers[0]);
                Layer.loadInitialActiveLayers();
                
            } else if (shortlist.length > 0) {
                Session.set('active_layers', [shortlist[0]]);
                Session.set('first_layer', [shortlist[0]]);
                Layer.loadInitialActiveLayers();
                
            } else if (first) {
                Session.set('shortlist', [first]);
                Session.set('active_layers', [first]);
                Layer.loadInitialActiveLayers();
            } else {
                rx.set('init.layerDataTypesProcessed');
            }
        });
    }
}

function loadGoogleMapApi () {
    
    // Request google map api
    Meteor.autorun(function (autorun) {
        if (GoogleMaps.loaded()) {
            autorun.stop();
            rx.set('init.googleMapApiLoaded');
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
    if (rx.get('init.headerLoaded')) {
    
        unsubFx.hasDomLoaded();
        perform.log('1b-init:snakes,dom-loaded');
        snake.init();
        
        if (DEV) {
            document.querySelector('#navBar .devMessage').classList.add('dev');
        }
    }
}

// Phase 1a init: State has been received,
//                so request primary data and authorization.
exports.init = function () {
    perform.log('1a-init:request-primary-data');

    // Iniitialize some session vars we don't want carried over
    // from the last session.
    Session.set('initedHexagons', false);
    Session.set('mapMeta', {});
    
    // Request the primary data.
    data.requestLayerSummary();
    data.requestDataTypes({ rxAction: 'init.attrTypesLoaded' });
    data.requestLayoutAssignments();
    data.requestColormaps({ rxAction: 'init.colormapLoaded' });
    
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

    // Load the google maps API.
    loadGoogleMapApi();
};
