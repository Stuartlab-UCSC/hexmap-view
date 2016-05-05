// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

DEV = true; // true if in development mode, false if not
ATTR_FILTERS = true;
ctx = null; // State
layers = {}; // contains almost all information about attributes
mapDrawnListener = '';
googlemap; // our googlemap instance

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
            if (GoogleMaps.loaded() && Session.equals('page', 'mapPage'))
                initGoogleMapsForMap();
        });
        GoogleMaps.load();
    });

    Template.gridPage.onRendered(function () {
        Tracker.autorun(function () {
            if (GoogleMaps.loaded() && Session.equals('page', 'gridPage'))
                initGoogleMapsForGrid();
        });
        GoogleMaps.load();
    });

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
        loadingMap: function () {
            if (Session.get('loadingMap')) {
                return 'block';
            } else {
                return 'none';
            }
        },
    });

    initMapDrawn = function () {
        // Initialize modules that need to have the main map drawn.
        google.maps.event.removeListener(mapDrawnListener);
            initPdf();
            initSvg();
            initCoords();
            initOverlayNodes();
    }

    function resizeMap () {

        // Capture a resize window event to resize the map.
        // We need to do this before the google map or it will not be centered.
        var windowHt = $(window).height(),
            navHt = $('#toolbar').height(),
            headerHt = $('#header').height();
        $('#mapContent').height(windowHt - navHt - headerHt - 2);
        $('#gridContent').height(windowHt - navHt - 2);
    }

    initGoogleMapsForMap = function () {
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);

            // Initialize everything else
            initProject(initHex);
            initTools();
            initDownload();
            initColors();
            initLegend();
            initShortlist();
            setTimeout(function () {
                Session.set('loadingMap', false)
            }, 500);
        }, 0)
    };

    initGoogleMapsForGrid = function () {
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);
            initTools();
            initDownload();
            initGrid();
        }, 0)
    };
})(app);
