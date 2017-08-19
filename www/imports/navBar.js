
// navBar.js
// Create the menu event handlers.

import AttrAdd from './attrAdd.js';
function attrAdd () {
    //alert('navbar.attrAdd()');
    $('#navBar .attrAdd').on('click', AttrAdd.init);
}

exports.init = function () {
    attrAdd();
}
