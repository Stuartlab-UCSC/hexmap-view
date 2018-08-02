// shortlistInit.js
// Handle shortlist initialization.

import '/imports/lib/jquery-ui'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import colorMix from '/imports/mapPage/color/colorMix'
import Layer from '/imports/mapPage/longlist/Layer'
import rx from '/imports/common/rx'
import shortlist from '/imports/mapPage/shortlist/shortlist'
import ShortEntryMenu from '/imports/mapPage/shortlist/ShortEntryMenu'

let initialization_started = false

const addInitialEntriesToShortlist = layerNames => {

    // Add some initial entries to the shortlist.
    const listEl = document.querySelector('#shortlist')
    layerNames.forEach(layer_name => {
        const entryEl = shortlist.create_shortlist_ui_entry(layer_name)
        
        // No entryEl returned means the entry was already there.
        if (entryEl) {
            listEl.append(entryEl)
        }
    })
    colorMix.refreshColors()
}

const receivedInitialActiveLayers = () => {

    // The initial active layer values are now loaded.
    addInitialEntriesToShortlist(rx.get('shortlist'))
}

export const complete_initialization = () => {


    // Add the remainder of entries to the shortlist.
    const sList = rx.get('shortlist')

    function loadRemainderOfEntries () {
        addInitialEntriesToShortlist(sList)
        rx.subscribe(shortlist.attrNameListChange)

        setTimeout(function () {
            rx.set('snake.shortlist.hide')
        })
    }
 
    // Add the shortlist layer values to the global layers object.
    Layer.with_many(sList, loadRemainderOfEntries, rx.get('dynamicAttrs'))
}

export const init = () => {

    if (initialization_started) { return }
    
    initialization_started = true
    
    // Initialize the shortlist core.
    shortlist.init()
    
    // Add the active shortlist layer values to the global layers object.
    // We already have the data for these attrs.
    Layer.with_many(rx.get('activeAttrs'), receivedInitialActiveLayers,
        rx.get('dynamicAttrs'))
    
    const store = rx.getStore()
    render(
        <Provider store={store}>
            <ShortEntryMenu />
        </Provider>,
        document.getElementById('shortEntryMenuWrap')
    )
}
