// pdf.js

// Handle the PDF request

var app = app || {}; 

(function (hex) {
    //'use strict';

    var title = 'PDF',
        dialogHex,
        $dialog,
        $head,
        $map,
        $legend,
        mediaQueryList;

    Template.pdf.helpers ({
        mapChecked: function () {
            return Session.get('pdfMap');
        },
        legendChecked: function () {
            return Session.get('pdfLegend');
        },
    });
    
    function restoreView () {
 
        // Remove some event listeners.
        $('#mapPage').off('click');
        mediaQueryList.removeListener(afterPrint);
 
        // Show all of the app areas
        $head.show();
        $legend.show();
        $map.show();
        Hex.resizeMap();
        $('#visualization').show();
    }

    function mapDisplay () {
        if (Session.get('pdfMap')) {
            $map.show();
        } else {
            $map.hide();
        }
    }

    function legendDisplay () {
        if (Session.get('pdfLegend')) {
            $legend.show();
        } else {
            $legend.hide();
        }
    }

    // Watch for the printer event
    var afterPrint = function() {
        setTimeout(restoreView, 100);
    };

    function watchPrint () {
 
        if (window.matchMedia) {
            mediaQueryList = window.matchMedia('print');
            mediaQueryList.addListener(afterPrint);
        }
        window.onafterprint = afterPrint;
    }

    function show () {
 
        $head = $('#navBar, .header');
        $map = $('#visualization');
        $legend = $('.key');
 
        // Set the initial value of the areas to be displayed
        mapDisplay();
        legendDisplay();

        // Always hide the header,
        $head.hide();
 
        // Event handlers for checkboxes
        $('#pdfMap').on('change', function(ev) {
            Session.set('pdfMap', ev.target.checked);
            mapDisplay();
        });
        $('#pdfLegend').on('change', function(ev) {
            Session.set('pdfLegend', ev.target.checked);
            legendDisplay();
        });

        // Two add event handler on click to restore the usual view.
        $('#mapPage').on('click', restoreView);
        watchPrint();
    }
 
    initPdf = function () {

        $dialog = $('#pdfDialog');
        var $button = $('#pdfDownload');
 
        // Initialize our reactive dict
        if (_.isUndefined(Session.get('pdfMap'))) {
            Session.set('pdfMap', true);
        }
        if (_.isUndefined(Session.get('pdfLegend'))) {
            Session.set('pdfLegend', false);
        }
 
        // Define the dialog options & create an instance of DialogHex
        var opts = { title: title };
        dialogHex = createDialogHex(undefined, undefined, $dialog, opts, show);
 
        // Listen for the menu clicked
        $button.on('click', function () {
            dialogHex.show();
        });
    }
})(app);

