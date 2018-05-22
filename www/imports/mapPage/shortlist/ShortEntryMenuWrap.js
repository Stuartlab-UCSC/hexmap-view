
// Container logic and state for the short list entry context menu.

import { connect } from 'react-redux'

import rx from '/imports/common/rx'
import shortlist from '/imports/mapPage/shortlist/shortlist'
import ShortEntryMenu from '/imports/mapPage/shortlist/ShortEntryMenu'
import ShortEntryMenuFilter
    from '/imports/mapPage/shortlist/ShortEntryMenuFilter'
import tool from '/imports/mapPage/head/tool'
import util from '/imports/common/util'

const getCapability = () => {
    let attr = rx.get('shortEntry.menu.attr')
    if (!(attr)) {
        return []
    }
    
    // Initialize capability to those that all attrs have all the time.
    let capability = ['correlationSort', 'editColors', 'download']
    
    // Capability due to having a filter.
    let filter = rx.get('shortEntry.filter')[attr]
    if (filter) {
        capability.push('hideBgNodes', 'createFilterAttr')
    }
    
    // Add capabilities based on dataType.
    switch (util.getDataType(attr)) {
    case 'binary':
        capability.push('category', 'setOperation')
        if (Session.equals('reflectCriteria', true)) {
            capability.push('reflection')
        }
        break
    case 'categorical':
        capability.push('category', 'setOperation')
        break
    case 'continuous':
        capability.push('range', 'threshold')
        break
    }
    return capability
}

const mapStateToProps = () => {

    // Map state to the shortEntryMenu properties.
    return {
        capability: getCapability(),
        filterChecked: ShortEntryMenuFilter.getChecked(),
        filterList: ShortEntryMenuFilter.getList(),
        filterValues: ShortEntryMenuFilter.getValues(),
        anyFilters: ShortEntryMenuFilter.getAnyFilters(),
    }
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
        onMainMenu: (ev, data) => {
            let attr = shortlist.get_layer_name_from_child(ev.target)
            switch (data.id) {
            case 'category':
            case 'range':
            case 'threshold':
            case 'createFilterAttr':
                ShortEntryMenuFilter.onMenu(attr, data.id, dispatch)
                break
            case 'hideBgNodes': // TODO
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
            }
        },
        onFilterValue: (ev, data) => {
            ShortEntryMenuFilter.onValue(ev, data, dispatch)
        },
    }
}

// Connect the value props and eventHandler props
// to the presentational component: ShortEntryMenu.
const ShortEntryMenuWrap = connect(
    mapStateToProps,
    mapDispatchToProps
)(ShortEntryMenu)

export default ShortEntryMenuWrap;
