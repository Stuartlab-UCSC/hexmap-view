
// Logic and state for the filter items in the short list entry context menu.

import '/imports/lib/color'; // source of 'Color' object
import Colormap from '/imports/mapPage/color/Colormap'
import colorMix from '/imports/mapPage/color/colorMix'
import Layer from '/imports/mapPage/longlist/Layer'
import rx from '/imports/common/rx'
import shortlist from '/imports/mapPage/shortlist/shortlist'
import util from '/imports/common/util'

const selectAllNoneLimit = 7
const selectAll = 'select all'
const selectNone = 'select none'
const tooManyCatsLimit = 300
const tooManyCats =  'too many categories to display, >' + tooManyCatsLimit

const updateColors = (attr, prev) => {

    // Update the colors if the new filter is not the same as the previous.
    let changed = false
    let next = rx.get('shortEntry.filter')[attr]
    
    // If both do not exist...
    if (!prev && !next) {
        // no change
        
    // If both exist and have the same filterBy, compare the filter values.
    } else if (prev && next &&
        prev.by === next.by) {
        if (prev.by === 'category') {
            prev.value.sort((a,b) => {a - b})
            next.value.sort((a,b) => {a - b})
            if (prev.value.length === next.value.length) {
                let i = 0
                while (i < prev.value.length) {
                    if (prev.value[i] !== next.value[i]) {
                        changed = true
                        break
                    }
                    i++
                }
            } else {
                changed = true
            }
        } else {  // range or threshold
            if (prev.low !== next.low || prev.high !== next.high) {
                changed = true
            }
        }
    } else {
        changed = true
    }
    if (changed) {
        colorMix.refreshColors()
    }
}

const onCreateFilterAttr = () => {

    // Clicking on the save button creates a dynamic attr using all
    // of the current filters to select nodes.
    shortlist.with_filtered_signatures(function(nodeIds) {
    
        // Suggest a name for this new attr.
        var name = 'with filters';
        
        // Create the dynamic attr.
        Layer.create_dynamic_selection(nodeIds, name);
    })
}

const onCategoryValueAll = (attr, value, dispatch) => {

    // Set all categories.
    let count = Colormap.getCategoryCount(attr)
    let prev = rx.get('shortEntry.filter')[attr]
    dispatch({
        type: 'shortEntry.filter.category.all',
        attr,
        value: _.range(count),
    })
    updateColors(attr, prev)

    // Select category in the main menu filter.
    dispatch({
        type: 'shortEntry.menu.filter.select',
        attr,
        select: 'category'
    })
}

const onCategoryValueNone = (attr, value, dispatch) => {

    // Unselect any values.
    let prev = rx.get('shortEntry.filter')[attr]
    dispatch({
        type: 'shortEntry.filter.drop',
        attr,
    })
    updateColors(attr, prev)
    
    // Unselect category in the main menu filter.
    dispatch({
        type: 'shortEntry.menu.filter.unselect',
        attr,
        select: 'category'
    })
}

const onCategoryValueOne = (attr, value, dispatch) => {
    // Select/unselect the specific category.
    let prev = rx.get('shortEntry.filter')[attr]
    dispatch({
        type: 'shortEntry.filter.category',
        attr,
        value,
    })
    updateColors(attr, prev)

    // Set the main menu filter checkmark depending on whether any
    // categories are selected.
    let attrFilter = rx.get('shortEntry.filter')[attr]
    if (attrFilter && attrFilter.by === 'category') {
        dispatch({
            type: 'shortEntry.menu.filter.select',
            attr,
            select: 'category'
        })
    } else {
        dispatch({
            type: 'shortEntry.menu.filter.unselect',
            attr,
            select: 'category'
        })
    }
}

const onCategoryValue = (attr, value, dispatch) => {

    // Handle a click on a category list item.
    value = Colormap.getCategoryIndex(attr, value)

    switch (value) {
    case selectAll:
        onCategoryValueAll(attr, value, dispatch)
        break
    case selectNone:
        onCategoryValueNone(attr, value, dispatch)
        break
    default:
        onCategoryValueOne(attr, value, dispatch)
    }
}

export const getChecked = (state) => {

    // Get the menu filter checked in state.
    let attr = state['shortEntry.menu.attr']
    if (attr) {
        let checked = state['shortEntry.menu.filter'][attr]
        return checked
    }
    return null
}

