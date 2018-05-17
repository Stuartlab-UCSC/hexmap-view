
// Container logic and state for the short list entry context menu.

import { connect } from 'react-redux'

import shortlist from '/imports/mapPage/shortlist/shortlist';
import ShortEntryMenu from '/imports/mapPage/shortlist/ShortEntryMenu';
import ShortEntryMenuFilter
    from '/imports/mapPage/shortlist/ShortEntryMenuFilter';

const mapStateToProps = () => {

    // Map state to the shortEntryMenu properties.
    return {
        dataType: ShortEntryMenuFilter.getDataType(),
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
            case 'hideBgNodes':
                break
            case 'createAttr':
                break
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
