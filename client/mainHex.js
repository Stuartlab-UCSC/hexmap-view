// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ATTR_FILTERS = true;
ctx = null; // State
layers = {}; // contains almost all information about attributes

(function (hex) { // jshint ignore:line
    //'use strict';

    // Define the sources for images
    var navBarSrcs = [
            {pre: 'question-sign', suf: '.svg'},
        ],
        homePageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
            {pre: 'gliomas-paper', suf: '.png'},
            {pre: 'pancan12', suf: '.png'},
            {pre: 'stemness', suf: '.png'},
            {pre: 'question-sign', suf: '.svg'},
            {pre: 'ucscgi_clear', suf: '.png'},
        ],
        mapPageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
            //{pre: 'file-new', suf: '.svg'},
            {pre: 'filter', suf: '.svg'},
            {pre: 'filterCaution', suf: '.svg'},
            {pre: 'question-sign', suf: '.svg'},
            {pre: 'set', suf: '.svg'},
            {pre: 'sort_attributes', suf: '.svg'},
            {pre: 'throbber', suf: '.svg'},
            {pre: 'yin-yang', suf: '.svg'},
        ],
        gridPageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
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

    Template.homePage.onRendered(function () {
        fixProxies('homePage');
    });

    Template.mapPage.onRendered(function () {

        // TODO this may be removed when we are not
        // drawing mapPage along with the gridPage
        if (!Session.equals('page', 'mapPage')) return;

        // We want to show these early on
        if (DEV) $('.sort_attributes, .statistics').show()

        fixProxies ('navBar');
        fixProxies ('mapPage');
        initMrtGooglemapsForMap();
    });

    Template.gridPage.onRendered(function () {
        fixProxies ('gridPage');
        initMrtGooglemapsForGrid();
    });

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
    });

    initMapDrawn = function () {
        // Initialize modules that need to have the map drawn.
        if (Session.equals('page', 'mapPage')) initSvg();
        if (DEV) initGrid();
        initCoords();
    }

    initGridDrawn = function () {
        // Initialize modules that need to have the grid drawn.
        initCoords();
    }

    function initHomeLink() {
        // Set up the link to the home page
        add_tool("to-home", "Home", function() {
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
                if (DEV) initSelect();
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
                convertStoredCenterToLatLng();
                initHex();
                initGrid();
            });
        }, 0)
    };
})(app);
