// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = {}; // Persistent state to be saved eventually
oper = {}; // Shared state not to be saved to persist store
layers = {}; // contains almost all information about attributes

(function (hex) { // jshint ignore:line
    //'use strict';

    var homePageSrcs = [
            {pre: 'ucscgi_clear', suf: '.png'},
            {pre: 'pancan12-mRNA-Seq', suf: '.png'},
            {pre: 'cyber-slug', suf: '.svg'},
        ],
        mapPageSrcs = [
            {pre: 'cyber-slug', suf: '.svg'},
            {pre: 'throbber', suf: '.svg'},
            {pre: 'statistics', suf: '.svg'},
            {pre: 'set', suf: '.svg'},
            {pre: 'sort_attributes', suf: '.svg'},
        ],
        sortAttrsSrcs = [
            {pre: 'help', suf: '.svg'},
        ];

    // Get the host url, for fixing up proxied servers
    var url = Meteor.absoluteUrl();

    function fixProxies (templateName) {
        // There must be a better way to do this
        var srcs = eval(templateName + 'Srcs');
        _.each(srcs, function (src) {
            $('img.' + src.pre).prop('src', url + src.pre + src.suf);
        });
    }

    // Fix the prefix for images & such called from javascript
    if (location.host === 'localhost:3000') {
        Session.setDefault("proxPre", "");
    } else {
        Session.setDefault("proxPre", "hexmap/");
    }

    // Default to the home page if its not already set
    Session.setDefault("page", "homePage");

    Template.body.helpers({
        page: function () {
            return Session.get("page")
        },
        proxPre: function () {
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
        fixProxies ('homePage');
    });

    Template.mapPage.onRendered(function () {
        fixProxies ('mapPage');
        initMrtGooglemaps();
    });

    initialize_pers = function () {
        Session.set("persBackground", "black");
    };
    initMrtGooglemaps = function () {
        // Initialize the meteor module, mrt:googlemaps
        initialize_pers();
        ctx = stateCreate();

        //ctx.project = 'hexmap/projects/'; // su2c-dev proxy
        //ctx.project = 'projects/'; localhost
        ctx.project = Session.get('proxPre') + 'projects/';

        //console.log('Unable to parse the project directory info from the server, so using public/pancan12');

        setTimeout(function () {
        GoogleMaps.init({}, function () {
        
            // Initialize everything else
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
