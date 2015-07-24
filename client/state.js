// state.js
// An object to write and load state

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    State = function() {

        var s = this;
        s.background = 'black'; // Visualization background color
        s.zoom = 1; // Map zoom level where 1 is most zoomed out
        //s.center = new google.maps.LatLng(0,0); // Center of map as a LatLng
        s.layout_names = []; // Map layout names maintained in order of entry
        s.current_layout_name = ''; // Current Layout Displayed
        s.project = 'data/public/pancan12/';
        s.rpc = null; // remote procedure call object
    }
/*
    State.prototype._supports_html5_storage = function () {
        // Check to see if browser supports HTML5 Storage
        // Any modern browser should pass.
        try {
            return "localStorage" in window && window["localStorage"] !== null;
        } catch (e) {
            return false;
        }
    };

    State.prototype.save = function () {
        var s = this,
            stateJson = JSON.stringify(s);

        // Save state by logging it in local browser storage
        if (!s._supports_html5_storage()) {
            complain("Browser does not support local storage.");
            return;
        }
        // Currently, we only support one saved state.
        // The previous state will be overridden.
        localStorage.removeItem("state");
        localStorage.setItem("state", stateJson);
    };

    State.prototype.load = function () {
        var s = this,
            stateParsed,
            stateJson = localStorage.getItem("state");

        if (!s._supports_html5_storage()) {
            complain("Browser does not support local storage.");
            return;
        }
        if (stateJson === null) {
            print("No saved state found, so using defaults.");
            return;
        }
        // Note that all values are parsed strings.
        // For now, we are only loading the 'project' from saved state
        s.project = JSON.parse(stateJson).project;
    };
*/
    stateCreate = function () { // jshint ignore:line
        return new State();
    };
/*
        var state = new Mongo.Collection('clientState');
        //var state = new Mongo.Collection(null);
        state.insert({
            background: 'black', // Visualization background color
            zoom: 1, // Map zoom level where 1 is most zoomed out
            layout_names: [], // Map layout names maintained in order of entry
            current_layout_name: '', // Current Layout Displayed
            project: 'data/public/pancan12/',
            rpc: null, // remote procedure call object
        });
        var record = state.find().fetch()[0];
        if(record._id){
            var bundle = {
                id: state.findOne()._id,
                collection: state,
                oldState: new State(),
            };
            return bundle;

        }
    };
*/
})(app);

