
// Redux action creators.

import rxAction from './rxAction.js';

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
/* eslint-disable */ // eslint does not like that these vars are 'never used'
const initAppActiveAttrsInList =
    makeAction(RxActin.INIT_APP_ACTIVE_ATTRS_IN_SHORTLIST);
const initAppCtxLoaded = makeActionCreator(rxAction.INIT_APP_CTX_LOADED);
const initAppDomLoaded = makeActionCreator(rxAction.INIT_APP_DOM_LOADED);
const initAppGoogleMapApiLoaded =
    makeAction(rxAction.INIT_APP_GOOGLE_MAP_API_LOADED);
const initAppLayoutNamesReceived =
    makeActionCreator(rxAction.INIT_APP_LAYOUT_NAMES_RECEIVED);
const initAppLayoutNamesRequested =
    makeActionCreator(rxAction.INIT_APP_LAYOUT_NAMES_REQUESTED);
const initAppLayoutsPopulated =
    makeActionCreator(rxAction.INIT_APP_LAYOUTS_POPULATED);
const initAppMapPrepared = makeActionCreator(rxAction.INIT_APP_MAP_PREPARED);
const initAppMapRendered = makeActionCreator(rxAction.INIT_APP_MAP_RENDERED);
const initAppStateLoaded = makeActionCreator(rxAction.INIT_APP_STATE_LOADED);
const initLayoutPositionsLoaded = makeActionCreator(rxAction.INIT_LAYOUT_POSITIONS_LOADED);
const initMapActiveAttrsLoaded =
    makeActionCreator(rxAction.INIT_MAP_ACTIVE_ATTRS_LOADED);
const initMapAuthorized = makeActionCreator(rxAction.INIT_MAP_AUTHORIZED);
const initMapColormapLoaded = makeActionCreator(rxAction.INIT_MAP_COLORMAP_LOADED);
const initMapLayerSummaryLoaded =
    makeActionCreator(rxAction.INIT_MAP_LAYER_SUMMARY_LOADED);
const initMapLayerTypesLoaded = makeActionCreator(rxAction.INIT_MAP_LAYER_TYPES_LOADED);
/* eslint-enable */