const getCategoryList = (attr) => {

    // Get the filter by category list in state.
    let list = Colormap.getOne(attr)
    let white = Color([255,255,255])
    if (list.length < 1) {

        // With no category strings,
        // assume this is binary with no colormap
        list = [
            { name: 0, color: Colormap.defaultBinaryOff() },
            { name: 1, color: Colormap.defaultBinaryOn() },
        ]
    } else if (list.length > tooManyCatsLimit) {
        list = [
            { name: tooManyCats, color: white },
        ]
    } else if (list.length > selectAllNoneLimit) {
        list.splice(0, 0,
            { name: selectAll, color: white },
            { name: selectNone, color: white }
        )
    }
    return list
}

export const getList = (state) => {

    // Get the list of values for a binary or categorical attr.
    let attr = state['shortEntry.menu.attr']
    let list = []
    
    // Only an active attribute has filter options on the menu.
    if (attr) {
    
        // Get the filter by values determined by data type.
        let dataType = util.getDataType(attr)
        if (dataType === 'binary' || dataType === 'categorical') {
            list = getCategoryList(attr)
        }
    }
    return list
}

export const getValues = (state) => {

    // Get the selected items in the filterBy list in state.
    let attr = state['shortEntry.menu.attr']
    if (attr) {
        let filter = state['shortEntry.filter'][attr]
        if (filter) {
            switch (filter.by) {
            case 'category':
                
                // Return current categories selected in state.
                return filter.value.map(value => {
                    return Colormap.getCategoryString(attr, value)
                })
            case 'range':
            case 'threshold':
                return [filter.low, filter.high]
            }
        }
    }
    return null
}

export const onContinuousValue = (attr, lowIn, highIn) => {

    // Handle an update to a range or threshold filter value.
    // This only comes in from a slider value move event
    let low = lowIn
    let high = highIn
    let prev = rx.get('shortEntry.filter')[attr]
    
    // If low and high are not provided, get them from the slider.
    if (!low) {
        let lowHigh = shortlist.get_slider_range(attr)
        low = lowHigh[0]
        high = lowHigh[1]
    }
   
    // If the new values are the same as the layer's min & max,
    // remove the filter. Except if this from a main menu click rather than
    // a slider movement, don't drop the filte
    if (lowIn &&
        low === layers[attr].minimum && high === layers[attr].maximum) {
        rx.set('shortEntry.filter.drop', {attr})
    } else {
        rx.set('shortEntry.filter.continuous', {
            attr,
            by: rx.get('shortEntry.menu.filter')[attr],
            low,
            high,
        })
    }
    updateColors(attr, prev)
}

export const onMenu = (attr, clicked, dispatch) => {

    // This is a click on the main menu of a filter item.
    let next
    switch (clicked) {
    case 'hideBgNodes':
        dispatch({ type: 'shortEntry.menu.hideBgNodes' })
        colorMix.refreshColors()
        break
    case 'createFilterAttr':
        onCreateFilterAttr()
        break
    case 'deleteAllFilters':
        rx.set('shortEntry.filter.dropAll')
        colorMix.refreshColors()
        break
    default:
    
        // Toggle the menu item.
        dispatch({
            type: 'shortEntry.menu.filter.click',
            attr,
            clicked,
        })
        next = rx.get('shortEntry.menu.filter')[attr]
    
        // Only continuous values get to here.
        if (next === clicked) {
            let highMask = document.querySelector(
                '.shortlist_entry[data-layer="' + attr + '"] .high_mask')
            if (clicked === 'threshold') {
                highMask.classList.add('threshold')
            } else {
                highMask.classList.remove('threshold')
            }
            onContinuousValue(attr)

        } else { // unselected, so drop any filter.
            let prev = rx.get('shortEntry.filter')[attr]
            dispatch({
                type: 'shortEntry.filter.drop',
                attr,
            })
            updateColors(attr, prev)
        }
    }
}

export const onValue = (ev, data, dispatch) => {
    let attr = shortlist.get_layer_name_from_child(ev.target)
    switch (data.by) {
    case 'category':
        onCategoryValue(attr, data.value, dispatch)
        break
    }
}
