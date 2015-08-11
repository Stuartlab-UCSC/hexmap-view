// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = {}; // Persistent state to be saved eventually
oper = {}; // Shared state not to be saved to persist store

(function (hex) { // jshint ignore:line
    //'use strict';

    initialize_pers = function () {
        Session.set("persBackground", "black");
    };

    // Initialize the meteor module, mrt:googlemaps
    window.onload = function () {
        initialize_pers();
        ctx = stateCreate();
        ctx.project = 'projects/';

        print('Unable to parse the project directory info from the server, so using public/pancan12');
        json_data = '{"public": ["pancan12"]}';

        GoogleMaps.init({}, function () {
            initHex();
             $.get("maplabel-compiled.js");
        });
    };
})(app);
