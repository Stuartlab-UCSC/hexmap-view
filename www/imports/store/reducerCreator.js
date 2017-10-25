
// Redux reducer creators.

import { combineReducers, createStore } from 'redux';
import Action from './action.js';

const initCtxLoad = (state = false, action) => {
    switch (action.type) {
    case Action.INIT_CTX_LOADED:
        return true;
    default:
        return state;
    }
};

const initLayerSummaryLoad = (state = false, action) => {
    switch (action.type) {
    case Action.INIT_LAYER_SUMMARY_LOADED:
        return true;
    default:
        return state;
    }
};

const initLayerTypesLoad = (state = false, action) => {
    switch (action.type) {
    case Action.INIT_LAYER_TYPES_LOADED:
        return true;
    default:
        return state;
    }
};

const initDomLoad = (state = false, action) => {
    switch (action.type) {
    case Action.INIT_DOM_LOADED:
        return true;
    default:
        return state;
    }
};

const initStateLoad = (state = false, action) => {
    switch (action.type) {
    case Action.INIT_STATE_LOADED:
        return true;
    default:
        return state;
    }
};

const init = combineReducers({
    initCtxLoad,
    initLayerSummaryLoad,
    initLayerTypesLoad,
    initDomLoad,
    initStateLoad,
});

exports.init = function () {

    // Create the global state.
    rx = createStore(init);
};
