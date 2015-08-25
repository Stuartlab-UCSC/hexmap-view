// mainHex.js

/* global stateCreate, GoogleMaps, initHex, print */

var app = app || {}; // jshint ignore:line

ctx = {}; // Persistent state to be saved eventually
oper = {}; // Shared state not to be saved to persist store

// This holds a list of layer objects by name.
// Layer objects have:
// A downloading function "downloader"
// A data object (from hex name to float) "data"
// A magnitude "magnitude"
// A boolean "selection" that specifies whether this is a user selection or not.
// (This may be absent, which is the same as false.)
// Various optional metadata fields
layers = {};


(function (hex) { // jshint ignore:line
    //'use strict';

    function initialize () {
        initTools();
        initSvg();
        initColors();
        initHex();
    }

    function init_operating_values() {

        // Lists of layer types
        oper.cont_layers = [];
        oper.bin_layers = [];
        oper.cat_layers =[];

        // Stores the text that informs user what sorting mechanism has been employed
        oper.current_sort_text = "Attributes Ranked by Frequency";

        // Stores the layer names according to their ascribed indices in "layers.tab"
        oper.layer_names_by_index = [];
        
        // Whether the data is ranked by Mutual Information. If the layout
        // changes, the stats must be updated.
        oper.mutual_information_ranked = false;
    }

    window.onload = function () {

        ctx = stateCreate();
        ctx.project = '.data/public/pancan12stats/'; // the default project

        // Download Information on project directories
        $.get("./getProjDirs", function (json_data) {
            // The data is of the form:
            // {
            //    public: [proj1, proj2 ...],
            //    dir2: [proj3, proj4 ...],
            //    dir2: [proj5, proj6 ...],
            // }

            var data;

            // Transform to the structure needed for the dropdown
            data = _.map(json_data, function (userProjs, user) {
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
                })
                // Handle result selection
                .on("select2-selecting", function (event) {

                    ctx.project = event.val;

                    // Save the project directory to the session storage
                    ctx.save();

                    // Reload the app
                    location.reload();
            });
            ctx.load();
            $('#loadDir').select2("val", ctx.project); //set the value in the select

            init_operating_values();
            initialize();
        });
    }
})(app);
