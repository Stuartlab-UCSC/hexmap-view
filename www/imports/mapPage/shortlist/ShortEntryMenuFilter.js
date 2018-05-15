
// Logic and state for the filter items in the short list entry context menu.

import Colormap from '/imports/mapPage/color/Colormap';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import util from '/imports/common/util';

const selectAllNoneLimit = 2
const categoryCountLimit = 50
const selectAll = 'select all'
const selectNone = 'select none'
const tooManyCategories = 'too many categories to display'

const onContinuousValue = (attr, by, dispatch) => {

    // Handle an update to a range or threshold filter value.
    dispatch({
        type: 'shortEntry.filter.continuous',
        attr,
        by,
        value: shortlist.get_slider_range(attr)
    })
}

const onCategoryValueSelectAll = (attr, value, dispatch) => {

    // Set all categories.
    let count = Colormap.getCategoryCount(attr)
    dispatch({
        type: 'shortEntry.filter.category.all',
        attr,
        value: _.range(count),
    })

    // Select category in the main menu filter.
    dispatch({
        type: 'shortEntry.menu.filter.select',
        attr,
        select: 'category'
    })
}

const onCategoryValueSelectNone = (attr, value, dispatch) => {

    // Unselect any values.
    dispatch({
        type: 'shortEntry.filter.category.none',
        attr,
    })

    // Unselect category in the main menu filter.
    dispatch({
        type: 'shortEntry.menu.filter.unselect',
        attr,
        select: 'category'
    })
}

const onCategoryValueOne = (attr, value, dispatch) => {

    // Select the specific category.
    dispatch({
        type: 'shortEntry.filter.category',
        attr,
        value,
    })

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
        onCategoryValueSelectAll(attr, value, dispatch)
        break
    case selectNone:
        onCategoryValueSelectNone(attr, value, dispatch)
        break
    default:
        onCategoryValueOne(attr, value, dispatch)
    }
}

const onAttrValue = (attr, value, dispatch) => {

    // Upon click of an attribute on the attr filter submenu.
    // Toggle the click state on the attr clicked.
    dispatch({
        type: 'shortEntry.filter.attr',
        attr,
        value,
    })
    
    // Set the main menu filter checkmark depending on the toggle state of
    // the attr clicked.
    let attrFilter = rx.get('shortEntry.filter')[attr]
    if (attrFilter) {
        dispatch({
            type: 'shortEntry.menu.filter.select',
            attr,
            select: 'attr'
        })
    } else {
        dispatch({
            type: 'shortEntry.menu.filter.unselect',
            attr,
            select: 'attr'
        })
    }
}

export const getActive = (attrIn) => {

    // Return true if the attribute is actively coloring.
    var attr = attrIn
    if (!attr) {
        attr = rx.get('shortEntry.menu.attr')
    }
    return (rx.get('activeAttrs').indexOf(attr) > -1)
}

export const getDataType = (attrIn) => {

    // Get the data type of the attribute.
    var attr = attrIn
    if (!attr) {
        attr = rx.get('shortEntry.menu.attr')
    }
    if (attr) {
        return util.getDataType(attr)
    } else {
        return null
    }
}

export const getChecked = () => {

    // Get the filterChecked value in state.
    let attr = rx.get('shortEntry.menu.attr')
    if (getActive(attr)) {
        var checked = rx.get('shortEntry.menu.filter')[attr]
        return checked
    }
    return null
}

const getCategoryList = (attr) => {

    // Get the filter by category list in state.
    let list = Colormap.getCategoryStrings(attr)
    if (list.length < 1) {

        // With no category strings,
        // assume this is binary with no colormap
        list = [0, 1]
    } else if (list.length > categoryCountLimit) {
        list = [tooManyCategories]
    } else if (list.length > selectAllNoneLimit) {
        list.splice(0, 0, selectAll, selectNone)
    }
    return list
}

export const getLists = () => {

    // Get the lists for all of the filter groups.
    let attr = rx.get('shortEntry.menu.attr')
    let lists = {}
    
    // Only an active attribute has filter options on the menu.
    if (getActive(attr)) {
    
        // Get the filter by values determined by data type.
        let dataType = getDataType(attr)
        if (dataType === 'binary' || dataType === 'categorical') {
            lists.category = getCategoryList(attr)
        }
        
        // Get the filter by attrs list.
        let attrIds = Session.get('shortlist').filter(
            id => util.getDataType(id) === 'binary' && id !== attr)
        lists.attr = (_.isUndefined(attrIds)) ? [] : attrIds
    }
    return lists
}

export const getValues = () => {

    // Get the selected items in the filterBy list in state.
    let attr = rx.get('shortEntry.menu.attr')
    if (getActive(attr)) {
        let filter = rx.get('shortEntry.filter')[attr]
        if (filter) {
            switch (filter.by) {
            case 'category':
                
                // Return current categories selected in state.
                return filter.value.map(value => {
                    return Colormap.getCategoryString(attr, value)
                })
            case 'range':
            case 'threshold':
            case 'attr':
                return filter.value
            }
        }
    }
    return null
}

export const onMenu = (attr, clicked, dispatch) => {

    // This is a click on the main menu of a filter item.
    
    // Toggle that menu item off or on.
    dispatch({
        type: 'shortEntry.menu.filter.click',
        attr,
        clicked,
    })

    let selected = rx.get('shortEntry.menu.filter')[attr]
    if (selected === clicked) {
    
        // The menu option is now selected. Only range and threshold filters
        // can be turned on by a main menu click, so get the slider values.
        dispatch({
            type: 'shortEntry.filter.continuous',
            attr,
            by: clicked,
            value: shortlist.get_slider_range(attr),
        })
        
    } else {
    
        // The menu option is now unselected, so drop the filter values.
        dispatch({
            type: 'shortEntry.filter.drop',
            attr,
        })
    }
}

export const onValue = (ev, data, dispatch) => {
    let attr = shortlist.get_layer_name_from_child(ev.target)
    switch (data.by) {
    case 'attr':
        onAttrValue(attr, data.value, dispatch)
        break
    case 'category':
        onCategoryValue(attr, data.value, dispatch)
        break
    case 'range':
    case 'threshold':
        onContinuousValue(attr, data.by, dispatch)
        break
    case 'hideBgNodes':
        break
    case 'createFilterAttr':
        break
    }
}
