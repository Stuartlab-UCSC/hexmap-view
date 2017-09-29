/**
 * Initialize the map page.
 */

import { Meteor } from 'meteor/meteor';
import CheckLayerBox from '/imports/leg/checkLayerBox.js';
import Colors from '/imports/leg/colors.js';
import Coords from '/imports/leg/coords.js';
import CreateMap from '/imports/leg/createMap.js';
import Data from '/imports/app/data.js';
import Download from '/imports/leg/download.js';
import Filter from '/imports/leg/filter.js';
import GChart from '/imports/leg/gChart.js';
import Hexagons from '/imports/leg/hexagons.js';
import Hexagram from '/imports/leg/hexagram.js';
import Layer from '/imports/leg/layer.js';
import Legend from '/imports/leg/legend.js';
import Message from '/imports/leg/message.js';
import OverlayNodes from '/imports/leg/overlayNodes.js';
import OverlayNodeUi from '/imports/leg/overlayNodeUi.js';
import Perform from '/imports/app/perform.js';
import Project from '/imports/leg/project.js';
import Reflect from '/imports/leg/reflect.js';
import Shortlist from '/imports/leg/shortlist.js';
import Select from '/imports/leg/select.js';
import SetOper from '/imports/leg/setOper.js';
import Sort from '/imports/leg/sort.js';
import SortUi from '/imports/leg/sortUi.js';
import State from '/imports/leg/state.js';
import Tool from '/imports/leg/tool.js';
import Utils from '/imports/app/utils.js';
import '/imports/leg/htmlCss/aHexagram.css';
import '/imports/leg/htmlCss/colorsFont.css';
import '/imports/leg/htmlCss/navBar.html';
import '/imports/leg/htmlCss/navBar.css';
import '/imports/leg/htmlCss/hexagram.html';
import '/imports/leg/htmlCss/jobs.html';

Template.headerT.helpers({
    sort: function () {
        return Session.get('sort');
    },
    nodeCount: function () {
        return Session.get('nodeCount');
    },
});

function initSnake (snakeName, before) {
        
    // Manage the visibility of a progress snake given
    // relative-positioned parent anchor with a class of
    // snakeName = 'Anchor'.
    // @param snakeName snake ID with:
    //                  - an associated Session variable of snakeName
    //                  - an associated relative parent anchor with a
    //                    class of snakeName + 'Anchor'
    Session.set('mapSnake', true);
    Meteor.autorun(function () {
        var snake = Session.get(snakeName),
            $snake = $('.' + snakeName);
        if (snake) {
            
            // Show a snake if it is not yet showing
            // and the anchor element exists.
            var $anchor = $('.' + snakeName + 'Anchor');
            if ($snake && $snake.length < 1 &&
                $anchor && $anchor.length) {
                
                // Add the snake to the anchor.
                $snake = $('<div/>')
                      .addClass(snakeName)
                      .addClass('snake');
                if (before) {
                    $anchor.before($snake);
                } else {
                    $anchor.append($snake);
                }
            }
        } else {
    
            // Hide snake if it is showing
            if ($snake && $snake.length) {
                $snake.remove();
            }
        }
    });
}

function googleAnalytics() {
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', 'UA-76132249-2', 'auto');
    ga('send', 'pageview');
    //<script async src='https://www.google-analytics.com/analytics.js'></script>
}

// Phase 5 init: when all data has been loaded
//               and the map has been prepared to be drawn,
//               then initialize the map and the rest of the app.
Session.set('initedHexagons', false);
Session.set('firstLayerLoaded', false);
Session.set('initedColormaps', false);
Session.set('mapPrepComplete', false);
function mapPrepComplete (autorun) {
    if (Session.get('initedHexagons') &&
        Session.get('firstLayerLoaded') &&
        Session.get('initedColormaps') &&
        Session.get('mapPrepComplete')) {
        autorun.stop();
        Perform.log('5-init:-all-data-loaded');
   
        Hexagram.initMap();

        // Turn off the loading progress wheel
        setTimeout(function () {
            Perform.log('mapSnake-was-hidden');
            Session.set('mapSnake', false);
        }, 500);

        Perform.log('background-functions-init');
        SortUi.init();
        Filter.init();
        import Longlist from '/imports/leg/longlist.js';
        Longlist.init();

        //Meteor.setTimeout(function () {

            import LazyLoader from '/imports/app/lazyLoader.js';
            LazyLoader.init();
 
            // Initialize the background functions.
            Hexagram.initLayoutList();
            Legend.init();
            Shortlist.init();
            CheckLayerBox.init();
            Reflect.init();
            Tool.initLabel();
            Download.init();
            Colors.init();
            import InfoWindow from '/imports/leg/infoWindow.js';
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
        //});
    }
}
Meteor.autorun(mapPrepComplete);

// Phase 4 init: when the first layer has been found
//               and the layout index data received,
//               get the node coords, first layer data & colormaps,
//               then prepare for the map to be drawn.
Session.set('firstLayerFound', false);
function firstLayerWasFound (autorun) {
    if (Session.get('firstLayerFound') &&
        Session.get('layouts')) {
        autorun.stop();
        Perform.log('4-init:first-layer-found');
        
        // TODO can this be later?
        Coords.init();

        // Get the rest of the initial data.
        Hexagons.init();
        Layer.loadFirstLayer();
        Hexagram.initColormaps();
   
        // Initialize some more.
        Tool.init();

        // Prepare to draw the map.
        //setTimeout(function () { // The timeout allows the google libs to load
            Utils.resizeMap();
            $(window).resize(Utils.resizeMap);
            $('#shortlist_holder').css('top', $('#navBar').height());
            ctx.center = Coords.centerToLatLng(ctx.center);
            Session.set('mapPrepComplete', true);
        //}, 0);
    }
}
Meteor.autorun(firstLayerWasFound);

// Phase 3 init: when the data to determine the first layer is loaded,
//               sort to find the first layer if not supplied with types.
Session.set('layerIndexReceived', false);
Session.set('initedLayerTypes', false);
function haveFirstLayerData (autorun) {
    if (Session.get('layerIndexReceived') &&
        Session.get('initedLayerTypes')) {
        autorun.stop();
        Perform.log('3-init:first-layer-data-received');

        // If the first layer was not in the types data received...
        var first_layer = Session.get('first_layer');
        if (!first_layer || first_layer === 'undefinedFirstLayer') {
            
            // Sort the layers to find the first layer.
            Sort.findFirstLayerByDensity();
        }
        Session.set('firstLayerFound', true);
    }
}
Meteor.autorun(haveFirstLayerData);

// Phase 2 init: when the project list is loaded,
//               get the data needed to determine the first layer.
Session.set('initedProject', false);
function areProjectsLoaded (autorun) {
    if (Session.get('initedProject')) {
        autorun.stop();
        Perform.log('2-init:projects-loaded');
    }
    // TODO remove this phase.
}
Meteor.autorun(areProjectsLoaded);

// Phase 1 init: when meteor has been rendered.
function initPage () { // jshint ignore: line
    
    initSnake('mapSnake');
    initSnake('statsSnake');
    Message.init();
    Project.init();
}

exports.init = function () {
    Perform.log('1-init:get-initial-data');
    Data.init();
    initPage();
}
