/**
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
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
import OverlayNodes from '/imports/mapPage/calc/overlayNodes.js';
import OverlayNodeUi from '/imports/mapPage/calc/overlayNodeUi.js';
import Perform from '/imports/common/perform.js';
import Reflect from '/imports/mapPage/calc/reflect.js';
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
    //                  - an associated Session variable of snakeName
    //                  - an associated relative parent anchor with a
    //                    class of snakeName + 'Anchor'a
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

    // Start up these autoruns independent of the map init autorun.
    setTimeout(function () {
        Meteor.autorun(function () {
            var snake = Session.get('mapSnake'),
                domLoaded = Session.get('domLoaded');
            if (domLoaded) {
                showHide(snake, 'mapSnake');
            }
        });
        Meteor.autorun(function () {
            var snake = Session.get('statsSnake'),
                domLoaded = Session.get('domLoaded');
            if (domLoaded) {
                showHide(snake, 'statsSnake');
            }
        });
    });
}

function googleAnalytics() {
/* eslint-disable */
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
ga('create', 'UA-76132249-2', 'auto');
ga('send', 'pageview');
//<script async src='https://www.google-analytics.com/analytics.js'>
//  </script>
/* eslint-enable */
}

// Phase 3 init: when the project and layout selectors have been populated,
//           complete initialization.
Session.set('projectsPopulated', false);
Session.set('layoutsPopulated', false);
function areProjectsAndLayoutsPopulated (autorun) {
    if (Session.get('projectsPopulated') &&
        Session.get('layoutsPopulated')) {
        autorun.stop();
        Perform.log('3-init:complete initialization');

        // TODO retrieve googlecharts
        
        Session.set('shortlist', shortlistSaved);
        Shortlist.complete_initialization();

        // Show the appropriate options on the navigation bar.
        Tool.init();

        // Allow some rendering to happen.
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
    }
}
Meteor.autorun(areProjectsAndLayoutsPopulated);

// Phase 2.2 init: when the layout names have been received,
//           populate the layout selector.
Session.set('layoutNamesReceived', false);
function areLayoutNamesReceived (autorun) {
    if (Session.get('layoutNamesReceived')) {
        autorun.stop();
        Perform.log('2.2-init:layout-names-received');

        Layout.initList();
        Session.set('layoutsPopulated', true);
    }
}
Meteor.autorun(areLayoutNamesReceived);

// Phase 2.1 init: when the projects have been received,
//           populate the project selector.
Session.set('projectDataReceived', false);
function areProjectsReceived (autorun) {
    if (Session.get('projectDataReceived')) {
        autorun.stop();
        Perform.log('2.1-init:populate-projects');
        
        Project.init();
        Session.set('projectsPopulated', true);
    }
}
Meteor.autorun(areProjectsReceived);

// Phase 2 init: when the map has been rendered,
//               request the secondary data.
Session.set('mapRendered', false);
function isMapRendered (autorun) {
    if (Session.get('mapRendered')) {
        autorun.stop();
        Perform.log('2-init:request-secondary-data');
        
        // Request the secondary data after a timeout to let the map render.
        setTimeout(function () {
            // TODO after project data is handled by the calc server...
            //Data.requestProjects();
            Session.set('projectDataReceived', true);
            
            Data.requestLayoutNames({ stateVar: 'layoutNamesReceived' });
            
            Data.requestAttributeTags();
            Data.requestMapMeta();

            // Populate the longlist.
            import Longlist from '/imports/mapPage/longlist/longlist.js';
            Longlist.init();
            
            // Populate the shortlist with only the active layers by faking
            // the shortlist state var.
            shortlistSaved = Session.get('shortlist');
            Session.set('shortlist', Session.get('active_layers'));
            Shortlist.init();
        });
    }
}
Meteor.autorun(isMapRendered);

// Phase 1.1.1.1 init: when layout assignments & colormap have been received,
//               dom loaded and authorization received,
//               draw the map.
Session.set('layoutAssignmentsReceived', false);
Session.set('colormapsLoaded', false);
Session.set('activeLayersLoaded', false);
Session.set('authReceived', false);
function areReadyToRenderMap (autorun) {
    if (Session.get('layoutAssignmentsReceived') &&
        Session.get('colormapsLoaded') &&
        Session.get('activeLayersLoaded') &&
        Session.get('authReceived') &&
        Session.get('domLoaded')) {
        autorun.stop();
        Perform.log('1.1.1.1-init:render-map');

        // retrieve googlemap apis
        // is there a event telling us when these are available?
        Coords.init();
        Hexagons.init();

        // Prepare to draw the map.
        Utils.resizeMap();
        $(window).resize(Utils.resizeMap);
        $('#shortlist_holder').css('top', $('#navBar').height());
        ctx.center = Coords.centerToLatLng(ctx.center);
        Session.set('mapPrepComplete', true);
    
        // Draw the map.
        Hexagram.initMap();
        Session.set('mapRendered', true);
    }
}
Meteor.autorun(areReadyToRenderMap);

// Phase 1.1.1 init: when layer summary and types are received, & dom loaded
//             determine the first coloring layers & default first layer.
Session.set('layerSummaryLoaded', false);
Session.set('layerTypesLoaded', false);
function haveActiveLayerIndex (autorun) {
    if (Session.get('layerSummaryLoaded') &&
        Session.get('layerTypesLoaded')) {
        autorun.stop();
        Perform.log('1.1.1-init:request-active-layers');

        // If the first layer was not in the types data received,
        // sort by density to get a first layer.
        var first = Session.get('first_layer'),
            shortlist = Session.get('shortlist');
        if (!first) {

            // Sort the layers to find the first layer.
            Sort.findFirstLayerByDensity();
        }
        
        // If there are no shortlist layers from state,
        // and there are static layers,
        // add the first layer to the shortlist
        // and make the first_layer the active layer.
        first = Session.get('first_layer');
        if (first && shortlist.length < 1 &&
            ctx.static_layer_names.length > 0) {
            Session.set('shortlist', [first]);
            Session.set('active_layers', [first]);
        }
        
        // TODO move some of this to data.js
        // should this be dependent on dom loaded?
        Layer.loadInitialActiveLayers();
    }
}
Meteor.autorun(haveActiveLayerIndex);

// Phase 1.2 init: when primary data has been requested and DOM loaded,
//           show the loading snake.
Session.set('primaryDataRequested', false);
function hasInitialDataBeenRequested (autorun) {
    if (Session.get('primaryDataRequested') &&
        Session.get('domLoaded')) {
        autorun.stop();
        Perform.log('1.2-init:init-snakes');
        
        initSnakes();
    }
}
Meteor.autorun(hasInitialDataBeenRequested);

// Phase 1.1 init: State has been received,
//           so request primary data and authorization.
exports.init = function () {
    Perform.log('1.1-init:request-primary-data-&-auth');
    
    Session.set('mapSnake', true);
    Data.requestLayerSummary({ stateVar: 'layerSummaryLoaded' });
    Data.requestDataTypes({ stateVar: 'dataTypesLoaded' });
    Data.requestLayoutAssignments({ stateVar: 'layoutAssignmentsReceived' });
    Data.requestColormaps({ stateVar: 'colormapsLoaded' });
    Session.set('primaryDataRequested', true);

    // TODO authenticate and authorize
    Session.set('authReceived', true);
};
