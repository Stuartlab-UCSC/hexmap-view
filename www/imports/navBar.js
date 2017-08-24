
// navBar.js
// Create the menu event handlers.

import AttrAdd from './attrAdd.js';
function attrAdd () {
    $('#navBar .attrAdd').on('click', AttrAdd.init);
}

import SelectByNodeId from './selectByNodeId.js';
function selectByNodeId () {
    $('#navBar .selectByNodeId').on('click', SelectByNodeId.show);
}

exports.init = function () {
    attrAdd();
    selectByNodeId();
}
