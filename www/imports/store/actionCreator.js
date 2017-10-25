
// Redux action creators.

import Action from './action.js';

// Helper to create an action.
function makeActionCreator(type, ...argNames) {
    return function (...args) {
        let action = { type };
        argNames.forEach((arg, index) => {
            action[argNames[index]] = args[index];
        });
        return action;
    };
}

// Create all actions.
export const initCtxLoaded = makeActionCreator(Action.INIT_CTX_LOADED);
export const initDomLoaded = makeActionCreator(Action.INIT_DOM_LOADED);
export const initStateLoaded = makeActionCreator(Action.INIT_STATE_LOADED);
export const initLayerSummaryLoaded =
    makeActionCreator(Action.INIT_LAYER_SUMMARY_LOADED);
export const initLayerTypesLoaded =
    makeActionCreator(Action.INIT_LAYER_TYPES_LOADED);
