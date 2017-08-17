// mainHex.js

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

var app = app || {};
(function (hex) { // jshint ignore: line
Hex = (function () { // jshint ignore: line
 
    var VERSION = 'Version 1.0';
 
    window.addEventListener("load", function(event) {
        Session.set('domLoaded', true);
    });

    Template.localStoreT.created = function () {
        // This template is only used to initialize state
        if (_.isNull(ctx)) { ctx = initState(); }
    };

    Template.body.helpers({
        page: function () {
            return Session.get('page');
        },
    });

    function queryFreeReload () {
        Session.set('mapSnake', true);
        if (window.location.search.length > 0) {
            window.location.search = '';
        } else {
            window.location.reload();
        }
    }

    function pageReload (page) {
        queryFreeReload();
    }

    function loadProject (project) {
        ctx.project = project;
        Session.set('page', 'mapPage');
        queryFreeReload();
    }
 
    Template.homePage.onRendered(function () {
        Tool.init();
        Message.init();
        Download.init();
        CreateMap.init();
    });

    Template.mapPage.onRendered(function () {
        Meteor.autorun(function () {
            if (GoogleMaps.loaded()) {
                initMainMapContainer();
            }
        });
        import InitMapPage from '/imports/initMapPage.js';
        Message.init();
        InitMapPage.init();
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
        Tool.init();
    });

    Template.gridPage.onRendered(function () {
        Meteor.autorun(function () {
            if (GoogleMaps.loaded()) {
                initGridMapContainer();
            }
        });
        Message.init();
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
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
                { id: 'pCHIPS', png: 'pCHIPS.png' },
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

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
        nodeCount: function () {
            return Session.get('nodeCount');
        },
    });

    function resizeMap () {

        // Set the initial map size and capture any resize window event so
        // the map gets resized too.
        var windowHt = $(window).height(),
            navHt = $('#navBar').height(),
            headerHt = $('#header').height();
        $('#mapContent').height(windowHt - navHt - headerHt - 1);
        $('#gridContent').height(windowHt - navHt);
        $('#visualization').show();
    }

    function googleAnalytics() {
        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
        ga('create', 'UA-76132249-2', 'auto');
        ga('send', 'pageview');
        //<script async src='https://www.google-analytics.com/analytics.js'></script>
    }

    // Phase 5 init: Autotracker to find when the basic UI is drawn
    Session.set('initedHexagons', false);
    Session.set('initialiedLayers', false);
    Session.set('initedColormaps', false);
    function isUiDrawn (autorun) {
        if (Session.get('initedHexagons') &&
            Session.get('retrievedLayerInfo') &&
            Session.get('initedColormaps')) {
            autorun.stop();
            Meteor.setTimeout(function () {
 
                initMap();
                
                import NavBar from '/imports/navBar.js';
                NavBar.init();
     
                // Turn off the loading progress wheel
                setTimeout(function () {
                    Session.set('mapSnake', false);
                }, 300);

                // Initialize the background functions.
                initOverlayNodes();
                initOverlayNodeUi();
                initLegend();
                Shortlist.init();
                initCoords();
                CheckLayerBox.init();
                Reflect.init();
                Tool.initLabelTool();
                Download.init();
                Colors.init();
                initInfoWindow();
                initSetOperations();
                CreateMap.init();
                Select.init();
                initGchart();
                initBookmark();
                Jobs.init();
                if (!DEV) { googleAnalytics(); }
                //initDiffAnalysis();
            }, 0);
        }
    }
    Meteor.autorun(isUiDrawn);
 
    // Phase 4 init: Autotracker to find when the layers are initialized
    Session.set('initedLayerTypes', false);
    Session.set('initedStaticLayersArray', false);
    function areLayersInitialized (autorun) {
        if (Session.get('initedLayerTypes') &&
            Session.get('initedStaticLayersArray')) {
            autorun.stop();
 
            initSortAttrs();
            initFilter();
            initLayerLists();
            Session.set('retrievedLayerInfo', true);
        }
    }
    Meteor.autorun(areLayersInitialized);

 
    // Phase 3 init: Autotracker to find when the layout is initialized
    Session.set('initedLayout', false);
    function isLayoutInitialized (autorun) {
        if (Session.get('initedLayout')) {
            autorun.stop();
 
            initHexagons();
        }
    }
    Meteor.autorun(isLayoutInitialized);
 
    // Phase 2 init: Autotracker to find when the map prep is complete
    Session.set('initedProject', false);
    Session.set('initedMapContainer', false);
    Session.get('initedMapType', false);
    function areWeReadyForMap (autorun) {
        if (Session.get('initedProject') &&
            Session.get('initedMapContainer') &&
            Session.get('initedMapType')) {
            autorun.stop();
 
            initMapType();
            initLayout();
            Layer.initDataTypes();
            Layer.initIndex();
            initColormaps();
        }
    }
    Meteor.autorun(areWeReadyForMap);

    // Phase 1 init: when meteor has been rendered
    // For a graphical view see:
    // https://docs.google.com/presentation/d/1BrHDwcyGkmxD2MeimZ9bU3OPN3KJ85-wPpZxFy0yhmg/edit#slide=id.g12d3244251_0_30
    function initMainMapContainer () { // jshint ignore: line
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);
            $('#shortlist_holder').css('top', $('#navBar').height());
            ctx.center = centerToLatLng(ctx.center);
            Session.set('initedMapContainer', true);
        }, 0);
    }

    function initGridMapContainer () { // jshint ignore: line
        setTimeout(function () { // The timeout allows the google libs to load
            $(window).resize(resizeMap);
            ctx.gridCenter = centerToLatLng(ctx.gridCenter);
            initGrid();
            
            // Resize the map to fill the available space
            Meteor.setTimeout(resizeMap, 0);
        }, 0);
    }

return { // Public methods

    resizeMap: resizeMap,
    loadProject: loadProject,
    pageReload: pageReload,
 
    bookmarkReload: function (bookmark) {
        if (bookmark.slice(0,9) === 'localhost') {
            bookmark = 'http://' + bookmark;
        }
        window.location.assign(bookmark);
    },
};
}());
})(app);

