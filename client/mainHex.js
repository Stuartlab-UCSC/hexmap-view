// mainHex.js

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    var VERSION = 'Version 1.0';
 
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

    bookmarkReload = function (bookmark) {
        if (bookmark.slice(0,9) === 'localhost') {
            bookmark = 'http://' + bookmark;
        }
        window.location.assign(bookmark);
    }

    pageReload = function (page) {
        Session.set('page', page);
 
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
            var project = $(ev.currentTarget).data('project') + '/';
            ctx.save(project);
            queryFreeReload();
        },
        "click .gridPage": function() {
            pageReload('gridPage');
        },
    });

    Template.homePage.onRendered(function () {
        initTools();
        Meteor.setTimeout(initCreateMap, 100);
        //initCreateMap();
    });

    Template.mapPage.onRendered(function () {
        Tracker.autorun(function () {
            if (GoogleMaps.loaded()) {
                initMainMapContainer();
            }
        });
        initProject();
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
        initTools();
    });

    Template.gridPage.onRendered(function () {
        Tracker.autorun(function () {
            if (GoogleMaps.loaded()) {
                initGridMapContainer();
            }
        });
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
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
        version: function () {
            if (DEV) {
                return VERSION + ' DEV';
            } else {
                return VERSION
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
    }

    // Autotracker to find when the basic UI is drawn
    Session.set('initedHexagons', false);
    Session.set('initialiedLayers', false);
    Session.set('initedColormaps', false);
    var checkUiDrawn = Tracker.autorun(isUiDrawn);
    function isUiDrawn () {
        if (Session.get('initedHexagons') &&
            Session.get('retrievedLayerInfo') &&
            Session.get('initedColormaps')) {
            checkUiDrawn.stop();
            Meteor.setTimeout(function () {
 
                initMap();
     
                // Turn off the loading progress wheel
                setTimeout(function () {
                    Session.set('loadingMap', false)
                }, 500);

                // Initialize the background functions.
                initOverlayNodes();
                if (DEV) initOverlayNodeUi();
                initLegend();
                initShortlist();
                initLayerBox();
                initCoords();
                initReflect();
                initLabelTool();
                initDownload();
                initColors();
                initInfoWindow();
                initSetOperations();
                initCreateMap();
                initSelect();
                //initDiffAnalysis();
            }, 0);
        }
    }
 
    // Autotracker to find when the layers are initialized
    Session.set('initedLayerTypes', false);
    Session.set('initedLayersArray', false);
    var checkInitLayers = Tracker.autorun(areLayersInitialized);
    function areLayersInitialized () {
        if (Session.get('initedLayerTypes') &&
            Session.get('initedLayersArray')) {
            checkInitLayers.stop();
 
            initSortAttrs();
            initFilter();
            initLayerLists();



            Session.set('retrievedLayerInfo', true);
        }
    }

    // Autotracker to find when the layer index is initialized
    Session.set('initedLayerIndex', false);
    var checkInitLayerIndex = Tracker.autorun(isLayerIndexInitialized);
    function isLayerIndexInitialized () {
        if (Session.get('initedLayerIndex')) {
            checkInitLayerIndex.stop();
 
            initLayersArray();
        }
    }
 
    // Autotracker to find when the layout is initialized
    Session.set('initedLayout', false);
    var checkInitLayout = Tracker.autorun(isLayoutInitialized);
    function isLayoutInitialized () {
        if (Session.get('initedLayout')) {
            checkInitLayout.stop();
 
            initHexagons();
        }
    }
 
    // Autotracker to find when the map prep is complete
    Session.set('initedProject', false);
    Session.set('initedMapContainer', false);
    Session.get('initedMapType', false);
    var checkReadyForMap = Tracker.autorun(areWeReadyForMap);
    function areWeReadyForMap () {
        if (Session.get('initedProject') &&
            Session.get('initedMapContainer') &&
            Session.get('initedMapType')) {
            checkReadyForMap.stop();
 
            initMapType();
            initLayout();
            initHex();
            initLayerTypes();
            initLayerIndex();
            initColormaps();
        }
    }

    function initMainMapContainer () {
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);
            $('#shortlist-holder').css('top', $('#navBar').height());
            ctx.center = centerToLatLng(ctx.center);
            Session.set('initedMapContainer', true);
        }, 0);
    };

    function initGridMapContainer () {
        setTimeout(function () { // The timeout allows the google libs to load
            $(window).resize(resizeMap);
            ctx.gridCenter = centerToLatLng(ctx.gridCenter);
            initGrid();
            initCreateMap();
            
            // Resize the map to fill the available space
            Meteor.setTimeout(resizeMap, 0);
        }, 0)
    };
})(app);
