
// Redux implementation.

import redux from 'redux';
import rx from './rx.js';

const reducers = {
    'init.activeAttrs': (state = false, action) => {
        switch (action.type) {
        case 'init.activeAttrs.valuesLoaded':
            return 'valuesLoaded';
        case 'init.activeAttrs.inShortlist':
            return 'inShortlist';
        default:
            return state;
        }
    },
    'init.layoutNames': (state = false, action) => {
        switch (action.type) {
        case 'init.layoutNames.received':
            return 'received';
        case 'init.layoutNames.requested':
            return 'requested';
        case 'init.layoutNames.populated':
            return 'populated';
        default:
            return state;
        }
    },
    'init.map': (state = false, action) => {
        switch (action.type) {
        case 'init.map.prepared':
            return 'prepared';
        case 'init.map.rendered':
            return 'rendered';
        default:
            return state;
        }
    },
    'inited.attrSummary': (state = false, action) => {
        return (action.type === 'inited.attrSummary') ? true : state;
    },
    'inited.attrTypes': (state = false, action) => {
        return (action.type === 'inited.attrTypes') ? true : state;
    },
    'inited.colormap': (state = false, action) => {
        return (action.type === 'inited.colormap') ? true : state;
    },
    'inited.ctx': (state = false, action) => {
        return (action.type === 'inited.ctx') ? true : state;
    },
    'inited.dom': (state = false, action) => {
        return (action.type === 'inited.dom') ? true : state;
    },
    'inited.googleMapApi': (state = false, action) => {
        return (action.type === 'inited.googleMapApi') ? true : state;
    },
    'inited.layout': (state = false, action) => {
        return (action.type === 'inited.layout') ? true : state;
    },
    'inited.state': (state = false, action) => {
        return (action.type === 'inited.state') ? true : state;
    },
    'initializing': (state = true, action) => {
        switch (action.type) {
        case 'initializing':
            return ;
        default:
            return state;
        }
    },
    'projectList': (state = 'receiving', action) => {
        switch (action.type) {
        case 'projectList.loading':
            return 'loading';
        case 'projectList.receiving':
            return 'receiving';
        case 'projectList.stable':
            return 'stable';
        default:
            return state;
        }
    },
    'snake.project': (state = true, action) => {
        switch (action.type) {
        case 'snake.project.show':
            return true;
        case 'snake.project.hide':
            return false;
        default:
            return state;
        }
    },
    'snake.map': (state = true, action) => {
        switch (action.type) {
        case 'snake.map.show':
            return true;
        case 'snake.map.hide':
            return false;
        default:
            return state;
        }
    },
    'snake.shortlist': (state = true, action) => {
        switch (action.type) {
        case 'snake.shortlist.show':
            return true;
        case 'snake.shortlist.hide':
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
