
// Public API for the redux store.

// Actions on state. used with rx.set().
// Usage:  rx.set(<action>, <opts>);
// Where <action> is one of the below, <opts> are defined in rxInternal.js.
// Example:  rx.set('layout.nameSelected', { name: 'RPPA' });
exports.stateActions = [
    'init.activeAttrs.inShortlist',
    'init.activeAttrs.valuesLoaded',
    'init.layoutNames.populated',
    'init.layoutNames.received',
    'init.layoutNames.requested',
    'init.map.prepared',
    'init.map.rendered',
    'inited.attrSummary',
    'inited.attrTypes',
    'inited.colormap',
    'inited.ctx',
    'inited.dom',
    'inited.googleMapApi',
    'inited.layout',
    'inited.state',
    'initializing',
    'projectList.loading',
    'projectList.receiving',
    'projectList.stable',
    'snake.map.hide',
    'snake.map.show',
    'snake.project.hide',
    'snake.project.show',
    'snake.shortlist',
    'snake.shortlist.hide',
    'snake.shortlist.show',
    'uploading.done',
    'uploading.now',
    'user.mapAuthorized.yes',
    'user.mapAuthorized.not',
    'user.roles.empty',
    'user.roles.load',
];

// Pieces of state to retrieve, used with rx.get().
// Usage:  rx.get(<state-bit>);
// Where <state-bit> is one of the below.
// Example:  rx.get('layout.name');
const statePieces =  [ // eslint-disable-line
    'init.activeAttrs',
    'init.layoutNames',
    'init.map',
    'inited.attrSummary',
    'inited.attrTypes',
    'inited.colormap',
    'inited.ctx',
    'inited.dom',
    'inited.googleMapApi',
    'inited.layout',
    'inited.state',
    'initializing',
    'projectList',
    'snake.map',
    'snake.project',
    'snake.shortlist',
    'user.mapAuthorized',
    'user.roles',
];

// The global redux state.
var reduxStore = null;

// Functions to access the redux state.
exports.get = function (statePiece) {
    
    // Retrieve the state of one piece of state.
    // @param statePiece: one of the items tracked in redux state
    // @returns: the current state of the piece of state
    // usage example:  rx.get('layout.name');
    return reduxStore.getState()[statePiece];
};

exports.getState = function () {

    // Retrieve the entire state tree.
    return reduxStore.getState();
};

exports.set = function (stateAction, optsIn) {
    
    // Set the state using an state action type.
    // @param stateAction: the action type required for any operation
    // @param optsIn: object containing options specific to a redux action,
    //                optional depending on the action
    // @returns: the new state tree
    // usage example:  rx.set('layout.nameSelected', { name: 'RPPA' });
    var opts = optsIn  || {};
    opts.type = stateAction;
    return reduxStore.dispatch(opts);
};

exports.dispatch = function (stateAction) {

    // Dispatch an action.
    return reduxStore.dispatch(stateAction);
};

exports.subscribe = function (callback) {

    // Subscribe to state changes to call back upon change.
    // @param callback: a function to call when the state changes
    // @returns: a function to unsubscribe from state changes.
    return reduxStore.subscribe(callback);
};

exports.init = function (store) {
    reduxStore = store;
};
