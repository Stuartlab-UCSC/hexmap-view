// pdf.js

// Handle the PDF request

var app = app || {}; 

(function (hex) {
    //'use strict';

    var title = 'PDF',
        dialogHex,
        $dialog,
        chk = new ReactiveDict(),
        $close,
        $head,
        $map,
        $legend,
        autorun;

    Template.pdf.helpers ({
        head: function () {
            return chk.get('head');
        },
        map: function () {
            return chk.get('map');
        },
        legend: function () {
            return chk.get('legend');
        },
    });
    
    Template.body.events({
        "click .legend": function () {
            console.log('legend is:', chk.get('legend'));
            chk.set('legend', !chk.get('legend'));
            console.log('legend changed to:', chk.get('legend'));
        },
    });
 
    function whenCheckboxChanges() {
 
        if (chk.get('head')) {
            $head.show();
        } else {
            $head.hide();
        }
        if (chk.get('map')) {
            $map.show();
        } else {
            $map.hide();
        }
        if (chk.get('legend')) {
            $legend.show();
        } else {
            $legend.hide();
        }
        $close.show();
    }

    function closeViewer () {
 
        console.log('closeViewer');
 
        $close.hide();
        $head.show();
        $map.show();
        $legend.show();
    }

    function show () {
 
        $close = $('#pdfClose');
        $head = $('#navBar, .header');
        $map = $('#visualization, #whiteOutGoogle');
        $legend = $('.key');

        // Define functions to run when reactive vars change
        autorun = Tracker.autorun(whenCheckboxChanges);

        // Attach event listeners to checkboxes
        $dialog.on('change', 'input', function (ev) {
            var data = $(ev.target).data();
            chk.set(data.tag, ev.target.checked);
        });
 
        // Attach event handler to close button
        $close.show()
            .on('click', closeViewer);
    }
 
    function hide () {
        autorun.stop;
        dialogHex.hide();
        window.print(); // TODO why does this not display the browser's print window?
    }

    initPdf = function () {

        $dialog = $('#pdfDialog');
        var $button = $('#pdfDownload');
 
        // Initialize our reactive dict
        chk.set('head', false);
        chk.set('map', true);
        chk.set('legend', true);
 
        // Define the dialog options & create an instance of DialogHex
        var opts = { title: title };
        dialogHex = createDialogHex(undefined, undefined, $dialog, opts, show,
            hide);
 
        // Listen for the menu clicked
        $button.on('click', function () {
            dialogHex.show();
        });
    }
})(app);

