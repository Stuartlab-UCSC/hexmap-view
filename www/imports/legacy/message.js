
import DialogHex from '/imports/legacy/dialogHex.js';

import '/imports/legacy/htmlCss/message.html';

var dialogHex, // the dialogHex object instance
    $dialog, // the DOM element that the jquery dialog belongs to
    message = ReactiveVar();
    
Template.messageT.helpers ({
    message: function () {
        return message.get();
    },
});

function hide () {
    message.set('');
    dialogHex.hide();
}

exports.display = function (title, text) {
        
    dialogHex.show();
    $dialog.dialog('option', 'title', title );
    message.set(text);
}

exports.init = function () {

    // Define the dialog options & create an instance of DialogHex.
    $dialog = $('#messageDialog');
    var opts = {
        title: '(title)',
        modal: true,
        width: '400px',
        buttons: [{ text: 'OK', click: hide }],
    };
    dialogHex = DialogHex.create({
        $el: $dialog,
        opts: opts,
        hideFx: hide,
    });
}
