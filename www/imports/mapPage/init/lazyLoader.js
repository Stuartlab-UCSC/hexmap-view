
// lazyLoader.js
// Load components as they are needed.
// 'create*' routines should destroy their react instance and the container upon
//      hide.
// 'init*' routines should leave the component instance there forever.

// TODO what we really want here is a way to dynamically load a react component
// from a react component. When we know how to do that, we could make this
// a react component and it could be the react root for some of our react
// components that now have their own root.

import React from 'react';
import { render } from 'react-dom';

import utils from '/imports/common/utils';

var nodeIdSelect;

function createNodeIdSelect () {
    
    // Create and render the instance of NodeIdSelect.
    if (nodeIdSelect) {
        nodeIdSelect.setState({ isOpen: true });
    } else {
        import NodeIdSelect from '/imports/mapPage/shortlist/NodeIdSelect.js';
        nodeIdSelect = render(
            <NodeIdSelect
                isOpen = {true}
            />, utils.createReactRoot('nodeIdSelectContainer')
        );
    }
}

exports.init = function () {

    $('#navBar .nodeIdSelect').on('click', createNodeIdSelect);

    $('#navBar .attrAdd').on('click', function () {
        import attrAdd from '/imports/mapPage/shortlist/attrAdd.js';
        attrAdd.create();
    });
};
