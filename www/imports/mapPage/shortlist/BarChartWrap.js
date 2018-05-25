/*
* The logic and state for a bar chart in the shortlist.
*/
import { connect } from 'react-redux'

import { BarChart } from '/imports/mapPage/shortlist/BarChart'
import Colormap from '/imports/mapPage/color/Colormap'
import Layer from '/imports/mapPage/longlist/Layer'

let charts = {}; // A chart handle for each layer used to free it

function getData (state) {

    // TODO
    let attrId = '3_categories'
    let nodes = Object.keys(layers[attrId].data)
    //nodes = ['S1', 'S2', 'S3']
    

    // Find the colors from the colormap or the default binary colors.
    var colormap = colormaps[attrId],
        catCount = Object.keys(colormap).length,
        colors;
    if (!colormap || catCount === 0) {
        colors = [Colormap.binaryOffColor(), Colormap.binaryOnColor()];
    } else {
        colors = _.map(colormap, function (cat) {
            return cat.color.hexString();
        });
    }

    // Find counts of each category
    var counts = []
    let attrData = layers[attrId].data
    
    nodes.forEach(nodeId => {
        if (nodeId in attrData) {
            let cat = attrData[nodeId]
            if (counts[cat]) {
                counts[cat] += 1;
            } else {
                counts[cat] = 1;
            }
        }
    })

    // Fill any undefined array values with zero
    var filled = [];
    for (var i = 0; i < catCount; i += 1) {
        filled[i] = (counts[i]) ? counts[i] : 0
    }

    // Format the data as needed.
    let data = filled.map((count, i) => {
        return {
            x: i.toString(),
            y: count,
            color: colors[i],
        }
    })
    
    return data
}

const mapStateToProps = (state) => {

    // Map state to the BarChart properties.
    return {
        data: getData(state),
    }
}

const mapDispatchToProps = (dispatch) => {

    // Map the event handlers to the BarChart properties.
    return {}
}

// Connect the value props and eventHandler props
// to the presentational component: BarChart.
const BarChartWrap = connect(
    mapStateToProps,
    mapDispatchToProps
)(BarChart)

export default BarChartWrap;
