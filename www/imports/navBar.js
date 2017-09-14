
// navBar.js
// Create the menu event handlers.

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

