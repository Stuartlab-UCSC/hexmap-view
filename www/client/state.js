// state.js
// An object to write and load state

var app = app || {};  // jshint ignore: line

(function (hex) {  // jshint ignore: line

    // TODO: these should all be Session vars so they will survive a hot code
    // push!
 
    var DEFAULT_PAGE = 'homePage',
        DEFAULT_PROJECT = 'Gliomas/',
        DEFAULT_SORT = {
            text: 'Density of attributes',
            type: 'default',
            focus_attr: null,
            color: 'inherit',
            background: 'inherit',
        },
        storageSupported,
        bookmarkMessage = new ReactiveVar(),
        bookmarkColor = new ReactiveVar('black'),
        bookmarkDialogHex;
 
    Template.bookmarkT.helpers ({
        message: function () {
            return bookmarkMessage.get();
        },
        color: function () {
            return bookmarkColor.get();
        },
    });
    
    function createBookmark () {
 
        // Create a bookmark of the current view for later retrieval.
        bookmarkMessage.set('Creating bookmark...');
        bookmarkColor.set('black');
        var $bookmarkMessage = $('#bookmarkDialog .message');
 
        Meteor.call('createBookmark', ctx.jsonify(), function (error, result) {
            if (error) {
                bookmarkMessage.set('Sorry, bookmark could not be created due' +
                    ' to error: ' + error);
                bookmarkColor.set('red');
            } else {
                bookmarkMessage.set(result);
                
                // Wait for the message to be applied to the input element
                // before selecting the entire string
                Meteor.setTimeout(function () {
                    $bookmarkMessage[0].setSelectionRange(0, result.length)
                },0);
            }
        });
    };
 
    function centerToArray (centerIn) {
 
        // If needed, translate the latLng center to an array for store.
        var center = centerIn;
        if (!Array.isArray(center)) {

            // This is stored this as an array of two numbers rather
            // than as latLng since when we retrieve it, we won't know
            // about google maps yet so won't understand LatLng.
            center = [center.lat(), center.lng()];
        }
        return center;
    }
 
    State = function() { // jshint ignore: line

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
        //          localStorage. Some of these belong to this object and some
        //          to the reactive meteor Session. Not all of these vars are
        //          initialized here, but in their respective file
        //          initialization functions

        var s = this;

        s.defaultProject = DEFAULT_PROJECT;

        // Keep localStore of different servers separate
        s.storeName = location.host + '-hexMapState';
 
        // Pull out any parameters in the URL
        s.uParm = UrlParms.getParms();

        s.localStorage = {
            // Contains the non-project state we want to save with unique keys
            all: [
                'background',
                'page',
                'pdfLegend',
                'pdfMap',
                'project',
                'viewEdges',
                'reflectRanked',
            ],

            // Contains the project state we want to save with unique keys
            project: [
                'active_layers',
                'center',
                'dynamic_attrs',
                'first_layer',
                'gridCenter',
                'gridZoom',
                'layoutIndex',
                'overlayNodes',
                'shortlist',
                //'shortlist_on_top',
                'zoom',
            ],
 
            // Contains the state we want to save with keys that require a label
            // appended to make the key unique
            key_prefixes: [
                'shortlist_filter_show_',
                'shortlist_filter_value_',
            ]
        };
 
        s.localStorage.unique_keys = s.localStorage.all.concat(
            s.localStorage.project);
    };

    State.prototype.defaultProject = function () {
        return this.defaultProject;
    };

    State.prototype.defaultSort = function () {
        return DEFAULT_SORT;
    };

    State.prototype.setProjectDefaults = function () {
        var s = this;

        // Project variables maintained in this state object, with defaults.
        Session.set('active_layers', []); // Layer names displaying their colors
        s.center = null; // main google map center
        Session.set('dynamic_attrs', undefined); // Dynamic layers dict
        delete Session.keys.dynamic_attrs;
        Session.set('first_layer', undefined); // first in shortlist
        delete Session.keys.first_layer;
        s.gridCenter = null; // grid map center
        s.gridZoom = 3;  // Zoom level of the grid
        Session.set('layouts', undefined); // List of layouts available
        delete Session.keys.layouts;
        Session.set('layoutIndex', undefined); // Index of active layout
        delete Session.keys.layoutIndex;
        Session.set('layoutName', undefined); // name of active layout
        delete Session.keys.layoutName;
        Session.set('reflectRanked', undefined);  // Generate ranked attribute
        delete Session.keys.reflectRanked
        Session.set('overlayNodes', undefined);  // overlay nodes to include
        delete Session.keys.overlayNodes
        Session.set('shortlist', []); // Array of layer names in the shortlist
        Session.set('shortlist_on_top', false); // maintain actives at the top
        s.zoom = 3;  // Map zoom level where 3 means zoomed in by 3 levels
    };

    State.prototype.setAllDefaults = function () {
        var s = this;
        s.setProjectDefaults();

        // Reactive variables maintained in global state & not project-specific
        Session.set('sort', DEFAULT_SORT); // Default sort message & type
        Session.set('background', 'black');  // Main map background color
        Session.set('viewEdges', false); // Display of directed graph
        Session.set('pdfMap', true); // Include map in pdf
        Session.set('pdfLegend', false); // Include legend in pdf
 
        // Non-reactive vars maintained in global state and not project-specific
        s.project = DEFAULT_PROJECT;  // The project data to load
    };

    State.prototype.jsonify = function (newPage) {
 
        // Convert the current state to json.
        var s = this,
            store = {};
 
        // Now we set the newPage
        if (newPage) { Session.set('page', newPage); }
 
        // Walk though our list of unique keys and save those
        _.each(s.localStorage.unique_keys, function (key) {

            // If this is a Session var we want to store it there
            if (!Session.equals(key, undefined)) {
                store[key] = Session.get(key);

            // If this var belongs to this ctx object we want to store it here
            } else if (!_.isUndefined(s[key]) && !_.isNull(s[key])) {
                if (key === 'center') {
                    s.center = centerToArray(s.center);
                } else if (key === 'gridCenter') {
                    s.gridCenter = centerToArray(s.gridCenter);
                }
                store[key] = s[key];
            // This var has no value to store
            } else {
                return;
            }
        });

        // Walk though our list of key prefixes and save those with the full key
        _.each(s.localStorage.key_prefixes, function (key_prefix) {
            var prefix_len = key_prefix.length;
            
            // Find any session keys with this prefix
            var keys = _.filter(_.keys(Session.keys), function (key) {
                return (key.slice(0, prefix_len) === key_prefix);
            });
            
            // Save each session var with this key prefix
            _.each(keys, function (key) {
                store[key] = Session.get(key);
            });
        });
 
        return JSON.stringify(store);
    };
 
    State.prototype.save = function (newPage) {
 
        // Save state by writing it to local browser store.
        if (!storageSupported) {
            return;
        }
        var s = this,
            jsonState;

        // If we have a new project, clear any state related to the old project
        if (!'lastProject' in s || s.project !== s.lastProject) {
            Session.set('page', 'mapPage');
            s.lastProject = s.project;
            s.setProjectDefaults();

        } else if ('project' in s) {
 
            // Gather any dynamic attributes
            var dynamic_attrs =
                Shortlist.get_dynamic_entries_for_persistent_state();
 
            if (dynamic_attrs) {
                Session.set('dynamic_attrs', dynamic_attrs);
            }
        }

        jsonState = s.jsonify(newPage);

        // Overwrite the previous state in localStorage
        window.localStorage.removeItem(s.storeName);
        window.localStorage.setItem(s.storeName, jsonState);
    };

 
    State.prototype.load = function (store) {
 
        //console.log('load store:', store);

        // Walk through the saved state loading anything we recognize
        var s = this;
        _.each(store, function (val, key) {

            // Load any vars with unique keys
            if (s.localStorage.unique_keys.indexOf(key) > -1) {
            
                // Load this object's vars into this state if maintained in this
                // state rather than in a Session var
                if (!_.isUndefined(s[key])) {
                    s[key] = val;

                // Otherwise assume this is a Session var and load it into there
                } else {
                    Session.set(key, val);
                }
               
            // This is not a unique key we recognize, so check for key prefixes
            // that we recognize
            } else {
                _.each(s.localStorage.key_prefixes , function (key_prefix) {
                    if (key.slice(0, key_prefix.length) === key_prefix) {
                        Session.set(key, val);
                    }
                });
            }
        });
 
  
        if (Session.equals('page', undefined)) {
            Session.set('page', DEFAULT_PAGE);
        }

        s.lastProject = s.project;
 
        // TODO a special hack until we get bookmarks going: load
        // the hard-coded overlay node data specific to this project
        // Use this method if we want the project in the drop-down lise
        // If you ony want it accessible from a URL, use the method in
        // this.loadFromUrl().
        if (s.project.slice(0,13) === 'Youngwook/ori') {
            Session.set('overlayNodes', OVERLAY_NODES_YOUNGWOOK_ORIGINAL);
        } else if (s.project.slice(0,13) === 'Youngwook/qua') {
            Session.set('overlayNodes',
                OVERLAY_NODES_YOUNGWOOK_QUANTILE_NORMALIZATION);
        } else if (s.project.slice(0,13) === 'Youngwook/exp') {
            Session.set('overlayNodes',
                OVERLAY_NODES_YOUNGWOOK_EXPONENTIAL_NORMALIZATION);
        }
    };
 
    State.prototype.loadFromLocalStore = function () {

        // Load state from local store
        var s = this,
            store = JSON.parse(window.localStorage.getItem(s.storeName));
        s.load(store);
    };

    State.prototype.loadFromBookmark = function (bookmark) {
 
        // Load state from the given bookmark
 
        // First we need to see if we should ignore the url query which
        // was previously included and we want to leave it in the url so the
        // user can fix what's there
        var s = this,
            store = JSON.parse(window.localStorage.getItem(s.storeName));
 
        // Load the bookmarked state.
        Meteor.call('findBookmark', bookmark,
            function (error, result) {
                if (error) {
                    Util.banner('error', error);
                    return;
                }                
                if (result === 'Bookmark not found') {
                    Util.banner('error', result);
                    return;
                }
                s.load(result);
                s.projectNotFoundNotified = false;
            }
        );
    };

    function checkLocalStore () {

        // Check to see if browser supports HTML5 Store
        // Any modern browser should pass.
        // TODO if a browser does not support this, there is no way for a user
        // to change projects. Project could be passed in the URL
        try {
            ("localStorage" in window && window.localStorage !== null); // jshint ignore: line
        } catch (e) {
            Util.banner('warn', "Browser does not support local storage.");
            return false;
        }
        return true;
    }

    centerToLatLng = function (centerIn) {
 
        // If needed, create the center or translate from an array to latLng.
        var center = centerIn;
        if (_.isNull(center)) {
            center = [0, 0];
        }
        if (Array.isArray(center)) {
 
            // This is stored as an array of two numbers rather
            // than as the google-specific latLng.
            center = new google.maps.LatLng(center[0], center[1]);
        }
        return center;
    };
 
    closeBookmark = function () {
        bookmarkDialogHex.hide()
    };
 
    initBookmark = function () {

        // Create an instance of DialogHex
        bookmarkDialogHex = createDialogHex({
            $el: $('#bookmarkDialog'),
            opts: {
                title: 'Bookmark',
                position: { my: "left", at: "left+20", of: window },
                close: closeBookmark,
            },
            showFx: createBookmark,
        });
 
        // Listen for the 'create bookmark' menu clicked
        Tool.add("bookmark", function () { bookmarkDialogHex.show(); },
            'Access this view later by creating a bookmark');
    };
 
    initState = function () {
        storageSupported = checkLocalStore();
        var s = new State();
        s.setAllDefaults();

        // Initialize some flags
        s.projectNotFoundNotified = false;

        // Load state from URL parms.
        if (s.uParm !== null) {
 
            // Handle a bookmark ID parm in the URL.
            if (s.uParm.bookmark) {
                s.loadFromBookmark(s.uParm.bookmark);
                // Other parms in the url are ignored
 
            // Handle other parms in the URL.
            } else {
 
                // Handle a map ID / project in the URL query.
                if (s.uParm.p) {
                    var store = UrlParms.load(s.uParm);
                    s.load(store);
 
                // Handle a page in the URL query.
                } else if (s.uParm.pg) {

                    // First get any saved state.
                    var state = s.loadFromLocalStore();
                    if (!state) { state = {}; }
                    state.page = s.uParm.pg
                    s.load(state);
                }
            }
 
        // If session storage is supported ...
        } else if (storageSupported) {
 
            // Load from the local store if there is anything in there
            s.loadFromLocalStore();
        }
 
        // Reset the state to factory defaults when requested.
        $('body').on('click', '.resetDefaults', function () {
            var project = s.project;
            s.setAllDefaults();
            s.project = project;
            Hex.pageReload('mapPage');
        })

        if (storageSupported) {
 
            // Create a listener to know when to save state
            // This event happens with:
            //  - reload
            //  - new url
            //  - forward & back
            //  - change page within app
            //	- change project
            window.addEventListener('beforeunload', function () {
                s.save();
            });
        }
 
        return s;
    };
})(app);
