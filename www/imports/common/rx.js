
// Public API for the redux store.

// State actions used with rx.set().
// Usage:  rx.set(<action>, <opts>);
// Where <action> is one of the below, <opts> are defined in rxInternal.js.
/*
// Example:  rx.set('layout.name.selected', { name: 'RPPA' });
const actions = [
    'layout.name.selected',
];
*/
// Example:  rx.set(rx.act.LAYOUT_NAME_SELECTED, { name: 'RPPA' });
exports.act = {
    INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST: 'INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST',
    INIT_APP_CTX_LOADED: 'INIT_APP_CTX_LOADED',
    INIT_APP_DOM_LOADED: 'INIT_APP_DOM_LOADED',
    INIT_APP_GOOGLE_MAP_API_LOADED: 'INIT_APP_GOOGLE_MAP_API_LOADED',
    INIT_APP_LAYOUT_NAMES_RECEIVED: 'INIT_APP_LAYOUT_NAMES_RECEIVED',
    INIT_APP_LAYOUT_NAMES_REQUESTED: 'INIT_APP_LAYOUT_NAMES_REQUESTED',
    INIT_APP_LAYOUTS_POPULATED: 'INIT_APP_LAYOUTS_POPULATED',
    INIT_APP_MAP_PREPARED: 'INIT_APP_MAP_PREPARED',
    INIT_APP_MAP_RENDERED: 'INIT_APP_MAP_RENDERED',
    INIT_APP_STATE_LOADED: 'INIT_APP_STATE_LOADED',
    INIT_LAYOUT_POSITIONS_LOADED: 'INIT_LAYOUT_POSITIONS_LOADED',
    INIT_MAP_ACTIVE_ATTRS_LOADED: 'INIT_MAP_ACTIVE_ATTRS_LOADED',
    INIT_MAP_AUTHORIZED: 'INIT_MAP_AUTHORIZED',
    INIT_MAP_COLORMAP_LOADED: 'INIT_MAP_COLORMAP_LOADED',
    INIT_MAP_LAYER_SUMMARY_LOADED: 'INIT_MAP_LAYER_SUMMARY_LOADED',
    INIT_MAP_LAYER_TYPES_LOADED: 'INIT_MAP_LAYER_TYPES_LOADED',
};

// Pieces of state to retrieve, used with rx.get().
// Usage:  rx.get(<state-bit>);
// Where <state-bit> is one of the below.
/*
// Example:  rx.get('layout.name');
const stateBits = [
    'layout.name',
];
*/
// Example:  rx.get(rx.bit.persistlayoutName);
exports.bit = {
    initAppActiveAttrsInShortlist: 'initAppActiveAttrsInShortlist',
    initAppCtxLoaded: 'initAppCtxLoaded',
    initAppDomLoaded: 'initAppDomLoaded',
    initAppGoogleMapApiLoaded: 'initAppGoogleMapApiLoaded',
    initAppLayoutNamesReceived: 'initAppLayoutNamesReceived',
    initAppLayoutsNamesRequested: 'initAppLayoutsNamesRequested',
    initAppLayoutsPopulated: 'initAppLayoutsPopulated',
    initAppMapPrepared: 'initAppMapPrepared',
    initAppMapRendered: 'initAppMapRendered',
    initAppStateLoaded: 'initAppStateLoaded',
    initLayoutPositionsLoaded: 'initLayoutPositionsLoaded',
    initMapActiveAttrsLoaded: 'initMapActiveAttrsLoaded',
    initMapAuthorized: 'initMapAuthorized',
    initMapColormapLoaded: 'initMapColormapLoaded',
    initMapLayerSummaryLoaded: 'initMapLayerSummaryLoaded',
    initMapLayerTypesLoaded: 'initMapLayerTypesLoaded',
};

// The global redux state.
var reduxStore = null;

// Functions to access the redux state.
exports.get = function (stateBit) {
    
    // Retrieve the state of one piece of state.
    // @param stateItem: one of the items tracked in redux state
    // @returns: the current state of the state item
    // usage example:  rx.get(rx.bit.layoutName);
    return reduxStore.getState()[stateBit];
};

exports.getState = function () {

    // Retrieve the entire state tree.
    return reduxStore.getState();
};



exports.set = function (actionType, optsIn) {
    
    // Set the state using an action type.
    // @param actionType: the action type required for any operation
    // @param optsIn: object containing options specific to a redux action,
    //                optional depending on the action
    // @returns: the new state tree
    // usage example:  rx.set(rx.act.LAYOUT_NAME_SELECTED, { name: 'RPPA' });
    var opts = optsIn  || {};
    opts.type = actionType;
    return reduxStore.dispatch(opts);
};

exports.subscribe = function (callback) {

    // Subscribe to state changes to call back upon change.
    // @callback: a function to call when the state changes
    // @returns: a function to unsubscribe from state changes.
    return reduxStore.subscribe(callback);
};

exports.init = function (store) {
    reduxStore = store;
};
