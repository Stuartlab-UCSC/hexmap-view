
// Logic and state for the short list entry context menu.

import { connect } from 'react-redux'

import attrAdd from '/imports/mapPage/shortlist/attrAdd'
import rx from '/imports/common/rx'
import select from '/imports/mapPage/shortlist/select'
import shortlist from '/imports/mapPage/shortlist/shortlist'
import ShortEntryMenuPres from '/imports/mapPage/shortlist/ShortEntryMenuPres'
import ShortEntryMenuFilter
    from '/imports/mapPage/shortlist/ShortEntryMenuFilter'
import tool from '/imports/mapPage/head/tool'
import util from '/imports/common/util'

const getCapability = (state) => {
    let attr = state['shortEntry.menu.attr']
    if (!(attr)) {
        return []
    }
    
    // Initialize capability to those that all attrs have all the time.
    let able = ['correlationSort', 'editColors', 'download', 'addAttr',
        'select', 'byRectangle', 'byPolygon', 'byNodeId', 'deleteAttr',
        'deleteAllAttrs']
    
    // Capability due to more than one entry and not this entry.
    let sList = state['shortlist']
    if (sList.length && sList[0] !== attr) {
        able.push('moveToTop')
    }
    
    // Capability due to hide or show of filters
    // TODO always show to have an effect even when no filters?
    able.push((state['shortEntry.menu.hideBgNodes']) ?
        'hideBgNodes' : 'showBgNodes')

    // Show only when any filters exist.
    if (Object.keys(rx.get('shortEntry.filter')).length) {
        able.push('createFilterAttr')
        able.push('clearAllFilters')
    }

    /*
    let filters = state'shortEntry.filter']
    let filtersLength = filters.length
    let thresholdFiltersLength = (_.filter(filters, (filter) => {
        return filter.by === 'threshold'
    })).length
    console.log('thresholdFiltersLength', thresholdFiltersLength)
    
    // Only consider when there are filters other than 'threshold'.
    if (filtersLength > 0 && filtersLength > thresholdFiltersLength) {
        let filter = filters[attr]
        
        // If this is the only filter and it
        if ((filter && filter.by !== 'threshold') || thresholdFiltersLength > 1) {
            able.push('createFilterAttr')
        }
    }
    */
    
    // Capabilities based on dataType.
    switch (util.getDataType(attr)) {
    case 'binary':
        able.push('category', 'setOperation')
        if (Session.equals('reflectCriteria', true)) {
            able.push('reflection')
        }
        break
    case 'categorical':
        able.push('category', 'setOperation')
        break
    case 'continuous':
        able.push('range', 'threshold')
        break
    }
    return able
}

const mapStateToProps = (state) => {

    // Map state to the properties.
    return {
        able: getCapability(state),
        filterChecked: ShortEntryMenuFilter.getChecked(state),
        filterList: ShortEntryMenuFilter.getList(state),
        filterValues: ShortEntryMenuFilter.getValues(state),
    }
}

const mapDispatchToProps = (dispatch) => {

    // Map the event handlers to the properties.
    return {
        onTrigger: ev => {
            dispatch({
                type: 'shortEntry.menu.attr',
                attr: shortlist.get_layer_name_from_child(ev.target)
            })
        },
        onMainMenu: (ev, data) => {
            let attr = shortlist.get_layer_name_from_child(ev.target)
            switch (data.id) {
            case 'moveToTop':
                dispatch({
                    type: 'shortlist.moveToTop',
                    attr,
                })
                break
            case 'category':
            case 'range':
            case 'threshold':
            case 'hideBgNodes':
            case 'createFilterAttr':
            case 'clearAllFilters':
                ShortEntryMenuFilter.onMenu(attr, data.id, dispatch)
                break
            case 'setOperation':
                tool.getCallback('setOperations')()
                break
            case 'correlationSort':
                tool.getCallback('statsSort')()
                break
            case 'reflection':
                tool.getCallback('reflectTrigger')()
                break
            case 'editColors':
                tool.getCallback('colormap')()
                break
            case 'download':
                tool.getCallback('hexagonNames')()
                break
            case 'byRectangle':
                select.byRectangle()
                break
            case 'byPolygon':
                select.byPolygon()
                break
            case 'byNodeId':
                select.byNodeId()
                break
            case 'addAttr':
                attrAdd.create();
                break
            case 'deleteAttr':
                dispatch({
                    type: 'shortlist.deleteByMenu',
                    attr,
                })
                break
            case 'deleteAllAttrs':
                dispatch({
                    type: 'shortlist.deleteAllByMenu',
                    attr,
                })
                break
            }
        },
        onFilterValue: (ev, data) => {
            ShortEntryMenuFilter.onValue(ev, data, dispatch)
        },
    }
}

// Connect the value props and eventHandler props
// to the presentational component.
const ShortEntryMenu = connect(
    mapStateToProps,
    mapDispatchToProps
)(ShortEntryMenuPres)

export default ShortEntryMenu;
