/*
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
import dnt from '/imports/lib/dnt-helper.js';
import CheckLayerBox from '/imports/mapPage/calc/checkLayerBox.js';
import Colors from '/imports/mapPage/color/colorEdit.js';
import Coords from '/imports/mapPage/viewport/coords.js';
import CreateMap from '/imports/mapPage/calc/createMap.js';
import Data from '/imports/mapPage/data/data.js';
import Download from '/imports/mapPage/data/download.js';
import GChart from '/imports/mapPage/shortlist/gChart.js';
import Hexagons from '/imports/mapPage/viewport/hexagons.js';
import Hexagram from '/imports/mapPage/viewport/hexagram.js';
import Layer from '/imports/mapPage/longlist/layer.js';
import Layout from '/imports/mapPage/head/layout.js';
import Legend from '/imports/mapPage/color/legend.js';
import NavBar from '/imports/common/navBar.js';
import OverlayNodes from '/imports/mapPage/calc/overlayNodes.js';
import OverlayNodeUi from '/imports/mapPage/calc/overlayNodeUi.js';
import Perform from '/imports/common/perform.js';
import Reflect from '/imports/mapPage/calc/reflect.js';
import rxAction from '/imports/rx/rxAction.js';
import Shortlist from '/imports/mapPage/shortlist/shortlist.js';
import Select from '/imports/mapPage/shortlist/select.js';
import SetOper from '/imports/mapPage/shortlist/setOper.js';
import Sort from '/imports/mapPage/longlist/sort.js';
import SortUi from '/imports/mapPage/longlist/sortUi.js';
import Utils from '/imports/common/utils.js';

import Project from '/imports/mapPage/head/project.js';
import State from '/imports/common/state.js';
import Tool from '/imports/mapPage/head/tool.js';
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
    function showHide (snake, snakeName) {
        var $snake = $('.' + snakeName);
        if (snake) {
            
            // Show the snake if it is not yet showing.
            if ($snake.length < 1) {
                
                // Add the snake to the anchor.
                $snake = $('<div/>')
                      .addClass(snakeName)
                      .addClass('snake');
                $('.' + snakeName + 'Anchor').append($snake);
            }
        } else {
    
            // Hide the snake.
            $snake.remove();
        }
    }
    Meteor.autorun(function () {
        showHide(Session.get('mapSnake'), 'mapSnake');
    });
    Meteor.autorun(function () {
        showHide(Session.get('statsSnake'), 'statsSnake');
    });
}

function googleAnalytics() {

    // Before including google analytics, respect the user's wish not to be
    // tracked if she set this in her browser preferences.
    if (!dnt._dntEnabled()) {
		/* eslint-disable */
        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
        ga('create', 'UA-76132249-2', 'auto');
        ga('send', 'pageview');
		/* eslint-enable */
    }
}

// Phase 6b init: when the active layers have been added to the shortlist
//           and the map has rendered
//           and layout selector has been populated,
//           complete initialization.
function areLayoutsPopulated () {

    //console.log('areLayoutsPopulated()')
    //console.log('rx.getState().initAppActiveAttrsInShortlist:', rx.getState().initAppActiveAttrsInShortlist)
    //console.log('rx.getState().initAppLayoutsPopulated:', rx.getState().initAppLayoutsPopulated)
    //console.log('rx.getState().initAppMapRendered:', rx.getState().initAppMapRendered)

    if (rx.getState().initAppActiveAttrsInShortlist &&
        rx.getState().initAppLayoutsPopulated &&
        rx.getState().initAppMapRendered) {
        
        Perform.log('6b-init:complete initialization');
        unsubFx.areLayoutsPopulated()

        // Timeout to allow the map to render.
        setTimeout(function () {
            Session.set('shortlist', shortlistSaved);
            Shortlist.complete_initialization();

            // Show the appropriate options on the navigation bar.
            NavBar.init();

            // Timeout to allow some rendering to complete.
            setTimeout(function () {

                Perform.log('background-functions-init');

                Layout.initList();
                setTimeout(function () {
     
                    Perform.log('way-background-functions-init');
     
                    SortUi.init();
     
                    import LazyLoader from '/imports/mapPage/init/lazyLoader.js';
                    LazyLoader.init();

                    // Initialize the background functions.
                    Legend.init();
                    CheckLayerBox.init();
                    Reflect.init();
                    Tool.initLabel();
                    Download.init();
                    Colors.init();
                    import InfoWindow from '/imports/mapPage/viewport/infoWindow.js';
                    InfoWindow.init();
                    SetOper.init();
                    CreateMap.init();
                    Select.init();
                    GChart.init();
                    State.initBookmark();
                    OverlayNodes.init();
                    OverlayNodeUi.init();
                    if (!DEV) {
                        Perform.log('google-analytics-loading');
                        googleAnalytics();
                    }
                    Session.set('mapSnake', false);
                }, 100);
     
            });
        });
    }
}

