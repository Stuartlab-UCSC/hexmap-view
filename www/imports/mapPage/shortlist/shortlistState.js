
// Handle state for the shortlist.
const reducers = {
    'shortlist': (state = [], action) => {
        let index
        let newState
        switch (action.type) {
        case 'shortlist.add':
            newState = state.slice()
            index = state.indexOf(action.attr)
            if (index > -1) {
                newState.splice(index, 1)
            }
            newState.unshift(action.attr)
            return newState
        case 'shortlist.delete':
            newState = state.slice()
            
            index = state.indexOf(action.attr)
            if (index > -1) {
                newState.splice(index, 1)
            }
            return newState
        case 'shortlist.initActives':
            return action.attrs
        case 'shortlist.initAll':
            return action.attrs
        case 'shortlist.initFirst':
            return [action.attr]
        case 'shortlist.loadPersist':
            return action.loadPersist
        default:
            return state
        }
    },
}

export function getReducers () {
    return reducers
}
