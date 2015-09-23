// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = null; // Persistent state to be saved eventually
layers = {}; // contains almost all information about attributes

(function (hex) { // jshint ignore:line
    //'use strict';

    // Define the sources for images
    var homePageSrcs = [
            {pre: 'ucscgi_clear', suf: '.png'},
            {pre: 'pancan12-mRNA-Seq', suf: '.png'},
            {pre: 'cyber-slug', suf: '.svg'},
        ],
        mapPageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
            {pre: 'help-button', suf: '.png'},
            {pre: 'throbber', suf: '.svg'},
            {pre: 'statistics', suf: '.svg'},
            {pre: 'set', suf: '.svg'},
            {pre: 'sort_attributes', suf: '.svg'},
        ],
        sortAttrsSrcs = [
            {pre: 'help', suf: '.svg'},
        ];

    // Prefx image URLs which may be different on different servers.
    // There must be a better way to do this
    function fixProxies (templateName) {
        var url = Meteor.absoluteUrl(),
            srcs = eval(templateName + 'Srcs');
        _.each(srcs, function (src) {
            $('img.' + src.pre).prop('src', url + src.pre + src.suf);
        });
    }

    Template.body.helpers({
        page: function () {
            if (!ctx) ctx = initState();
            return Session.get("page");
        },
        proxPre: function () {
        if (!ctx) ctx = initState();
            return Session.get("proxPre");
        }
    });

    Template.body.events({
        "click .homePage": function () {
            Session.set("page", "homePage");
        },
        "click .mapPage": function() {
            Session.set("page", "mapPage");
        }
    });

    Template.homePage.onRendered(function () {
        if (!ctx) ctx = initState();
        fixProxies('homePage');
    });

    Template.mapPage.onRendered(function () {
        if (!ctx) ctx = initState();
        fixProxies ('mapPage');
        initMrtGooglemaps();
    });

    initMrtGooglemaps = function () {
        setTimeout(function () {
            GoogleMaps.init({}, function () {
            
                // Initialize everything else
                initProject();
                initTools();
                initColors();
                initSvg();
                initHex();
                $.get("maplabel.js");
                //$.get("maplabel-compiled.js");
            });
        }, 0)
    };
})(app);
