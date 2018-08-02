// shortlistInit.js
// Handle shortlist initialization.

import '/imports/lib/jquery-ui';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'

import colorMix from '/imports/mapPage/color/colorMix';
import Layer from '/imports/mapPage/longlist/Layer';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import ShortEntryMenu from '/imports/mapPage/shortlist/ShortEntryMenu';

let initialization_started = false;

function addInitialEntriesToShortlist (layerNames) {

    // Add some initial entries to the shortlist.
    let $shortlist = $('#shortlist');
    _.each(layerNames, function (layer_name) {
        $shortlist.append(shortlist.create_shortlist_ui_entry(layer_name));
    });
    colorMix.refreshColors()
}

function receivedInitialActiveLayers () {

    // The initial active layer values are now loaded.
    addInitialEntriesToShortlist(rx.get('shortlist'));
}

exports.complete_initialization = function () {


    // Add the remainder of entries to the shortlist.
    let sList = rx.get('shortlist')

    function loadRemainderOfEntries () {
        addInitialEntriesToShortlist(sList);
        rx.subscribe(shortlist.attrNameListChange)

        setTimeout(function () {
            rx.set('snake.shortlist.hide');
        });
    }
 
    // Add the shortlist layer values to the global layers object.
    Layer.with_many(sList, loadRemainderOfEntries, rx.get('dynamicAttrs'));
}

exports.init = function () {

    if (initialization_started) { return; }
    
    initialization_started = true;
    
    // Initialize the shortlist core.
    shortlist.init()
    
    // Add the active shortlist layer values to the global layers object.
    // We already have the data for these attrs.
    Layer.with_many(rx.get('activeAttrs'), receivedInitialActiveLayers,
        rx.get('dynamicAttrs'));
    
    const store = rx.getStore();
    render(
        <Provider store={store}>
            <ShortEntryMenu />
        </Provider>,
        document.getElementById('shortEntryMenuWrap')
    )
}