// Phase 6a init: when the layout names have been received,
//           populate the layout selector.
function areLayoutNamesReceived (autorun) {

    //console.log('areLayoutNamesReceived()')
    //console.log('rx.getState().initAppLayoutNamesReceived:', rx.getState().initAppLayoutNamesReceived)

    if (rx.getState().initAppLayoutNamesReceived) {

        Perform.log('6a-init:layout-names-received');
        unsubFx.areLayoutNamesReceived()

        // Set timeout so the init routines will not be owned by this autorun.
        //setTimeout(function () {
            Layout.initList();
            rx.dispatch({ type: rxAction.INIT_APP_LAYOUTS_POPULATED });
        //});
    }
}

// Phase 5 init: when the map has been rendered,
//               request the secondary data.
function isMapRendered () {

    //console.log('isMapRendered ()')
    //console.log("rx.getState({ type: rxAction.INIT_APP_MAP_RENDERED })",
    //    rx.getState({ type: rxAction.INIT_APP_MAP_RENDERED }))

    if (rx.getState().initAppMapRendered) {
    
        Perform.log('5-init:request-secondary-data');
        unsubFx.isMapRendered();
        
        // Timeout to allow the map to render.
        setTimeout(function () {
            Data.requestLayoutNames(
                { rxAction: rxAction.INIT_APP_LAYOUT_NAMES_RECEIVED });
            Data.requestAttributeTags();
            Data.requestMapMeta();
            
            // Populate the project list.
            Project.init();
            
            // Populate the longlist.
            import Longlist from '/imports/mapPage/longlist/longlist.js';
            Longlist.init();
            
            // Populate the shortlist with only the active layers by faking
            // the shortlist state var.
            shortlistSaved = Session.get('shortlist');
            Session.set('shortlist', Session.get('active_layers'));
            Shortlist.init();
            rx.dispatch({ type: rxAction.INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST });
        });
    }
}

// Phase 4 init: when the map prep is complete and user is authorized,
//                 render the map.
//           ...
function isMapPreppedAndUserAuthorized () {
    if (rx.getState().initAppMapPrepared &&
        rx.getState().initMapAuthorized)  {
        
        Perform.log('4-init:render-map');
        unsubFx.isMapPreppedAndUserAuthorized();

        // Set timeout so the init routines will not be owned by this autorun.
        setTimeout(function () {
            Hexagram.initMap();
            rx.dispatch({ type: rxAction.INIT_APP_MAP_RENDERED });
        });
    }
}

// Phase 3 init: when layout assignments & colormap have been received,
//               google map api loaded and authorization received,
//               draw the map.
function isReadyToRenderMap () {
	/*
	console.log('XXX isReadyToRenderMap ()')
    console.log('rx.getState().initLayoutPositionsLoaded', rx.getState().initLayoutPositionsLoaded)
    console.log('rx.getState().initMapColormapLoaded', rx.getState().initMapColormapLoaded)
    console.log('rx.getState().initMapActiveAttrsLoaded', rx.getState().initMapActiveAttrsLoaded)
    console.log('rx.getState().initAppGoogleMapApiLoaded', rx.getState().initAppGoogleMapApiLoaded)
    */
    if (rx.getState().initLayoutPositionsLoaded &&
        rx.getState().initMapColormapLoaded &&
        rx.getState().initMapActiveAttrsLoaded &&
        rx.getState().initAppGoogleMapApiLoaded) {
        
        Perform.log('3-init:prep-map');
        unsubFx.isReadyToRenderMap();

        // Timeout allows processing to catch up.
        setTimeout(function () {
            Coords.init();
            Hexagons.init();

            // Prepare to draw the map.
            Utils.resizeMap();
            $(window).resize(Utils.resizeMap);
            $('#shortlist_holder').css('top', $('#navBar').height());
            ctx.center = Coords.centerToLatLng(ctx.center);
            rx.dispatch({ type: rxAction.INIT_APP_MAP_PREPARED });
        });
    }
}

