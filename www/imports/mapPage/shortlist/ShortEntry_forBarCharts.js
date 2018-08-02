
// Logic and state for the short list entry.

import { connect } from 'react-redux'
import PropTypes from 'prop-types';

import BarChart from '/imports/mapPage/shortlist/BarChart'
import Metadata from '/imports/mapPage/shortlist/Metadata'
import ShortEntryPres from '/imports/mapPage/shortlist/ShortEntryPres'
import shortlist from '/imports/mapPage/shortlist/shortlist'
import util from '/imports/common/util'

let entry = {} // contains one object per shortlist entry

const getCapability = (state) => {
    let attrId = state['shortEntry.createId']
    if (!attrId) {
        return []
    }
    
    // Initialize capability to those that all attrs have.
    let able = ['metadata']
    
    // Bar chart.
    if (util.is_continuous(attrId)) {
        able.push('histogram')
    } else {
        able.push('barChart')
    }

    // TODO
    //if (state['shortEntry.filter'][attrId]) {
        able.push('filtering')
    //}

    return able
}

const getDynamic = (state) => {

    // Get the flag for a dynamic attr.
    let attr = state['shortEntry.createId']
    return (layers[attr].dynamic) ? 'dynamic' : null
}

const floatControls = (state) => {

    // Get the float controls displayed on hover
    return state['shortEntry.floatControls']
}

const getId = (state) => {

    // Get the current attr ID.
    // TODO we need more than one of these.
    return state['shortEntry.createId']
}

const getHigh = (state) => {

    // Get the current high slider value.
    return 5
}

const getLow = (state) => {

    // Get the current low slider value.
    return 1
}

const getMetadata = (state) => {
    
    // Get the metadata.
    return Metadata.get(state['shortEntry.createId'])
}

const getRange = (state) => {

    // Get the min & max values for a continuous attr.
    return [1,5]
}

const getZero = (state) => {

    // Get flag to show the zero tickmark.
    return false
}

const mapStateToProps = (state) => {

    // Map state to the properties.
    let attrId = state['shortEntry.createId']
    if (!Object.keys(entry).includes(attrId)) {
        entry[attrId] = {}
    }
    console.log('mapStateToProps:attrId:', attrId)
    return {
        able: getCapability(state),
        dynamic: getDynamic(state),
        floatControls: floatControls(state),
        high: getHigh(state),
        id: getId(state),
        low: getLow(state),
        metadata: getMetadata(state),
        range: getRange(state),
        zero: getZero(state),
    }
}
//able, barChartData, dynamic, floatControl, high, id,
//    low, metadata, range, zero, onMouseEnter, onMouseLeave
const mapDispatchToProps = (dispatch) => {

    // Map the event handlers to the properties.
    return {
    
        // Handle the mouse entering a shortlist entry.
        onMouseEnter: ev => {
            // TODO
            //root.prepend($float_controls);
            //hover_layer_name.set(layer_name);
            dispatch({
                type: 'shortEntry.hover.mouseEnter',
                id: shortlist.get_layer_name_from_child(ev.target),
            })
        },
    
        // Handle the mouse leaving a shortlist entry.
        onMouseLeave: ev => {
            // TODO
            //hover_layer_name.set('');
            //$('#shortlist .dynamic_controls').append($float_controls);
            dispatch({
                type: 'shortEntry.hover.mouseLeave',
            })
        },
    }
}

// Connect the value props and eventHandler props
// to the presentational component.
const ShortEntry = connect(
    mapStateToProps,
    mapDispatchToProps
)(ShortEntryPres)
/*
const ShortEntryPres = ({ able, dynamic, floatControl, high, id,
    low, metadata, range, zero, onMouseEnter, onMouseLeave }) => (
*/

ShortEntry.propTypes = {
    attrId: PropTypes.string,
}

export default ShortEntry;
