// Presentational component for the short list entry.

import React from 'react';
import PropTypes from 'prop-types';
//import Slider, { Range } from 'rc-slider';
// We can just import Slider or Range to reduce bundle size
// import Slider from 'rc-slider/lib/Slider';
// import Range from 'rc-slider/lib/Range';
//import 'rc-slider/assets/index.css';

import BarChart from '/imports/mapPage/shortlist/BarChart'
import Icon, { icons } from '/imports/component/Icon'
import './shortEntry.css';


const filterIcon = (able) => {

    // Render the filter icon.
    if (able.indexOf('filtering') < 0) {
        return null
    }
    let widget =
        <Icon
            icon = 'filter'
            title = "Map is being filtered by this attribute's values"
            className = 'hot filter circle'
        />
    return widget;
}

const renderMetadata = (able, metadata) => {

    // Render the metadata.
    if (able.indexOf('metadata') < 0) {
        return null
    }
    // TODO remove extra classes
    let widget =
        <table
            className = 'layer-metadata'
        >
            <tbody>
                { metadata.map((row, i) =>
                    <tr key = { i }
                    >
                        <td className = 'rightAlign'
                        >
                            { row[0] + ':' }
                        </td>
                        <td>
                            { row[1] }
                        </td>
                    </tr>
                )}
            </tbody>
        </table>

    return widget
}

const barChart = (able) => {

    // Render a bar chart for discrete values.
    if (!able.includes('barChart')) {
        return null
    }
    let widget = <BarChart />
    return widget
}

const histogram = (able) => {

    // Render a histogram for continuous values.
    if (!able.includes('historgram')) {
        return null
    }
    let widget = <Histogram />
    return widget
}

const zeroTick = (able) => {

    // Render the zero tickmark.
    if (able.indexOf('zeroTick') < 0) {
        return null
    }
    let widget =
        <div
            className = 'zero_tick'
        >
        </div>

    return widget
}

const zero = (able) => {

    // Render the zero.
    if (able.indexOf('zero') < 0) {
        return null
    }
    let widget =
        <div
            className = 'zero'
        >
            0
        </div>

    return widget
}

const rangeValues = (able, low, high) => {

    // Render the range values for a continuous attr.
    if (able.indexOf('rangeValues') < 0) {
        return null
    }
    let widget =
        <div
            className = 'range_values'
        >
            { zeroTick(able) }
            { zero(able) }
            <div>
                <div
                    className = 'range_low'
                >
                    { low }
                </div>
                <div
                    className = 'range_high'
                >
                    { high }
                </div>
            </div>
        </div>

    return widget;
}

const filterContents = (able, range) => {

    // Render the filter content.
    if (able.indexOf('filterContents') < 0) {
        return null
    }
    let widget =
        <div
            className = 'filter_contents'
        >
            <div
                className = 'range_slider'
                value = { range }
                data = {{ layer: 'TODO' }}
            >
                <div
                    className = 'low_mask mask'
                >
                </div>
                <div
                    className = 'high_mask mask'
                    >
                    </div>
            </div>
        </div>

    return widget;
}

const ShortEntryPres = ({ able, dynamic, floatControl, high, id,
    low, metadata, range, zero, onMouseEnter, onMouseLeave }) => (

    <div
        className = { 'shortEntryRoot layer-entry ' + dynamic }
        data = {{ layer: id }}
        onMouseEnter = { onMouseEnter }
        onMouseLeave = { onMouseLeave }
    >
        { filterIcon(able) }
        <div
            className = 'attrLabel'
        >
            { id }
        </div>
        { renderMetadata(able, metadata) }
        <div>
            { barChart(able) }
            { histogram(able) }
            { rangeValues(able, low, high) }
            { filterContents(able) }
        </div>
        <div
            className = 'controls'
        >
        </div>
    </div>
)

ShortEntryPres.propTypes = {
    able: PropTypes.array,      // capabilities to determine displayables
    dynamic: PropTypes.string,  // 'dynamic' indicates this is a dynamic attr
    floatControl: PropTypes.string,  // controls displayed on hover
    high: PropTypes.number,     // high range value
    id: PropTypes.string,       // attribute name
    low: PropTypes.number,      // low range value
    metadata: PropTypes.array,  // metadata rows
    range: PropTypes.array,     // range of ?
    zero: PropTypes.bool,       // show the zero tick mark
    
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
}

export default ShortEntryPres;
