
// Presentational component for the cell atlas home page.

import React from 'react';
import './cell.css';
import cellThumbData from './cellThumbData'

console.log('cellThumbData:', cellThumbData)

const thumbnail = (mapData) => {
    console.log('mapData[0]:', mapData[0])
    let thumb =
        <div>
            <img
                src={ mapData[0].png }
                height='250px'
                alt={ mapData[0].id }>
            </img>
        </div>
    return thumb
}

class WhatIs extends React.Component {
    render() {
        return (
            <div className='home_section'>
                <h3>
                    What is the tumor map?
                </h3>
                <p>
                    Tumor Map is an interactive browser that allows biologists, who may not
                    have computational expertise, to richly explore the results of
                    high-throughput cancer genomics experiments on thousands of patient samples.
                </p>
            </div>
        )
    }
}

class Cell extends React.Component {
    render() {
        return (
            <div>
                <WhatIs></WhatIs>
                { thumbnail(cellThumbData) }
            </div>
        )
    }
}

export default Cell
