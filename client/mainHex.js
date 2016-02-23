// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

DEV = true; // true if in development mode, false if not
ATTR_FILTERS = true;
ctx = null; // State
layers = {}; // contains almost all information about attributes
mapDrawnListener = '';

(function (hex) { // jshint ignore:line
    //'use strict';

    var googlemapsInitialized = false;

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
            ctx.project = Session.get('proxPre') + 'data/pancan12/latest/';
            pageReload('mapPage');
        },

        "click .thumbnail": function (ev){
            var project = $(ev.currentTarget).data('project');
            ctx.project = Session.get('proxPre') + 'data/' + project + '/';
            pageReload('mapPage');
        },
        "click .gridPage": function() {
            pageReload('gridPage');
        },
    });

    Template.mapPage.onRendered(function () {

        // TODO this may be removed when we are not
        // drawing mapPage along with the gridPage
        if (!Session.equals('page', 'mapPage')) return;

        // We want to show these early on
        if (DEV) $('.sort_attributes, .statistics').show()

        initMrtGooglemapsForMap();
    });

    Template.gridPage.onRendered(function () {
        initMrtGooglemapsForGrid();
    });

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
        loadingMap: function () {
            return Session.get('loadingMap');
        },
    });

    initMapDrawn = function () {
        // Initialize modules that need to have the map drawn.
        google.maps.event.removeListener(mapDrawnListener);
        if (Session.equals('page', 'mapPage')) initSvg();
        if (DEV) initGrid();
        initCoords();
        //initOverlayNodes();
        setTimeout(function () { Session.set('loadingMap', 'none')}, 0);
    }

    initGridDrawn = function () {
        // Initialize modules that need to have the grid drawn.
        initCoords();
    }

    function initHomeLink() {
        // Set up the link to the home page
        add_tool("home", function() {
            $('.homePage').click();
            tool_activity(false);
        });
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

    initMrtGooglemapsForMap = function () {
        setTimeout(function () {
            resizeMap();
            $(window).resize(resizeMap);
            GoogleMaps.init({}, function () {

                // Initialize everything else
                initHomeLink();
                initProject();
                initSelect();
                initTools();
                initDownload();
                initColors();
                convertStoredCenterToLatLng();
                initLegend();
                initShortlist();
                initHex();
                $.get("maplabel.js");
            });
        }, 0)
    };

    initMrtGooglemapsForGrid = function () {
        setTimeout(function () {
            resizeMap();
            $(window).resize(resizeMap);
            GoogleMaps.init({}, function () {
                initHomeLink();
                initTools();
                convertStoredCenterToLatLng();
                initHex();
                initGrid();
            });
        }, 0)
    };
})(app);
