// node.js
// node view logic
// No meteor here.

import { connect } from 'react-redux'
import hexagons from '/imports/mapPage/viewport/hexagons'
import NodePres from '/imports/mapPage/viewport/NodePres'
import nodes from '/imports/mapPage/viewport/nodes';
import rx from '/imports/common/rx';

const mapStateToProps = (state) => {
    return {
        mapView: state['mapView'],
        opacity: state['opacity'],
        transparent: state['transparent'],
        showHoverInfo: state['showHoverInfo'],
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        onHoverInfoShowingClick: ev => {
            const showing = rx.get('showHoverInfo')
            dispatch({ type: 'showHoverInfo.toggle' })
            if (showing) {
                hexagons.removeHoverListener()
            } else {
                hexagons.addHoverListener()
            }

        },
        onHoneycombClick: ev => {
            dispatch({ type: 'mapView.honeycomb' })
            dispatch({ type: 'transparent.off'})
            // TODO does the below get assignments again?
            nodes.getAssignmentsForMapViewChange();
        },
        onTransparentClick: ev => {
            dispatch({ type: 'transparent.toggle' })
            hexagons.setOpacity()
        },
        onXyCoordViewClick: ev => {
            dispatch({ type: 'mapView.xyCoords' })
            dispatch({ type: 'transparent.on'})
            // TODO does the below get assignments again?
            nodes.getAssignmentsForMapViewChange();
        },
    }
}

const Node = connect(
    mapStateToProps,
    mapDispatchToProps
)(NodePres)

export default Node
