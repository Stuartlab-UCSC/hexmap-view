
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

const onContinuousAdd = (attr, by, dispatch) => {
    
    // Handle a click on range or threshold filter on main menu when the
    // filter for continuous does not yet exist.
    dispatch({
        type: 'shortEntry.filter.continuous.add',
        by,
        value: shortlist.get_slider_range(attr),
    })
}

const onValueContinuous = (attr, value, dispatch) => {

    // Handle an update to a range or threshold filter value.
    // Check to see if the values changed here rather than in redux
    // so we don't have any unnecessary redraws.
    // Note values are passed when the state is updated by the slider sliding,
    // and not passed when the context menu items is clicked
    let update = true
    let filter = rx.get('shortEntry.filter')[attr]
    if (filter) {
        var curVals = filter.value;
        if (curVals[0] === value[0] && curVals[1] === value[1]) {
            
            // Nothing to do here with no change in values.
            update = false
        }
    }
    if (update) {
        dispatch({
            type: 'shortEntry.filter.continuous.value',
            attr,
            value,
        })
    }
}

const onValueCategorySelectAll = (attr, value, dispatch) => {

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

const onValueCategorySelectNone = (attr, value, dispatch) => {

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

const onValueCategoryOne = (attr, value, dispatch) => {

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

const onValueCategory = (attr, value, dispatch) => {

    // Handle a click on a category list item.
    value = Colormap.getCategoryIndex(attr, value)

    switch (value) {
    case selectAll:
        onValueCategorySelectAll(attr, value, dispatch)
        break
    case selectNone:
        onValueCategorySelectNone(attr, value, dispatch)
        break
    default:
        onValueCategoryOne(attr, value, dispatch)
    }
}

const onValueAttr = (attr, value, dispatch) => {

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
    
    // If one of 'attr' or 'category' was clicked it means the current
    // checkmark is on that menu item, so drop the filter values.
    if (clicked === 'attr' || clicked === 'category') {
        dispatch({
            type: 'shortEntry.filter.drop',
            attr,
        })
    }

    // Toggle that menu item off or on.
    dispatch({
        type: 'shortEntry.menu.filter.click',
        attr,
        clicked,
    })
}

export const onValue = (ev, data, dispatch) => {
    let attr = shortlist.get_layer_name_from_child(ev.target)
    let value = data.value
    switch (data.by) {
    case 'attr':
        onValueAttr(attr, value, dispatch)
        break
    case 'category':
        onValueCategory(attr, value, dispatch)
        break
    case 'continuous':
        onValueContinuous(attr, value, dispatch)
        break
    case 'hideBgNodes':
        break
    case 'createFilterAttr':
        break
    }
}
