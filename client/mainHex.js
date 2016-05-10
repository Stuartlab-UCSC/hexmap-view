// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

DEV = (URL_PORT !== '443' && URL_PORT !== '8443'); // true if on development server, false if not
ctx = null; // State
layers = {}; // contains almost all information about attributes
googlemap; // our main googlemap instance

(function (hex) { // jshint ignore:line
    //'use strict';
 
    Template.localStoreT.created = function () {
        // This template is only used to initialize state
        if (_.isNull(ctx)) ctx = initState();
    }

    Template.body.helpers({
        page: function () {
            return Session.get('page');
        },
    });

    queryFreeReload = function () {

        // Strip everything after the query string question mark in the href & reload
        var href = window.location.href
            quest = href.indexOf('?');
        if (quest > -1) {
            href = href.slice(0, href.indexOf('?'));
            window.location.assign(href);
        } else {
            window.location.reload();
        }
    }

    pageReload = function (page) {
        Session.set('page', page);
 
        // Hide parts of the nav bar so it doesn't flash
        $('#menus, .selectMenuLabel, #selectMenu').hide();
        queryFreeReload();
    }

    Template.body.events({

        // Reload so global variables get reset and release memory
        // TODO we should not require a reload, however we don't yet have a
        // method to clear the appropriate state and reload does this for us
        "click .homePage": function () {
            Session.set('page', 'homePage');
        },
        "click .mapPage": function() {
            pageReload('mapPage');
        },

        "click .thumbnail": function (ev){
            var project = 'data/' + $(ev.currentTarget).data('project') + '/';
            ctx.save(project);
            queryFreeReload();
        },
        "click .gridPage": function() {
            pageReload('gridPage');
        },
    });

    Template.homePage.onRendered(function () {
        initTools();
    });

    Template.mapPage.onRendered(function () {
        Tracker.autorun(function () {
            if (GoogleMaps.loaded()) {
                initMainMapContainer();
            }
        });
        initProject();
        GoogleMaps.load();
        initTools();
    });

    Template.gridPage.onRendered(function () {
        Tracker.autorun(function () {
            if (GoogleMaps.loaded()) {
                initGridMapContainer();
            }
        });
        GoogleMaps.load();
        initTools();
    });

    Template.navBarT.helpers({
        loadingMap: function () {
            if (Session.get('loadingMap')) {
                return 'block';
            } else {
                return 'none';
            }
        },
    });

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
    });

    function resizeMap () {

        // Set the initial map size and capture any resize window event so
        // the map gets resized too.
        var windowHt = $(window).height(),
            navHt = $('#toolbar').height(),
            headerHt = $('#header').height();
        $('#mapContent').height(windowHt - navHt - headerHt - 1);
        $('#gridContent').height(windowHt - navHt);
    }

    // Define the autotracker to find when the basic UI is drawn
    Session.set('initializedHexagons', false);
    Session.set('initialiedLayers', false);
    Session.set('initializedColormaps', false);
    var checkUiDrawn = Tracker.autorun(isUiDrawn);
    function isUiDrawn () {
        if (Session.get('initializedHexagons') &&
            Session.get('retrievedLayerInfo') &&
            Session.get('initializedColormaps')) {
            checkUiDrawn.stop();
 
            re_initialize_view();
 
            // Turn off the loading progress wheel
            setTimeout(function () {
                Session.set('loadingMap', false)
            }, 500);

            // Initialize the background functions.
            //initOverlayNodes();
            initShortlist();
            initLegend();
            initCoords();
            initLabelTool();
            initDownload();
            initColors();
            initInfoWindow();
            initSetOperations();
            //initDiffAnalysis();
        }
    }
 
    // Define the autotracker to find when the layers are initialized
    Session.set('initiatedLayertypes', false);
    Session.set('initiatedLayerIndex', false);
    Session.set('initializedLayersArray', false);
    var checkInitLayers = Tracker.autorun(areLayersInitialized);
    function areLayersInitialized () {
        if (Session.get('initiatedLayertypes') &&
            Session.get('initiatedLayerIndex') &&
            Session.get('initializedLayersArray')) {
            checkInitLayers.stop();
 
            initSortAttrs();
            initFilter()
            initLayerLists();
 
            Session.set('retrievedLayerInfo', true);
        }
    }

    // Define the autotracker to find when the layout is initialized
    Session.set('initializedLayout', false);
    var checkInitLayout = Tracker.autorun(isLayoutInitialized);
    function isLayoutInitialized () {
        if (Session.get('initializedLayout')) {
            checkInitLayout.stop();
 
            initHexagons();
        }
    }
 
    // Define the autotracker to find when the map prep is complete
    Session.set('initializedProject', false);
    Session.set('initializedMapContainer', false);
    Session.get('initializedMapType', false);
    var checkReadyForMap = Tracker.autorun(areWeReadyForMap);
    function areWeReadyForMap () {
        if (Session.get('initializedProject') &&
            Session.get('initializedMapContainer') &&
            Session.get('initializedMapType')) {
            checkReadyForMap.stop();
 
            initMapType();
            initView();
            initLayout();
            initHex();
        }
    }

    function initMainMapContainer () {
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);
            ctx.center = centerToLatLng(ctx.center);
            Session.set('initializedMapContainer', true);
        }, 0);
    };

    function initGridMapContainer () {
        setTimeout(function () { // The timeout allows the google libs to load
            $(window).resize(resizeMap);
            ctx.gridCenter = centerToLatLng(ctx.gridCenter);
            initGrid();
            
            // Resize the map to fill the available space
            Meteor.setTimeout(resizeMap, 0);
        }, 0)
    };
})(app);
