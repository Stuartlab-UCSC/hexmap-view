
// lazyLoader.js
// Load components as they are needed.

// TODO what we really want here is a way to dynamically load a react component
// from a react component. When we know how to do that, we could make this
// a react component and it could be the react root for some of our react
// components that now have their own root.

import React from 'react';
import { render } from 'react-dom';
import utils from '/imports/common/utils.js';

function nodeIdSelectInit () {
    
    import NodeIdSelect from '/imports/mapPage/shortlist/NodeIdSelect.js';
    
    var containerId = 'nodeIdSelectContainer';
    
    function getParentSelector() {
        return document.querySelector('#' + containerId);
    }

    function closeModal () {
        utils.destroyReactRoot(containerId);
    }

    var container = utils.createReactRoot(containerId);

    render(
        <NodeIdSelect
            isOpen = {true}
            closeModal = {closeModal}
            parentSelector = {getParentSelector}
         />, container);
}

exports.init = function () {

    $('#navBar .nodeIdSelect').on('click', nodeIdSelectInit);

    $('#navBar .attrAdd').on('click', function () {
        import attrAdd from '/imports/mapPage/shortlist/attrAdd.js';
        attrAdd.init();
    });
};
