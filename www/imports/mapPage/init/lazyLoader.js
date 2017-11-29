
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

function createNodeIdSelect () {
    
    // Create the instance of NodeIdSelect.
    import NodeIdSelect from '/imports/mapPage/shortlist/NodeIdSelect.js';
    var containerId = 'nodeIdSelectContainer';
    
    // The parent selector is used to properly close the modal.
    function getParentSelector() {
        return document.querySelector('#' + containerId);
    }

    // Remove the react component and its container from the DOM.
    function closeModal () {
        utils.destroyReactRoot(containerId);
    }

    // Render the react component.
    render(
        <NodeIdSelect
            isOpen = {true}
            closeModal = {closeModal}
            parentSelector = {getParentSelector}
         />, utils.createReactRoot(containerId));
}

exports.init = function () {

    $('#navBar .nodeIdSelect').on('click', createNodeIdSelect);

    $('#navBar .attrAdd').on('click', function () {
        import attrAdd from '/imports/mapPage/shortlist/attrAdd.js';
        attrAdd.init();
    });
};
