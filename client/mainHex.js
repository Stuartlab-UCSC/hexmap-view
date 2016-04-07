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

    function convertStoredCenterToLatLng() {
        if (_.isNull(ctx.center)) {
            ctx.center = [0, 0];
        }
        ctx.center = new google.maps.LatLng(ctx.center[0], ctx.center[1]);
    }

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
            pageReload('homePage');
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

        // TODO this may be removed when we are not
        // drawing mapPage along with the gridPage
        if (!Session.equals('page', 'mapPage')) return;

        // We want to show these early on
        $('.sort_attributes, .statistics').show()

        Tracker.autorun(whenGoogleMapsLoaded);
        GoogleMaps.load();
    });

    Template.gridPage.onRendered(function () {
        Tracker.autorun(whenGoogleMapsLoaded);
        GoogleMaps.load();
    });

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
        loadingMap: function () {
            return Session.get('loadingMap');
        },
    });
 
    function whenGoogleMapsLoaded () {
        if (GoogleMaps.loaded()) {
            if (Session.equals('page', 'mapPage')) {
                initGoogleMapsForMap();
            } else {
                initGoogleMapsForGrid();
            }
        }
    }

    initMapDrawn = function () {
        // Initialize modules that need to have the map drawn.
        google.maps.event.removeListener(mapDrawnListener);
        if (Session.equals('page', 'mapPage')) initSvg();
        initGrid();
        initCoords();
        initOverlayNodes();
        setTimeout(function () {
            Session.set('loadingMap', 'none')
        }, 0);
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
        setTimeout(function () {
            resizeMap();
            $(window).resize(resizeMap);

            // Initialize everything else
            initProject();
            initTools();
            initDownload();
            initColors();
            convertStoredCenterToLatLng();
            initLegend();
            initShortlist();
            initHex();
            $.get("maplabel.js");
        }, 0)
    };

    initGoogleMapsForGrid = function () {
        setTimeout(function () {
            resizeMap();
            $(window).resize(resizeMap);
            initTools();
            convertStoredCenterToLatLng();
            initHex();
            initGrid();
        }, 0)
    };
})(app);
