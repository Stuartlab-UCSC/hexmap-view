// state.js
// An object to write and load state

import overlayNodes from '/imports/mapPage/calc/overlayNodes';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import urlParms from '/imports/common/urlParms';
import utils from '/imports/common/utils';

import '/imports/common/navBar.html';

var LOGGING = false,  // true means log the state and store on save and load
    DEFAULT_PAGE = 'homePage',
    DEFAULT_PROJECT = 'Gliomas/',
    storageSupported,
    storeName,
    lastProject;

// Persistent state variable names and defaults, with boolean options of:
//      session: true indicates state is maintained in a meteor session var
//      ctx: true indicates state is maintained in a ctx var
//      no session or ctx flag indicates state is maintained in a redux var
//      project: true indicates a project-specific var
//      persistForever: true indicates the user-selected value should always
//                      persist, overriding defaults, bookmarks and URL parms.
//                      This parm only effects vars maintained in redux
//
var varInfo = {
    activeAttrs: {
        defalt: [],
        project: true,
    },
    background: {
        defalt: 'black',
        persistForever: true,
    },
    center: {
        defalt: [0, 0],
        ctx: true,
        project: true,
    },
    doNotTrack: {
        defalt: null,
        persistForever: true,
    },
    dynamicAttrs: {
        defalt: {},
        project: true,
    },
    layoutIndex: {
        defalt: undefined, // must be undefined for layoutName to be accepted.
        session: true,
        project: true,
    },
    layoutName: {
        defalt: '',
        session: true,
        project: true,
    },
    mapView: {
        defalt: 'honeycomb',
        session: true,
    },
    overlayNodes: {
        defalt: undefined,
        session: true,
        project: true,
    },
    page: {
        defalt: DEFAULT_PAGE,
        session: true,
    },
    project: {
        defalt: DEFAULT_PROJECT,
        ctx: true,
    },
    'shortEntry.filter': {
        defalt: {},
        project: true,

    },
    'shortEntry.menu.filter': {
        defalt: {},
        project: true,
    },
    shortlist: {
        defalt: [],
        project: true,
    },
    transparent: {
        defalt: false,
        session: true,
    },
    zoom: {
        defalt: 3,
        ctx: true,
        project: true,
    },
};

function isDefaultCenter(val) {
    return (val &&
        typeof val === 'object' &&
        val.length === 2 &&
        val[0] === 0 &&
        val[1] === 0);
}

function isDefaultEmptyObject(val) {
    return (val &&
        typeof val === 'object' &&
        Object.keys(val).length < 1);
}

function isDefaultEmptyArray(val) {
    return (val &&
        typeof val === 'object' &&
        val.length < 1);
}

function isDefault (key, val) {
    
    // Special default values.
    if (key === 'activeAttrs' || key === 'shortlist') {
        return isDefaultEmptyArray(val);
    } else if (key === 'dynamicAttrs') {
        return isDefaultEmptyObject(val);
    } else if (key === 'center') {
        return isDefaultCenter(val);
    } else {  // the usual case.
        return (val === varInfo[key].defalt);
    }
}

function logState (label) {
    if (!LOGGING) {
        return;
    }
    console.log(label, 'state...');
    var val;
    _.each(varInfo, function (info, key) {
        //if (key === 'activeAttrs' || key === 'dynamicAttrs') {
        if (info.session) {
            val = Session.get(key);
        } else if (info.ctx) {
            val = ctx[key];
        } else {
            val = rx.get(key);
        }
        if (!isDefault(key, val)) {
            console.log(key, ':', val);
        }
        //}
    });
}

function logStore (label, store) {
    if (!LOGGING) {
        return;
    }
    console.log(label, 'store...');
    _.each(store, function (val, key) {
        //if (key === 'activeAttrs' || key === 'dynamicAttrs') {
        console.log(key, ':', store[key]);
        //}
    });
}

function centerToArray (centerIn) {

    // If needed, translate the latLng center to an array for store.
    var center = centerIn;
    if (!Array.isArray(center)) {

        // This is stored this as an array of two numbers rather
        // than as a third party library-specific format.
        center = [center.lat(), center.lng()];
    }
    return center;
}

function setDefaults (justProject, keepMap, resetPersistForever) {

    // Set the default of each persistent variable.
    // @param justProject: true if we are only resetting the project variables.
    // @param keepMap: true if we want to retain the current mapId value.
    // @param resetPersistForever: true to initialize even the persistForever
    //                             variables

    _.each(varInfo, function (info, key) {
         
        // If this is not just for project vars
        // or if this is just for project vars and this is a project var...
        if (!(justProject) || (justProject && info.project)) {
        
            // Dynamic attrs need to be removed from the layers list.
            if (key === 'dynamicAttrs') {
                shortlist.removeDynamicEntries();
            }
           
            // If this is a Session var...
            if (info.session) {
                Session.set(key, info.defalt);
                if (Session.get(key) === undefined) {
                    delete Session.keys[key];
                }
           
            // If this is a ctx var...
            } else if (info.ctx) {
                if (key === 'project' && keepMap) {
                    // Keep the project name value.
                } else {
                    ctx[key] = info.defalt;
                }
           
            // This must be a redux var. If the var is not to persistForever...
            } else if (!info.persistForever) {
                rx.set(key + '.loadPersist', { loadPersist: info.defalt })
           
            // Is a persistForever var, so if caller wants to reset these...
            } else if (resetPersistForever) {
                rx.set(key + '.loadPersist', { loadPersist: info.defalt })
            }
        }
    });
}

