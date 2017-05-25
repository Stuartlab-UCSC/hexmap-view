// error.js

var app = app || {};
(function (hex) { // jshint ignore: line
Message = (function () { // jshint ignore: line

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
    
return { // Public methods
    
    show: function (text) {
        message.set(text);
        dialogHex.show();
    }
    ,
    init: function () {
 
        $dialog = $('#messageDialog');

        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: 'Error',
            modal: true,
            buttons: [{ text: 'OK', click: hide }],
        };
        dialogHex = createDialogHex({
            $el: $dialog,
            opts: opts,
            hideFx: hide,
        });
    },
};
}());
})(app);
