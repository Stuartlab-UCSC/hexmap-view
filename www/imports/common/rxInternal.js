
// Redux implementation.

import redux from 'redux';
import rx from './rx.js';

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
    'shortEntry.bgNodes.visible': (state = true, action) => {
        return action.type === ('shortEntry.bgNodes.visible.toggle') ?
            !state : state;
    },
    'shortEntry.filter': (state = {}, action) => {
        
        // Make a full copy of filter state, excluding the current attr.
        function cloneStateExceptAttr () {
            let filteredState = _.filter(state, function (oneAttr) {
                return oneAttr.attr !== action.attr;
            });
            let newState = _.map(filteredState, function (oneAttr) {
                return _.clone(oneAttr);
            });
            return newState;
        }
        let newState = {}
        let filter = {}
        switch (action.type) {        
        
        // Update the filter by attr value.
        case 'shortEntry.filter.attr':
            newState = cloneStateExceptAttr();
            
            // If a value is already set and it is the same as the new
            // one, toggle to remove the filter.
            if (action.attr in state && 'value' in state[action.attr] &&
                state[action.attr].value === action.value) {
                return newState
            } else {
                
                // There is a new value, so change that.
                newState[action.attr] = {
                    by: 'attr',
                    value: action.value,
                }
                return newState
            }
            
        // Select all of the values in the category list.
        case 'shortEntry.filter.category.all':
            newState = cloneStateExceptAttr()
            newState[action.attr] = {
                by: 'category',
                values: action.values,
            }
            return newState
        
        // Unselect all of the values in the category list.
        case 'shortEntry.filter.category.none':
            filter = state[action.attr]
            if (filter && filter.by === 'category') {
                return cloneStateExceptAttr()
            }
            return state
        
        // Update the category values to be filtered by.
        case 'shortEntry.filter.category':
            newState = cloneStateExceptAttr();

            // If there is a filter for this attr in state...
            if (action.attr in state) {
                
                // If the filter is by category...
                let filter = state[action.attr]
                if (filter.by === 'category') {
                
                    // If the new value is in the list of values...
                    let index = filter.values.indexOf(action.value)
                    if (index > -1) {
                    
                        // If there are more values than this one.
                        if (filter.values.length > 1) {
                            
                            // Remove just this value from the list of values.
                            let newValues = filter.values.slice(0)
                            newValues.splice(index, 1)
                            newState[action.attr] = {
                                by: 'category',
                                values: newValues
                            }
                        }
                        return newState
                    } else {  // the new value is not in the list of values
                    
                        // Add the new value to the list of values.
                        newState[action.attr] = {
                            by: 'category',
                            values: filter.values.slice(0).concat(action.value)
                        }
                        return newState
                    }
                }
            }
            // The filter for the attr does not yet exist or it is not by
            // category, so add the new state.
            newState[action.attr] = {
                by: 'category',
                values: [action.value]
            }
            return newState
            
        // Remove the filter if there is one for this filter group.
        case 'shortEntry.filter.drop':
            if (action.attr) {
                return cloneStateExceptAttr();
            } else {
            
                // Otherwise, leave the existing state.
                return state;
            }
            
        // Update the filter to range values.
        case 'shortEntry.filter.range':
            newState = cloneStateExceptAttr();

            // If byRange is set, toggle to remove the byRange filter.
            if (action.attr in state && state[action.attr].by === 'range') {
                return newState;
            } else {
            
                // Replace the filter with this new one.
                newState[action.attr] = {
                    by: 'range',
                }
                return newState
            }
            
        // Update the filter to threshold values.
        case 'shortEntry.filter.threshold':
            newState = cloneStateExceptAttr();

            // If byThreshold is set, toggle to remove the byThreshold filter.
            if (action.attr in state && state[action.attr].by === 'threshold') {
                return newState;
            } else {
            
                // Replace the filter with this new one.
                newState[action.attr] = {
                    by: 'threshold',
                }
                return newState
            }
        default:
            return state;
        }
    },
    
    // The attr over which the shortlist entry context menu is hovering.
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
