// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

DEV = true; // true if in development mode, false if not

ctx = null; // Persistent state to be saved eventually
layers = {}; // contains almost all information about attributes

(function (hex) { // jshint ignore:line
    //'use strict';

    // Define the sources for images
    var navBarSrcs = [
            {pre: 'question-sign', suf: '.svg'},
        ],
        homePageSrcs = [
            {pre: 'ucscgi_clear', suf: '.png'},
            {pre: 'pancan12-mRNA-Seq', suf: '.png'},
            {pre: 'cyber-slug', suf: '.svg'},
        ],
        mapPageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
            {pre: 'question-sign', suf: '.svg'},
            {pre: 'throbber', suf: '.svg'},
            {pre: 'statistics', suf: '.svg'},
            {pre: 'set', suf: '.svg'},
            {pre: 'sort_attributes', suf: '.svg'},
        ],
        gridPageSrcs = [
        ],
        googlemapsInitialized = false;

    // Prefix for image URLs may be different on different servers.
    // There must be a better way to do this
    function fixProxies (templateName) {
        var url = Meteor.absoluteUrl(),
            srcs = eval(templateName + 'Srcs');
        _.each(srcs, function (src) {
            $('img.' + src.pre).prop('src', url + src.pre + src.suf);
        });
    }

    function convertStoredCenterToLatLng() {
        if (_.isNull(ctx.center)) {
            ctx.center = [0, 0];
        }
        ctx.center = new google.maps.LatLng(ctx.center[0], ctx.center[1]);
    }

    Template.body.helpers({
        page: function () {
            if (_.isNull(ctx)) ctx = initState();
            return Session.get('page');
        },
        proxPre: function () {
            if (_.isNull(ctx)) ctx = initState();
            return Session.get("proxPre");
        }
    });

    Template.body.events({
        "click .homePage": function () {
            Session.set("page", "homePage");
            location.reload();
        },
        "click .mapPage": function() {
            Session.set("page", "mapPage");
            location.reload();
        },
        "click .defaultMapPage": function() {
            ctx.project = 'data/public/pancan12/';
            Session.set("page", "mapPage");
            location.reload();
        },
        "click .gridPage": function() {
            Session.set("page", "gridPage");
            location.reload();
        },
    });

    Template.homePage.onRendered(function () {
        fixProxies('homePage');
    });

    Template.mapPage.onRendered(function () {

        // TODO this may be removed when we are not
        // drawing mapPage along with the gridPage
        if (!Session.equals('page', 'mapPage')) return;

        // We want to show/hide these early on
        $('#coords').hide();
        if (DEV) $('.sort_attributes, .statistics').show()

        fixProxies ('navBar');
        fixProxies ('mapPage');
        initMrtGooglemapsForMap();
    });

    Template.gridPage.onRendered(function () {
        $('#coords').hide();  // We want to catch this early on
        fixProxies ('gridPage');
        initMrtGooglemapsForGrid();
    });

    initMapDrawn = function () {
        // Initialize modules that need to have the map drawn.
        initSvg();
        if (DEV) initGrid();
        initCoords();
    }

    initGridDrawn = function () {
        // Initialize modules that need to have the grid drawn.
        initCoords();
    }

    function initHomeLink() {
        // Set up the link to the home page
        if (!DEV) return;
        add_tool("to-home", "Home", function() {
            $('.homePage').click();
            tool_active = false;
        });
    }

    initMrtGooglemapsForMap = function () {
        setTimeout(function () {
            GoogleMaps.init({}, function () {
            
                // Initialize everything else
                initHomeLink();
                initProject();
                initTools();
                initColors();
                convertStoredCenterToLatLng();
                initHex();
                $.get("maplabel.js");
            });
        }, 0)
    };

    initMrtGooglemapsForGrid = function () {
        setTimeout(function () {
            GoogleMaps.init({}, function () {
                initHomeLink();
                convertStoredCenterToLatLng();
                initHex();
                initGrid();
            });
        }, 0)
    };
})(app);
