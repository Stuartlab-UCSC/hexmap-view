// state.js
// An object to write and load state

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    State = function() {

        // The state stores the values used across modules for different
        // purposes. These may belong to this object or to the reactive meteor
        // Session. Eventually maybe all of this object's vars will be migrated
        // to meteor Session vars.
        //
        //      - localStorage: persist for the duration of the browser tab
        //          session, that is, they remain as long as the browser tab
        //          is used and not closed. These are written to the browser's
        //          localStorage
        //
        //          - project localStorage: a subset that are cleared when the
        //              project changes because they may not apply to the new
        //              project
        //
        //      - other: persist for this page load only, and are not saved to
        //          localStorage. Some of these belong to this object and some to
        //          the reactive meteor Session. Not all of these vars are
        //          initialized here, but in their respective file
        //          initialization functions

        var s = this;

        // Variables persisting for the browser tab session
        s.localStorage = {
            all: [
                'background',
                'current_layout_name',
                'page',
                'project',
                'zoom', // TODO should save center of the map as well
            ],

            // These are cleared  when the project changes
            project: [
                'current_layout_name',
                'zoom',
            ],
        }
        s.nolocalStorage = false;
        s.alreadySaved = false;

        // Variables maintained in the reactive meteor Session, with defaults
        Session.setDefault('background', 'black');  // Visualization background color
        Session.setDefault('page', 'homePage');  // Show homePage or mapPage
        Session.setDefault('proxPre', (location.host === 'localhost:3000')
            ? '' : 'hexmap/');  // Prefix for images and other such files

        // Variables maintained in this state object, with defaults.
        s.layout_names = [];  // Map layout names maintained in order of entry
        s.project = 'data/public/pancan12/';  // The project data loaded
        s.zoom = 1;  // Map zoom level where 1 is one level above most zoomed out
    }

    State.prototype.save = function (newProject) {
        // Save state by writing it to local browser store.
        // Both parameters are optional.
        var s = this,
            store = {},
            index,
            isNewProject = !_.isUndefined(newProject);

        if (s.noLocalstore) {
            return;
        }
        if (s.alreadySaved) {
            return;
        }
        s.alreadySaved = true;

        // Save the new parameters passed into here
        if (isNewProject) {
            ctx.project = newProject;
            Session.set('page', 'mapPage');
        }

        // Find all of the vars to be saved by walking though our localStorage list
        _.each(s.localStorage.all, function (hold) {

            // If this is a Session var we want to store it
            if (!Session.equals(hold, undefined)) {
                store[hold] = Session.get(hold);

            // If this var belongs to this object we want to store it
            } else if (!_.isUndefined(s[hold]) && !_.isNull(s[hold])) {
                store[hold] = s[hold];

            // this var has no value to store
            } else {
                return;
            }
            // Don't store project vars if the project has changed
            if (isNewProject && s.localStorage.project.indexOf(hold) > -1) {
                delete store[hold];
            }
        });

        // The previous state will be overwritten in localStorage
        window['localStorage'].removeItem("hexMapState");
        window['localStorage'].setItem("hexMapState", JSON.stringify(store));
    };

    State.prototype.load = function () {
        // Load state from local store

        var s = this,
            store;

        // Check to see if browser supports HTML5 Store
        // Any modern browser should pass.
        // TODO if a browser does not support this, there is no way for a user
        // to change projects. Project could be passed in the URL
        try {
            "localStorage" in window && window["localStorage"] !== null;
        } catch (e) {
            complain("Browser does not support local store.");
            s.noLocalstore = true;
            return;
        }
        store = JSON.parse(window['localStorage'].getItem("hexMapState"));

        if (store === null) {
            print("No saved state found, so using defaults.");
            return;
        }

        // Walk through the localStorage loading anything we recognize
        _.each(store, function (val, key) {

            // Skip those we don't know
            if (s.localStorage.all.indexOf(key) < 0) {
                return;
            }
            // Load this object's vars
            if (!_.isUndefined(s[key]) && !_.isNull(s[key])) {
                s[key] = val;

            // Otherwise assume this is a Session var
            } else {
                Session.set(key, val);
            }
        });
    };

    initState = function () { // jshint ignore:line
        s = new State();
        s.load();
        window.onbeforeunload = function() {
            s.save();
        }
        return s;
    };
})(app);

