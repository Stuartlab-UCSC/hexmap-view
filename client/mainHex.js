// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = {}; // Persistent state to be saved eventually
oper = {}; // Shared state not to be saved to persist store

(function (hex) { // jshint ignore:line
    //'use strict';

    function initialize () {
        initTools();
        initSvg();
        initColors();
        initHex();
        //initDataUpload();
    }

    window.onload = function () {

        // Download Information on project directories
        //$.get("./getProjDirs", function (json_data) {
            // The data is of the form:
            // {
            //    public: [proj1, proj2 ...],
            //    dir2: [proj3, proj4 ...],
            //    dir2: [proj5, proj6 ...],
            // }

            //var parsed,
                //data,

            ctx = stateCreate();
            ctx.project = 'projects/';

            //try {
            //    parsed = JSON.parse(json_data);
            //}
            //catch(err) {
                print('Unable to parse the project directory info from the server, so using public/pancan12');
                json_data = '{"public": ["pancan12"]}';
            //};

/*
            // Transform to the structure needed for the dropdown
            data = _.map(JSON.parse(json_data), function (userProjs, user) {
                return {
                    text: user,
                    children: _.map(userProjs, function (proj) {
                        id = '.data/' + user + '/' + proj + '/';
                        return { id: id, text: proj };
                    })
                }
            });

            $('#loadDir').select2({
                    data: data,
                    placeholder: "Load Project",
                    // We want our dropdown to be big enough to browse.
                    dropdownCssClass: "results-dropdown",
                })
                // Handle result selection
                .on("select2-selecting", function (event) {

                    // The select2 id of the thing clicked is event.val
                    ctx.project = event.val;

                    // Save the dir to the session storage
                    ctx.save();

                    // Reload the app
                    location.reload();
            });
            $('#loadDir').select2("val", ctx.project); //set the value in the select
*/
            initialize();
        //});
    };
/*
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

        console.log('Unable to parse the project directory info from the server, so using public/pancan12');
        json_data = '{"public": ["pancan12"]}';

        GoogleMaps.init({}, function () {
            // Initialize everything else
            initTools();
            initColors();
            initSvg();
            initHex();
            initDataUpload();
            $.get("maplabel-compiled.js");
        });
    };
*/
})(app);
