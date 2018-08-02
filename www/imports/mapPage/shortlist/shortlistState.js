
// Handle state for the shortlist.
const deleteMany = (attrs, state) => {
    let newState = state.slice()
    attrs.forEach(attr => {
        let index = state.indexOf(attr)
        if (index > -1) {
            newState.splice(index, 1)
        }
    })
    return newState
}

const addOne = (attr, state, addToTop) => {
    let newState = state.slice()
    let index = state.indexOf(attr)
    if (index > -1) {
        newState.splice(index, 1)
    }
    if (addToTop) {
        newState.push(attr)
    } else {
        newState.unshift(attr)
    }
    return newState
}

const reducers = {
    'shortlist': (state = [], action) => {
        let index
        let newState
        switch (action.type) {
        case 'shortlist.addDynamic':
        case 'shortlist.addFromLongList':
            return addOne(action.attr, state)
        case 'shortlist.deleteAllByMenu':
            return []
        case 'shortlist.deleteByButton':
        case 'shortlist.deleteByMenu':
            return deleteMany([action.attr], state)
        case 'shortlist.deleteOverlayNodes':
            return deleteMany(action.attrs, state)
        case 'shortlist.initActives':
        case 'shortlist.initAll':
            return action.attrs
        case 'shortlist.initFirst':
            return [action.attr]
        case 'shortlist.loadPersist':
            return action.loadPersist
        case 'shortlist.moveToTop':
            newState = state.slice()
            index = state.indexOf(action.attr)
            newState.splice(index, 1)
            newState.unshift(action.attr)
            return newState
        default:
            return state
        }
    },
}

export function getReducers () {
    return reducers
}
