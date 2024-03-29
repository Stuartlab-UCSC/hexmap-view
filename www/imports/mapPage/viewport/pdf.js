// pdf.js

// Handle the PDF request

import DialogHex from '/imports/common/DialogHex.js';
import utils from '/imports/common/utils.js';
import './pdf.html';

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
    if (window.matchMedia) {
        mediaQueryList.removeListener(afterPrint);
    }

    // Show all of the app areas
    $head.show();
    $legend.show();
    $map.show();
    utils.resizeMap();
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

    $head = $('#navBar, .header, .shortlist');
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

exports.init = function () {

    $dialog = $('#pdfDialog');
    var $button = $('#pdfDownload');

    // Initialize our reactive dict
    Session.set('pdfMap', true);
    Session.set('pdfLegend', false);

    // Define the dialog options & create an instance of DialogHex
    var opts = { title: title };
    dialogHex = DialogHex.create(undefined, undefined, $dialog, opts, show);

    // Listen for the menu clicked
    $button.on('click', function () {
        dialogHex.show();
    });
}
