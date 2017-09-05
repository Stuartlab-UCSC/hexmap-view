
// navBar.js
// Create the menu event handlers.

import AttrAdd from './reactCandidates/attrAdd.js';
function attrAdd () {
    $('#navBar .attrAdd').on('click', AttrAdd.init);
}

import NodeIdSelect from './nodeIdSelect.js';
function nodeIdSelect () {
    $('#navBar .nodeIdSelect').on('click', NodeIdSelect.show);
}

exports.init = function () {
    attrAdd();
    nodeIdSelect();
}
