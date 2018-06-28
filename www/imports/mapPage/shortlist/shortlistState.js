
// Handle state for the shortlist.
const reducers = {
    'shortlist': (state = [], action) => {
        return (action.type === 'shortlist.ids') ? action.ids : state;
    },
}

export function getReducers () {
    return reducers;
}
