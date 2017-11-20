
// Public API for the redux store.

// Actions on state. used with rx.set().
// Usage:  rx.set(<action>, <opts>);
// Where <action> is one of the below, <opts> are defined in rxInternal.js.
// Example:  rx.set('layout.nameSelected', { name: 'RPPA' });
exports.stateActions = [
    'init.activeAttrsInShortlist',
    'init.ctxLoaded',
    'init.domLoaded',
    'init.googleMapApiLoaded',
    'init.layoutNamesReceived',
    'init.layoutNamesRequested',
    'init.mapPrepared',
    'init.mapRendered',
    'init.stateLoaded',
    'init.layoutPositionsLoaded',
    'init.activeAttrsLoaded',
    'init.mapAuthorized',
    'init.colormapLoaded',
    'init.attrSummaryLoaded',
    'init.attrTypesLoaded',
];

// Pieces of state to retrieve, used with rx.get().
// Usage:  rx.get(<state-bit>);
// Where <state-bit> is one of the below.
// Example:  rx.get('layout.name');
const statePieces =  [
    'init.activeAttrsInShortlist',
    'init.ctxLoaded',
    'init.domLoaded',
    'init.googleMapApiLoaded',
    'init.layoutNamesReceived',
    'init.layoutsNamesRequested',
    'init.layoutsPopulated',
    'init.mapPrepared',
    'init.mapRendered',
    'init.stateLoaded',
    'init.layoutPositionsLoaded',
    'init.activeAttrsLoaded',
    'init.mapAuthorized',
    'init.colormapLoaded',
    'init.layerSummaryLoaded',
    'init.LayerTypesLoaded',
];

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