// Phase 2 init: when layer summary and types are received, & dom loaded
//             determine the first coloring layers & default first layer.
function haveActiveLayerIndex () {

    //console.log('XXX haveActiveLayerIndex ()')
    //console.log('rx.getState().initMapLayerSummaryLoaded', rx.getState().initMapLayerSummaryLoaded)
    //console.log('rx.getState().initMapLayerTypesLoaded', rx.getState().initMapLayerTypesLoaded)

    if (rx.getState().initMapLayerSummaryLoaded &&
        rx.getState().initMapLayerTypesLoaded) {
        
        Perform.log('2-init:request-active-layers');
        unsubFx.haveActiveLayerIndex();
        
        // If the first layer was not in the types data received,
        // sort by density to get a first layer.
        var first = Session.get('first_layer'),
            shortlist = Session.get('shortlist');
        if (!first) {

            // Sort the layers to find the first layer.
            Sort.findFirstLayerByDensity();
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
    }
}

function loadGoogleMapApi () {
    
    // Request google map api
    Meteor.autorun(function (autorun) {
        if (GoogleMaps.loaded()) {
            autorun.stop();
            rx.dispatch({ type: rxAction.INIT_APP_GOOGLE_MAP_API_LOADED });
        }
    });
    GoogleMaps.load(
        { v: '3', key: 'AIzaSyBb8AJUB4x-xxdUCnjzb-Xbcg0-T1mPw3I' });
}

// Phase 1b init: when the DOM has loaded,
//                load the googlemap api,
//                and show the loading snake.
function hasDomLoaded () {
    if (rx.getState().initAppDomLoaded) {
    
        Perform.log('1b-init:init-snakes');
        unsubFx.hasDomLoaded();
        setTimeout(initSnakes);
    }
}

// Phase 1a init: State has been received,
//           so request primary data and authorization.
exports.init = function () {
    Perform.log('1a-init:request-primary-data-&-auth');

    // Iniitialize some session vars we don't want carried over
    // from the last session.
    Session.set('initedHexagons', false);
    Session.set('mapSnake', true);
    Session.set('mapMeta', {});
    
    // Request the primary data.
    Data.requestLayerSummary({ rxAction: rxAction.INIT_MAP_LAYER_SUMMARY_LOADED });
    Data.requestDataTypes({ rxAction: rxAction.INIT_MAP_LAYER_TYPES_LOADED });
    Data.requestLayoutAssignments();
    Data.requestColormaps({ rxAction: rxAction.INIT_MAP_COLORMAP_LOADED });
    
    // Subscribe to state changes.
    unsubFx.hasDomLoaded = rx.subscribe(hasDomLoaded);
    unsubFx.isReadyToRenderMap = rx.subscribe(isReadyToRenderMap);
    unsubFx.haveActiveLayerIndex = rx.subscribe(haveActiveLayerIndex);
    unsubFx.isMapPreppedAndUserAuthorized =
        rx.subscribe(isMapPreppedAndUserAuthorized);
    unsubFx.isMapRendered = rx.subscribe(isMapRendered);
    unsubFx.areLayoutsPopulated = rx.subscribe(areLayoutsPopulated);
    unsubFx.areLayoutNamesReceived  = rx.subscribe(areLayoutNamesReceived);

    // Check if the user is authorized for the project.
    Project.authorize();
    
    loadGoogleMapApi();
};
