
// lazyLoader.js
// Load components as they are needed.

// TODO what we really want here is a way to dynamically load a react component
// from a react component. When we know how to do that, we could make this
// a react component and it could be the react root for some of our react
// components that now have their own root.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

nodeIdSelectInit = function () {
    
    import NodeIdSelect from './nodeIdSelect.js';
    
    var containerId = 'nodeIdSelectContainer';

    function closeModal (result) {
        $('#' + containerId).remove();
    }

    $('body').append($('<div id=' + containerId + ' />'));
    var parentSelector = $('#' + containerId);
    render(
        <NodeIdSelect
            isOpen = {true}
            closeModal = {closeModal}
            parentSelector = {parentSelector[0]}
            searchDropDownParent = {parentSelector}
         />, parentSelector[0]);
}

exports.init = function () {

    $('#navBar .nodeIdSelect').on('click', nodeIdSelectInit);

    $('#navBar .attrAdd').on('click', function () {
        import AttrAdd from './reactCandidates/attrAdd.js';
        AttrAdd.init();
    });
}

