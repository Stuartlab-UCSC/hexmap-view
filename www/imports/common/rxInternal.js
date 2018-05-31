
// Redux implementation.

import redux from 'redux';
import rx from './rx.js';

function clone (obj) {
    return JSON.parse(JSON.stringify(obj))
}

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
    'shortEntry.bgNodes.visible': (state = true, action) => {
        return action.type === ('shortEntry.bgNodes.visible.toggle') ?
            !state : state;
    },
    'shortEntry.filter': (state = {}, action) => {
        let newState
        let filter
        switch (action.type) {        
        
        // Select all of the values in the category list.
        case 'shortEntry.filter.category.all':
            newState = clone(state)
            newState[action.attr] = {
                by: 'category',
                value: action.value,
            }
            return newState
        
        // Update the category values to be filtered by.
        case 'shortEntry.filter.category':
            newState = clone(state)

            // If there is a filter for this attr in state...
            if (action.attr in state) {
                
                // If the filter is by category...
                filter = state[action.attr]
                if (filter.by === 'category') {
                
                    // If the new value is in the list of values...
                    let index = filter.value.indexOf(action.value)
                    if (index > -1) {
                    
                        // If there is just this value in the list....
                        if (filter.value.length < 2) {
                        
                            // Remove the filter entirely
                            delete newState[action.attr]
                            return newState
                        } else {
                        
                            // Remove just this value from the list of values.
                            let newValues = filter.value.slice(0)
                            newValues.splice(index, 1)
                            newState[action.attr] = {
                                by: 'category',
                                value: newValues
                            }
                        }
                        return newState
                    } else {  // the new value is not in the list of values
                    
                        // Add the new value to the list of values.
                        newState[action.attr] = {
                            by: 'category',
                            value: filter.value.slice(0).concat(action.value)
                        }
                        return newState
                    }
                }
            }
            // The filter for the attr does not yet exist or it is not by
            // category, so add the new state.
            newState[action.attr] = {
                by: 'category',
                value: [action.value]
            }
            return newState
            
        // Change the value of a continuous filter using the same filterBy
        // if a continuous filter already exists.
        case 'shortEntry.filter.continuous':
            newState = clone(state)
            newState[action.attr] = {
                by: action.by,
                low: action.low,
                high: action.high,
            }
            return newState

        // Remove one attr's filter.
        case 'shortEntry.filter.drop':
            newState = clone(state)
            delete newState[action.attr]
            return newState

        // Remove all filters.
        case 'shortEntry.filter.dropAll':
            return {}

        // Load from persistent store.
        case 'shortEntry.filter.loadPersist':
            return action.loadPersist;
            
        default:
            return state;
        }
    },
    // The attr over which the shortlist entry context menu is displayed.
    'shortEntry.menu.attr': (state = null, action) => {
        if (action.type === 'shortEntry.menu.attr') {
            if (action.attr) {
                return action.attr
            } else {
                return null
            }
        } else {
            return state;
        }
    },
    'shortEntry.menu.filter': (state = {}, action) => {
        let newState
        switch (action.type) {
        case 'shortEntry.menu.filter.click':

            // If the newly clicked filter is the same as the previous,
            // uncheck the filter. Otherwise check the filter.
            newState = clone(state)
            if (action.attr in state && action.clicked === state[action.attr]) {
                delete newState[action.attr]
            } else {
                newState[action.attr] = action.clicked
            }
            return newState
        case 'shortEntry.menu.filter.loadPersist':
            return action.loadPersist;
        case 'shortEntry.menu.filter.select':
            if (!state[action.attr] || state[action.attr] !== action.select) {
                newState = clone(state)
                newState[action.attr] = action.select
                return newState
            } else {
                return state
            }
        case 'shortEntry.menu.filter.unselect':
            if (state[action.attr] && state[action.attr] === action.select) {
                newState = clone(state)
                delete newState[action.attr]
                return newState
            } else {
                return state
            }
        default:
            return state
        }
    },
    'shortEntry.menu.hideBgNodes': (state = false, action) => {
        if (action.type === 'shortEntry.menu.hideBgNodes') {
            return !state
        } else {
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
