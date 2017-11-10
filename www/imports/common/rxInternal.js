
// Redux implementation.

import redux from 'redux';
import rx from './rx.js';

const A = rx.act;

const reducers = {
    initAppActiveAttrsInShortlist: (state = false, action) => {
        return (action.type === A.INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST) ?
            true : state;
    },
    initAppCtxLoaded: (state = false, action) => {
        return (action.type === A.INIT_APP_CTX_LOADED) ? true : state;
    },
    initAppDomLoaded: (state = false, action) => {
        return (action.type === A.INIT_APP_DOM_LOADED) ? true : state;
    },
    initAppGoogleMapApiLoaded: (state = false, action) => {
        return (action.type === A.INIT_APP_GOOGLE_MAP_API_LOADED) ?
            true : state;
    },
    initAppLayoutNamesReceived: (state = false, action) => {
        return (action.type === A.INIT_APP_LAYOUT_NAMES_RECEIVED) ?
            true : state;
    },
    initAppLayoutsNamesRequested: (state = false, action) => {
        return (action.type === A.INIT_APP_LAYOUT_NAMES_REQUESTED) ?
            true : state;
    },
    initAppLayoutsPopulated: (state = false, action) => {
        return (action.type === A.INIT_APP_LAYOUTS_POPULATED) ? true : state;
    },
    initAppMapPrepared: (state = false, action) => {
        return (action.type === A.INIT_APP_MAP_PREPARED) ? true : state;
    },
    initAppMapRendered: (state = false, action) => {
        return (action.type === A.INIT_APP_MAP_RENDERED) ? true : state;
    },
    initAppStateLoaded: (state = false, action) => {
        return (action.type === A.INIT_APP_STATE_LOADED) ? true : state;
    },
    initLayoutPositionsLoaded: (state = false, action) => {
        return (action.type === A.INIT_LAYOUT_POSITIONS_LOADED) ? true : state;
    },
    initMapActiveAttrsLoaded: (state = false, action) => {
        return (action.type === A.INIT_MAP_ACTIVE_ATTRS_LOADED) ? true : state;
    },
    initMapAuthorized: (state = false, action) => {
        return (action.type === A.INIT_MAP_AUTHORIZED) ? true : state;
    },
    initMapColormapLoaded: (state = false, action) => {
        return (action.type === A.INIT_MAP_COLORMAP_LOADED) ? true : state;
    },
    initMapLayerSummaryLoaded: (state = false, action) => {
        return (action.type === A.INIT_MAP_LAYER_SUMMARY_LOADED) ? true : state;
    },
    initMapLayerTypesLoaded: (state = false, action) => {
        return (action.type === A.INIT_MAP_LAYER_TYPES_LOADED) ? true : state;
    },
};

// Create one action.
function makeAction (type, ...argNames) {
    return function (...args) {
        let action = { type };
        argNames.forEach((arg, index) => {
            action[argNames[index]] = args[index];
        });
        return action;
    };
}

// Create all actions.
function makeStateActions () {

    // Create all action identifiers and actions for single action bits of state.
    // TODO: This only works for those state bits with only one action.
    _.each(Object.keys(A), function(id) {
        makeAction(id);
    });
}

exports.init = function () {
    
    // Create the redux actions.
    makeStateActions();
    
    // Combine the reducers, create the store and initialize the constants
    // for callers.
    rx.init(redux.createStore(redux.combineReducers(reducers)));
};

/*
// A helper function for creating a reducer from actions.
// May be good for those state items with multiple actions.
function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    } else {
      return state
    }
  }
}
// example:
export const todos = createReducer([], {
  [ActionTypes.ADD_TODO](state, action) {
    let text = action.text.trim()
    return [ ...state, text ]
  }
})
*/

