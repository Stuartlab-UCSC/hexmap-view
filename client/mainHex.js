// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = {}; // Persistent state to be saved eventually
oper = {}; // Shared state not to be saved to persist store
layers = {};

(function (hex) { // jshint ignore:line
    //'use strict';

    Session.setDefault("page", "homePage")

    Template.body.helpers({
        page: function () {
            return Session.get("page")
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

    Template.mapPage.onRendered(function () {
        initMrtGooglemaps();
    });

    initialize_pers = function () {
        Session.set("persBackground", "black");
    };
    initMrtGooglemaps = function () {
        // Initialize the meteor module, mrt:googlemaps
        initialize_pers();
        ctx = stateCreate();
        ctx.project = 'projects/';

        //console.log('Unable to parse the project directory info from the server, so using public/pancan12');
        //json_data = '{"public": ["pancan12"]}';

        GoogleMaps.init({}, function () {
        
            // Initialize everything else
            initTools();
            initColors();
            initSvg();
            initHex();
            $.get("maplabel-compiled.js");
        });
    };
})(app);
