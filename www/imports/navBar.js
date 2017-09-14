
// navBar.js
// Create the menu event handlers.


exports.init = function () {
    $('#navBar .attrAdd').on('click', function () {
        import AttrAdd from './reactCandidates/attrAdd.js';
        AttrAdd.init();
    });

    $('#navBar .nodeIdSelect').on('click', function () {
        import NodeIdSelect from './nodeIdSelect.js';
        NodeIdSelect.show();
    });

}

}

}
