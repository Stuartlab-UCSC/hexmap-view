
// Redux implementation.

import redux from 'redux';
import shortEntryState from '/imports/mapPage/shortlist/shortEntryState';
import rx from './rx';

const reducers = {
    'activeAttrs': (state = [], action) => {
        let newState = []
        switch (action.type) {
        case 'activeAttrs.deleteOne':
            newState = rx.copyStringArray(state)
            return _.without(newState, action.attr);
        case 'activeAttrs.loadPersist':
            return action.loadPersist;
        case 'activeAttrs.primaryToSecondary':
            if (state.length > 1) {
                return [state[1].slice(), state[0].slice()];
            }
            return state;
        case 'activeAttrs.updateAll':
            return action.attrs;
        case 'activeAttrs.upsertPrimary':
            if (state.length < 2) {
                return [action.attr];
            } else {
                return [action.attr, state[1].slice()];
            }
        case 'activeAttrs.upsertSecondary':
            if (state.length < 1) {
                return [action.attr];
            } else {
                return [state[0].slice(), action.attr];
            }
        default:
            return state;
        }
    },
    'background': (state = 'black', action) => {
        switch(action.type) {
        case 'background.loadPersist':
            return action.loadPersist
        case 'background.toggle':
            return (state === 'black') ? 'white' : 'black'
        default:
            return state
        }
    },
    'bookmarkUsed': (state = false, action) => {
        return (action.type === 'bookmarkUsed') ? true : state;
    },
    'doNotTrack': (state = null, action) => {
        switch(action.type) {
        case 'doNotTrack.displayed':
            return 'displayed'
        case 'doNotTrack.loadPersist':
            return action.loadPersist
        default:
            return state
        }
    },
    'dynamicAttrs': (state = null, action) => {
        return (action.type === 'dynamicAttrs.loadPersist') ?
            action.loadPersist : state;
    },
    'firstAttr': (state = null, action) => {
        if (action.type === 'firstAttr') {
            return action.attr;
        } else {
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
    'inited.coloringAttrs': (state = false, action) => {
        return (action.type === 'inited.coloringAttrs') ? true : state;
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
    'user.mapAuthorized': (state = 'not', action) => {
        switch (action.type) {
        case 'user.mapAuthorized.edit':
            return 'edit';
        case 'user.mapAuthorized.view':
            return 'view';
        case 'user.mapAuthorized.not':
            return 'not';
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
    
    // Combine the shortEntry reducers with these reducers.
    // TODO use nested reducers rather than a flat space.
    Object.assign(reducers, shortEntryState.getReducers())

    // Create the store.
    /* eslint-disable no-underscore-dangle */
    rx.init(redux.createStore(
        redux.combineReducers(reducers), /* preloadedState, */
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    ));
    /* eslint-enable */
};
