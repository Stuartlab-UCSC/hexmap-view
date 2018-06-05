
// Handle state for shortlist entries.
import { clone } from '/imports/common/utils'

const reducers = {
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
}

export function getReducers () {
    return reducers;
}
