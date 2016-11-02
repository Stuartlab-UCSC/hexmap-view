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
        storageSupported;
 
    function getUrlParms() {
        var parms = location.search.substr(1);
        var result = {};
        var found = false;
        parms.split("&").forEach(function(part) {
            if (part !== "") {
                var item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
                found = true;
            }
        });
        if (found) {
            return result;
        } else {
            return null;
        }
    }

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
        s.uParm = getUrlParms();

        s.localStorage = {
            // Contains the non-project state we want to save with unique keys
            all: [
                'background',
                'page',
                'project',
                'viewEdges',
                'viewWindows',
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
                'shortlist_on_top',
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
        s.alreadySaved = false;

        // Reactive variables maintained in global state & not project-specific
        Session.setDefault('page', DEFAULT_PAGE);
        Session.setDefault('sort', DEFAULT_SORT); // Default sort message & type
        Session.setDefault('background', 'black');  // Main map background color
        Session.setDefault('viewEdges', false); // Display of directed graph
        Session.setDefault('viewWindows', false); // Display of stats windows
 
        // Non-reactive vars maintained in global state and not project-specific
        s.project = DEFAULT_PROJECT;  // The project data to load
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
        Session.set('first_layer', undefined); // first in shortlist
        s.gridCenter = null; // grid map center
        s.gridZoom = 3;  // Zoom level of the grid
        Session.set('layouts', []);  // Map layouts maintained in order of entry
        Session.set('layoutIndex', null);
        Session.set('overlayNodes', undefined);  // overlay nodes to include
        Session.set('shortlist', []); // Array of layer names in the shortlist
        Session.set('shortlist_on_top', false); // maintain actives at the top
        s.zoom = 3;  // Map zoom level where 3 means zoomed in by 3 levels
    };

    State.prototype.save = function () {
 
        // Save state by writing it to local browser store.
        if (!storageSupported) {
            return;
        }
        var s = this,
            store = {};

        // If we have a new project, clear any state related to the old project
        if (s.lastProject && s.project !== s.lastProject) {
            Session.set('page', 'mapPage');
            s.lastProject = s.project;
            s.setProjectDefaults();
 
        } else if (s.alreadySaved) {
 
            // We may have already saved this because ?
            return;
        }
        s.alreadySaved = true;

        // Gather any dynamic attributes
        var dynamic_attrs =
            Shortlist.get_dynamic_entries_for_persistent_state();
        if (dynamic_attrs) {
            Session.set('dynamic_attrs', dynamic_attrs);
        }
 
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

        // Overwrite the previous state in localStorage
        window.localStorage.removeItem(s.storeName);
        window.localStorage.setItem(s.storeName, JSON.stringify(store));

        //console.log('save store:', store);
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
 
    State.prototype.loadFromBookmark = function (bookmark) {
 
        // Load state from the given bookmark
        var s = this;

        Meteor.call('findBookmark', bookmark,
            function (error, result) {
                if (error) {
                    Util.banner('error', error);
                    return;
                }
                
                var store = result.jsonState;
                if (store === null) {
                    console.log("No saved state found, so using defaults.");
                } else {
                    s.load(store);
                }
                s.projectNotFoundNotified = false;
            }
        );
    };
 
    State.prototype.loadFromLocalStore = function () {

        // Load state from local store
        var s = this,
            store = JSON.parse(window.localStorage.getItem(s.storeName));
        if (store === null) {
            console.log("No saved state found, so using defaults.");

        } else {
            s.load(store);
        }
        
        // TODO a hack until bookmarks are going
        //Session.set('overlayNodes', undefined);  // overlay nodes to include
    };

    State.prototype.fixUpOldUrls = function (project) {
 
        var xlate = {
            'evanPaull/pCHIPS/': 'pCHIPS/',
            'ynewton/gliomas-paper/': 'Gliomas/',
        };
 
        // Fix up some project names that we've aleady given out to people
        // before reorganizing projects and implementing logins
        if (xlate[project]) {
            project = xlate[project];
        }
        return project;
    };
 
    State.prototype.loadFromUrl = function () {
 
        // Load state from parameters in the url
        var s = this;
        var state = {};
 
        // Find the project if one was included in the URL,
        // replacing every '.' with '/'
        if (s.uParm.p) {
            state.project =
                s.uParm.p.replace(/\./g, '/') +
                '/';
 
            // A project in a url means someone wants to see a particular map
            state.page = 'mapPage';
 
            // Find any layout specified
            if (s.uParm.l) {
                Session.set('layoutIndex', s.uParm.l);
            }
 
            // Find any overlay node in the URL
            if (s.uParm.x && s.uParm.y) {
                if (!s.uParm.node) {
                    s.uParm.node = 'x';
                }
                state.overlayNodes = {};
                state.overlayNodes[s.uParm.node] = {x: s.uParm.x, y: s.uParm.y};
 
            } else if (s.uParm.nodes) {
 
                // Load this group of nodes as overlay nodes
                state.overlayNodes = getOverlayNodeGroup(s.uParm.nodes);
     
            // TODO a special hack until we get bookmarks going: load
            // the hard-coded overlay node data specific to this project.
            // Use this method if we want the project only accessible from a URL
            // If you want it on the project list, use the method in
            // this.load().
 
            // For a single node in a URL
            } else if (state.project.slice(0,13) === 'CKCC/v1-') {
      
                var node = state.project.slice(13,-1);
                if (OVERLAY_NODES[node]) {
                    state.overlayNodes = {};
                    state.overlayNodes[node] = OVERLAY_NODES[node];
                }
            } else {
 
                // Fix up any old URLs we gave out
                state.project = s.fixUpOldUrls(state.project);
            }
 
            s.load(state);
        }
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
 
            // This is stored this as an array of two numbers rather
            // than as latLng since when we retrieve it, we won't know
            // about google maps yet so won't understand LatLng.
            center = new google.maps.LatLng(center[0], center[1]);
        }
        return center;
    };
 
    initState = function () {
        storageSupported = checkLocalStore();
        var s = new State();
        s.setProjectDefaults();

        // Initialize some flags
        s.alreadySaved = false;
        s.projectNotFoundNotified = false;

        // Load state
        if (s.uParm !== null) {
            if (s.uParm.b) {
 
                // Load from the bookmark ID in the URL
                s.loadFromBookmark(s.uParm.b);
            } else {
 
                // Load from the parms in the URL
                s.loadFromUrl();
            }
        } else if (storageSupported) {
 
            // Load from the local store if there is anything in there
            s.loadFromLocalStore();
        }
        if (storageSupported) {
        
            // Create a listener to know when to save state
            window.onbeforeunload = function() {
                s.save();
            };
        }
 
        return s;
    };
})(app);

