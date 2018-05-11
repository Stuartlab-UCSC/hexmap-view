
// Container logic and state for the short list entry context menu.

import { connect } from 'react-redux'

import Colormap from '/imports/mapPage/color/Colormap';
import colorMix from '/imports/mapPage/color/colorMix';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import util from '/imports/common/util';
import ShortEntryMenu from '/imports/mapPage/shortlist/ShortEntryMenu';

const selectAllNoneLimit = 5
const categoryCountLimit = 50
const selectAll = 'select all'
const selectNone = 'select none'
const tooManyCategories = 'too many categories to display'

const getActive = (attrIn) => {

    // Return true if the attribute is actively coloring.
    var attr = attrIn
    if (!attr) {
        attr = rx.get('shortEntry.menu.attr')
    }
    return (rx.get('activeAttrs').indexOf(attr) > -1)
}

const getDataType = (attrIn) => {

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

const getFilterBy = () => {

    // Get the filterBy group in state.
    let attr = rx.get('shortEntry.menu.attr')
    if (getActive(attr)) {
        let filter = rx.get('shortEntry.filter')
        if (filter && filter[attr]) {
            return filter[attr].by
        }
    }
    return null
}

const getFilterCategoryList = (attr) => {

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

const getFilterLists = () => {

    // Get the lists for all of the filter groups.
    let attr = rx.get('shortEntry.menu.attr')
    let lists = {}
    
    // Only an active attribute has filter options on the menu.
    if (getActive(attr)) {
    
        // Get the filter by values determined by data type.
        let dataType = getDataType(attr)
        if (dataType === 'binary' || dataType === 'categorical') {
            lists.category = getFilterCategoryList(attr)
        }
        
        // Get the filter by attrs list.
        let attrIds = Session.get('shortlist').filter(
            id => util.getDataType(id) === 'binary' && id !== attr)
        lists.attr = (_.isUndefined(attrIds)) ? [] : attrIds
    }
    return lists
}

const getFilterValues = () => {

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

const mapStateToProps = () => {

    // Map state to the shortEntryMenu properties.
    return {
        active: getActive(),
        dataType: getDataType(),
        filterBy: getFilterBy(),
        filterLists: getFilterLists(),
        filterValues: getFilterValues(),
    }
}

const onFilterRange = (attr, value, dispatch) => {
}

const onFilterThreshold = (attr, value, dispatch) => {
}

const onFilterCategory = (attr, value, dispatch) => {

    // Handle a click on a category list item.
    value = Colormap.getCategoryIndex(attr, value)
    let filter = rx.get('shortEntry.filter')[attr]

    // If the item is selectAll...
    if (value === selectAll) {
    
        // If the current filter is by category & the value not selectAll,
        // update state.
        let update = false;
        let count = Colormap.getCategoryCount(attr)
        if (filter && filter.by === 'category') {
            if (filter.value.length !== count) {
                update = true
            }
        } else {
            // The current filter is not set or not by category, so update.
            update = true
        }
        if (update) {
        
            // Set the filter to all categories for this attribute.
            dispatch({
                type: 'shortEntry.filter.category.all',
                attr,
                value: _.range(count),
            })
            colorMix.refreshColors()
        }
        console.log('state:', rx.get('shortEntry.filter'))

    // If the item is selectNone...
    } else if (value === selectNone) {
    
        // If the current filter is by category, remove the filter.
        if (filter && filter.by === 'category') {
            dispatch({
                type: 'shortEntry.filter.category.none',
                attr,
            })
            colorMix.refreshColors()
        }

    } else {

        // If there is no index, we'll assume this has no colormap,
        // and pass the value directly.
        dispatch({
            type: 'shortEntry.filter.category',
            attr,
            value,
        })
        colorMix.refreshColors()
    }
}

const onFilterAttr = (attr, value, dispatch) => {
    dispatch({
        type: 'shortEntry.filter.attr',
        attr,
        value,
    }),
    colorMix.refreshColors()
}

const mapDispatchToProps = (dispatch) => {

    // Map the event handlers to the shortEntryMenu properties.
    return {
        onTrigger: ev => {
            dispatch({
                type: 'shortEntry.menu.attr',
                attr: shortlist.get_layer_name_from_child(ev.target)
            })
        },
        onMain: (ev, data) => {
            let attr = undefined
            let state = undefined
            switch (data.id) {
            case 'setOperation':
                break
            case 'correlationSort':
                break
            case 'reflection':
                break
            case 'editColors':
                break
            case 'download':
                break
            default:
            
                // This is a filter menu item.
                attr = shortlist.get_layer_name_from_child(ev.target)
                state = rx.get('shortEntry.filter')[attr]
                
                // If there is a filter by this, remove it.
                if (state && data.by === state.by) {
                    dispatch({
                        type: 'shortEntry.filter.drop',
                        attr: attr,
                    })
                    colorMix.refreshColors();
                }
            }
        },
        onFilter: (ev, data) => {
            let attr = shortlist.get_layer_name_from_child(ev.target)
            let value = data.value

            switch (data.by) {
            case 'range':
                onFilterRange(attr, value, dispatch)
                break
            case 'threshold':
                onFilterThreshold(attr, value, dispatch)
                break
            case 'category':
                onFilterCategory(attr, value, dispatch)
                break
            case 'attr':
                onFilterAttr(attr, value, dispatch)
                break
            case 'hideBgNodes':
                break
            case 'createFilterAttr':
                break
            }
        },
    }
}

// Connect the value props and eventHandler props
// to the presentational component: ShortEntryMenu.
const ShortEntryMenuCont = connect(
    mapStateToProps,
    mapDispatchToProps
)(ShortEntryMenu)

export default ShortEntryMenuCont;