function localStore (oper, jsonStore) {
    if (oper === 'get') {
        return JSON.parse(window.localStorage.getItem(storeName));

    } else if (oper === 'set') {
        window.localStorage.setItem(storeName, jsonStore);
        
    } else if (oper === 'remove') {
        window.localStorage.removeItem(storeName);
        
    } else {
        console.log('bad operation for local store:', oper);
    }
}

function jsonStringify (store) {
    return JSON.stringify(store);
}

function save () {

    // Save state by writing it to local browser store.

    // If we have a new project, clear any state related to the old project
    if (ctx.project !== lastProject) {
        lastProject = ctx.project;
        setDefaults(true);
    }
    
    // Overwrite the previous state in localStorage
    localStore('remove');
    localStore('set', exports.saveEach());
}

function preBookmark () {

    // A special hack before we had bookmarks going: load
    // the hard-coded overlay node data specific to this project
    // Use this method if we want the project in the drop-down lise
    // If you ony want it accessible from a URL, use the method in
    // loadFromUrl().
    if (ctx.project.slice(0,13) === 'Youngwook/ori' ||
        ctx.project.slice(0,13) === 'Youngwook.ori') {
        Session.set('overlayNodes', overlayNodes.get('youngwookOriginal'));
    } else if (ctx.project.slice(0,13) === 'Youngwook/qua') {
        Session.set('overlayNodes',
            overlayNodes.get('youngwookQuantileNormalization'));
    } else if (ctx.project.slice(0,13) === 'Youngwook/exp') {
        Session.set('overlayNodes',
            overlayNodes.get('youngwookExponentialNormalization'));
    }
}

function load (storeIn, page) {
    
    if (!storageSupported) {
        return;
    }
    let sessionStore = localStore('get')
    let store = storeIn || sessionStore;
    
    // If a page was included, put that in the store before
    // loading it into state.
    if (page) {
        store.page = page;
    }

    logStore('\nLoad', store);

    // Walk through the store, loading as operating values.
    _.each(store, function (val, keyIn) {
        var key = keyIn;

        // Handle any old names.
        if (key === 'active_layers') {
            key = 'activeAttrs';
        } else if (key === 'dynamic_attrs') {
            key = 'dynamicAttrs';
        }
    
        // Find this key's info.
        var info = varInfo[key];
        
        // Only deal with keys in the store that we recognize.
        if (info !== undefined ) {
           
            // If this is a meteor Session var...
            if (info.session) {
                Session.set(key, val);

            // If this is a ctx var...
            } else if (info.ctx) {
                ctx[key] = val;

            // This is a redux var.
            // If this is not a persistForever var...
            } else if (!info.persistForever) {
                rx.set(key + '.loadPersist', { loadPersist: val });
            }
        }
    });
    
    // If the given store is not the session store,
    // set the persistForever values in session store.
    if (sessionStore !== storeIn) {
    
        // Walk through the session store.
        _.each(sessionStore, function (val, key) {
               
            // Find this key's info.
            var info = varInfo[key];
            
            if (info !== undefined && info.persistForever) {
                rx.set(key + '.loadPersist', { loadPersist: val });
            }
        })
    }

    lastProject = ctx.project;

    preBookmark();

    rx.set('inited.state');
    
    // Log all persistent store state values.
}

function checkLocalStore () {

    // Check to see if browser supports HTML5 Store
    // Any modern browser should pass.
    // TODO if a browser does not support this, there is no way for a user
    // to change projects. Project could be passed in the URL
    try {
        ("localStorage" in window && window.localStorage !== null);
    } catch (e) {
        //userMsg.warn("Browser does not support local storage.");
        return false;
    }
    return true;
}

exports.saveEach = function () {

    // Log all persistent store state values.
    logState('\nSave');

    // Save each persistent state value.
    var store = {};

    // Walk though our list of keys and save those that are not the default.
    _.each(varInfo, function (info, key) {
        var val = null;
        
        // If this is the map center, convert the latLng to xy coords.
        if (key === 'center') {
            val = centerToArray(ctx.center);
           
        // If dynamic attrs, convert to store format.
        } else if (key === 'dynamicAttrs') {
            val = shortlist.dynamicAttrsToStoreFormat();

        // If this is a Session var...
        } else if (info.session) {
            val = Session.get(key);

        // If this is a ctx var...
        } else if (info.ctx) {
            val = ctx[key];

        // This is a redux var.
        } else {
            val = rx.get(key);
        }

        // Only save non-defaults.
        if (!isDefault(key, val)) {
            store[key] = val;
        }
    });
    
    logStore('Save', store);

    return jsonStringify(store);
};

exports.hasLocalStore = function () {
    return storageSupported;
};

exports.init = function () {
    storageSupported = checkLocalStore();
    ctx = {}; // global
    setDefaults(null, null, true);

    // Give different servers different store names.
    storeName = location.host + '-hexMapState';
    
    // Load any parameters in the URL.
    if (urlParms.handle(load) === null) {

        // Load from the local store since there were no url parameters.
        load();
    }

    // Reset the state to factory defaults when requested.
    $('body').on('click', '.resetDefaults', function () {
        setDefaults(false, true);
        utils.loadPage('mapPage');
    });

    if (storageSupported) {

        // Create a listener to know when to save state
        // This event happens with:
        //  - reload
        //  - new url
        //  - forward & back
        //  - change page within app
        //	- change project
        window.addEventListener('beforeunload', function () {
            save();
        });
    }
};
