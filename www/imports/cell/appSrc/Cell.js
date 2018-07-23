
// Presentational component for the cell atlas home page.

import React from 'react';
import './common/colorsFont.css'
import './common/navBar.css'
import './common/home.css';
import './cell.css';
import cellThumbData from './cellThumbData'

import img0 from './image/pancanAtlas.png'
import img1 from './image/pancan12gene.png'

let image = [
    img0,
    img1,
]

const thumbnailHelp = (data) => {

    // The thumbnail help link.
    let linkAnchor = data.id.toLowerCase()
    if (data.linkAnchor) {
        linkAnchor = data.linkAnchor.toLowerCase()
    } else if (data.label) {
        linkAnchor = data.label.toLowerCase()
    }
    
    let thumbHelp =
                <div
                style={{
                    marginTop: '0.5em',
                    fontSize: '0.8em',
                }}
            >
                <a
                    href={'/help/existingMaps.html#' + linkAnchor}
                    target='_blank'
                >
                    Details
                </a>
            </div>

    return thumbHelp
}

const thumbnail = (data, image, i) => {
    let thumb =
        <div
            className='project'
            key = {i}
        >
            <div
                id={ data.id }
                class='thumbnail'
                data={{
                    project: data.proj,
                    layoutIndex: i,
                    searchSuffix: data.searchSuffix,
                }}
            >
                <div
                    style={{
                        paddingTop: '0.5em',
                    }}
                >
                    { data.label }
                </div>
                <img
                    src={ image[i] }
                    height='250px'
                    style={{
                        paddingTop: '1em'
                    }}
                    alt={data.id}
                >
                </img>
            </div>
            { thumbnailHelp(data) }
        </div>

    return thumb
 }

const CreateMap = () => {

    // A placeholder for the create map widget.
    let create = null
    return create
}

class WhatIs extends React.Component {

    // The 'What Is' widget.
    render() {
        return (
            <div
                className='home_section'
            >
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

    // The main component for the Cell Atlas home page.
    render() {
        return (
            <div id='homePage'>
                <div
                    style={{
                        paddingTop: '0.5em',
                        verticalAlign: 'top',
                    }}
                >
                </div>
                <div>
                    <div>
                        <WhatIs></WhatIs>
                    </div>
                    <div
                        className='allProjects'
                    >
                        { cellThumbData.map((data, i) =>
                            thumbnail(data, image, i)
                        ) }
                    </div>
                    <div
                        className='allProjects'
                    >
                        { CreateMap() }
                    </div>
                </div>
            </div>
        )
    }
}

export default Cell
