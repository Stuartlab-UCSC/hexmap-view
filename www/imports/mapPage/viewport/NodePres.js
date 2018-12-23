// nodePres.js
// Presentation component of node view.
// No meteor here.

import React from "react";
import '/imports/common/navBar.css'

const NodePres = ({ showHoverInfo, mapView, opacity, transparent,
    onHoverInfoShowingClick, onHoneycombClick, onTransparentClick,
    onXyCoordViewClick}) => {

    return (
        <React.Fragment>
            <li
                className='mapLayout mapView'
                onClick={onHoneycombClick}
            >
                {mapView === 'honeycomb' ? '✓ Hexagonal Grid' : 'Hexagonal Grid'}
            </li>
            <li
                className='xyCoordView mapView'
                onClick={(onXyCoordViewClick)}
            >
                {mapView === 'xyCoords' ? '✓ Cartesian Plane' : 'Cartesian Plane'}
            </li>
            <li className='mapShow'>
                <hr />
            </li>
            <li
                className='transparent'
                onClick={(onTransparentClick)}
                style={{display: 'none'}}
            >
                {transparent ? '✓ Transparent' : 'Transparent'}
            </li>
            <li
                className='showHoverInfo'
                onClick={(onHoverInfoShowingClick)}
            >
                {showHoverInfo ? '✓ Show Node Hover' : 'Show Node Hover'}
            </li>
        </React.Fragment>
    )
}

export default NodePres;
