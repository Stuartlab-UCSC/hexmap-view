
// Redux implementation.

import redux from 'redux';
import rx from './rx.js';

const reducers = {
    'createMap.running': (state = false, action) => {
        switch (action.type) {
        case 'createMap.running.now':
            return true;
        case 'createMap.running.done':
            return false;
        default:
            return state;
        }
    },
    'init': (state = true, action) => {
        switch (action.type) {
        case 'init.done':
            return false;
        default:
            return state;
        }
    },
    'init.activeAttrsInShortlist': (state = false, action) => {
        return (action.type === 'init.activeAttrsInShortlist') ? true : state;
    },
    'init.activeAttrsLoaded': (state = false, action) => {
        return (action.type === 'init.activeAttrsLoaded') ? true : state;
    },
    'init.attrSummaryLoaded': (state = false, action) => {
        return (action.type === 'init.attrSummaryLoaded') ? true : state;
    },
    'init.attrTypesLoaded': (state = false, action) => {
        return (action.type === 'init.attrTypesLoaded') ? true : state;
    },
    'init.colormapLoaded': (state = false, action) => {
        return (action.type === 'init.colormapLoaded') ? true : state;
    },
    'init.ctxLoaded': (state = false, action) => {
        return (action.type === 'init.ctxLoaded') ? true : state;
    },
    'init.googleMapApiLoaded': (state = false, action) => {
        return (action.type === 'init.googleMapApiLoaded') ? true : state;
    },
    'init.domLoaded': (state = false, action) => {
        return (action.type === 'init.domLoaded') ? true : state;
    },
    'init.layerDataTypesProcessed': (state = false, action) => {
        return (action.type === 'init.layerDataTypesProcessed') ? true : state;
    },
    'init.layoutNamesReceived': (state = false, action) => {
        return (action.type === 'init.layoutNamesReceived') ? true : state;
    },
    'init.layoutNamesRequested': (state = false, action) => {
        return (action.type === 'init.layoutNamesRequested') ? true : state;
    },
    'init.layoutsPopulated': (state = false, action) => {
        return (action.type === 'init.layoutsPopulated') ? true : state;
    },
    'init.layoutPositionsLoaded': (state = false, action) => {
        return (action.type === 'init.layoutPositionsLoaded') ? true : state;
    },
    'init.mapPrepared': (state = false, action) => {
        return (action.type === 'init.mapPrepared') ? true : state;
    },
    'init.mapRendered': (state = false, action) => {
        return (action.type === 'init.mapRendered') ? true : state;
    },
    'init.stateLoaded': (state = false, action) => {
        return (action.type === 'init.stateLoaded') ? true : state;
    },
    'placeNode.running': (state = false, action) => {
        switch (action.type) {
        case 'placeNode.running.now':
            return true;
        case 'placeNode.running.done':
            return false;
        default:
            return state;
        }
    },
    'projectList.changing': (state = false, action) => {
        switch (action.type) {
        case 'projectList.changing.now':
            return true;
        case 'projectList.changing.done':
            return false;
        default:
            return state;
        }
    },
    'projectList.receiving': (state = false, action) => {
        switch (action.type) {
        case 'projectList.receiving.now':
            return true;
        case 'projectList.receiving.done':
            return false;
        default:
            return state;
        }
    },
    'uploading': (state = false, action) => {
        switch (action.type) {
        case 'uploading.now':
            return true;
        case 'uploading.done':
            return false;
        default:
            return state;
        }
    },
    'user.mapAuthorized': (state = false, action) => {
        switch (action.type) {
        case 'user.mapAuthorized.yes':
            return true;
        case 'user.mapAuthorized.not':
            return false;
        default:
            return state;
        }
    },
    'user.roles': (state = [], action) => {
        switch (action.type) {
        case 'user.roles.empty':
            return [];
        case 'user.roles.load':
            return action.roles;
        default:
            return state;
        }
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
    _.each(rx.stateActions, function(id) {
        makeAction(id);
    });
}

exports.init = function () {
    
    // Create the redux actions.
    makeStateActions();
    
    // Combine the reducers, create the store and initialize the constants
    // for callers.
    /* eslint-disable no-underscore-dangle */
    rx.init(redux.createStore(
        redux.combineReducers(reducers), /* preloadedState, */
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    ));
    /* eslint-enable */
};
