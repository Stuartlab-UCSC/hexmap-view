
// Redux reducer creators.

import { combineReducers, createStore } from 'redux';
import rxAction from './rxAction.js';

/*
// A helper mapping action types to handlers.
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


const initAppActiveAttrsInShortlist = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST) ?
        true : state;
};

const initAppCtxLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_CTX_LOADED) ? true : state;
};

const initAppDomLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_DOM_LOADED) ? true : state;
};

const initAppGoogleMapApiLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_GOOGLE_MAP_API_LOADED) ?
        true : state;
};

const initAppLayoutNamesReceived = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_LAYOUT_NAMES_RECEIVED) ?
        true : state;
};

const initAppLayoutsNamesRequested = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_LAYOUT_NAMES_REQUESTED) ?
        true : state;
};

const initAppLayoutsPopulated = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_LAYOUTS_POPULATED) ? true : state;
};

const initAppMapPrepared = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_MAP_PREPARED) ? true : state;
};

const initAppMapRendered = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_MAP_RENDERED) ? true : state;
};

const initAppStateLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_APP_STATE_LOADED) ? true : state;
};

const initLayoutPositionsLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_LAYOUT_POSITIONS_LOADED) ? true : state;
};

const initMapActiveAttrsLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_MAP_ACTIVE_ATTRS_LOADED) ? true : state;
};

const initMapAuthorized = (state = false, action) => {
    return (action.type === rxAction.INIT_MAP_AUTHORIZED) ? true : state;
};

const initMapColormapLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_MAP_COLORMAP_LOADED) ? true : state;
};

const initMapLayerSummaryLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_MAP_LAYER_SUMMARY_LOADED) ? true : state;
};

const initMapLayerTypesLoaded = (state = false, action) => {
    return (action.type === rxAction.INIT_MAP_LAYER_TYPES_LOADED) ? true : state;
};

const reducers = combineReducers({
    initAppActiveAttrsInShortlist,
    initAppCtxLoaded,
    initAppDomLoaded,
    initAppGoogleMapApiLoaded,
    initAppLayoutNamesReceived,
    initAppLayoutsNamesRequested,
    initAppLayoutsPopulated,
    initAppMapPrepared,
    initAppMapRendered,
    initAppStateLoaded,
    initLayoutPositionsLoaded,
    initMapActiveAttrsLoaded,
    initMapAuthorized,
    initMapColormapLoaded,
    initMapLayerSummaryLoaded,
    initMapLayerTypesLoaded,
});

exports.init = function () {

    // Create the global state.
    rx = createStore(reducers);
};
