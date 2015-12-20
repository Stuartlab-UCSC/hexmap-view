// sortUi.js
// This contains the logic for handling the sort attribute function.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort Attributes',
        disabledColor = '#aaaaaa',
        FOCUS_LIST_LABEL = 'Attribute A:', //was 'Focus attribute:',
        DIFF_LIST_LABEL = 'Attribute A:',
        dialogHex,
        $dialog,
        list,
        list2,
        focusAttr2,
        shortlist,
        reactFocusAttr = new ReactiveVar(),
        ui = new ReactiveDict();

    // Make the variables in the html templates under our dynamic control here.
    Template.sortUiT.helpers({
        focusSort: function () {
            return (ui.get('sortBy') === 'focus');
        },
        diffSort: function () {
            return (ui.get('sortBy') === 'diff');
        },
        densitySort: function () {
            return (ui.get('sortBy') === 'density');
        },
        layoutIgnore: function () {
            return !(ui.get('layoutAware'));
        },
        layoutAware: function () {
            return ui.get('layoutAware');
        },
        corrPos: function () {
            return !(ui.get('corrNeg'));
        },
        corrNeg: function () {
            return ui.get('corrNeg');
        },
        listLabel: function () {
            return ui.get('listLabel');
        },
    });

    function enableBase() {
        var disabled = false,
            color = 'inherit';

        if (!ui.equals('sortBy', 'focus')) {

            // Disable base options of focus sort
            disabled = true;
            color = disabledColor;
        }
        $dialog.find('.based')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enableCorr() {
        var disabled = false,
            color = 'inherit';

        if (!ui.equals('sortBy', 'focus') ||
            (ui.equals('sortBy', 'focus') && !ui.equals('layoutAware', true))) {

            // Disable correlation options for sample-based
            disabled = true;
            color = disabledColor;
        }
        $dialog.find('.corr')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enableList() {

        if (ui.equals('sortBy', 'density')) {
            list.enable(false);
        } else {
            var filter = {};
            if (ui.equals('sortBy', 'focus') && ui.equals('layoutAware', true)) {
                filter.binary = true;
            } else if (ui.equals('sortBy', 'diff')) {
                filter.selection = true;
                filter.twoLayersRequired = true;
            }
            list.enable(true, filter);
        }
    }

    function enableList2() {

        if (ui.equals('sortBy', 'diff')) {
            var filter = {
                selection: true,
                twoLayersRequired: true,
            };
            list2.enable(true, filter);
        } else {
            list2.enable(false);
        }
    }

    function enableAll(except_base) {
        if (!except_base) {
            enableBase();
        }
        enableCorr();
        enableList();
        enableList2();
    }

    function show () {

        // Show the contents of the dialog, once per opening button click
        list = createLayerNameList($('#sort-attributes-dialog .listAnchor'),
                                   $('#sort-attributes-dialog .listLabel'));
        list2 = createLayerNameList($('#sort-attributes-dialog .listAnchor2'),
                                    $('#sort-attributes-dialog .listLabel2'));
        enableAll();

        // TODO disable the button that displays the dialog, maybe with a progress wheel

    }

	sortIt = function () {
        var returnMessage,
            focusAttr = list.selected,
            focusAttr2 = list2.selected;
        if (ui.equals('sortBy', 'density')) {

            // Density sort has been requested
            find_clumpiness_stats(current_layout_index);

        } else if (ui.equals('sortBy', 'focus')) {

            // Focus attribute sort has been requested
            if (focusAttr === '') {
                // We should not be able to get here
                returnMessage = 'For some reason an attribute is not selected';

            } else if (ui.equals('layoutAware', true)) {
                get_layout_aware_stats(current_layout_index, focusAttr,
                    ui.equals('corrNeg', true));

            } else { // ignore layout requested
                get_layout_ignore_stats(focusAttr, Session.get('bin'),
                    Session.get('cat'), Session.get('cont'));
            }
         } else {

            // Differential attribute sort has been requested
            if (focusAttr === '' || focusAttr2 === '') {
                // We should not be able to get here
                returnMessage = 'For some reason an attribute is not selected';

            } else if (focusAttr === focusAttr2) {
                returnMessage = 'Select two different attributes for differential sort';

            } else { // Go get those differential stats
                returnMessage = get_diff_stats(focusAttr, focusAttr2);
            }
        }
        if (_.isUndefined(returnMessage)) {
            dialogHex.destroyDialog();
        } else {
            banner('error', returnMessage);
        }
	}

    function justBeforeDestroy() {
        list.destroy();
        list2.destroy();
        // TODO enable the button that displays the dialog
    }

    initSortAttrs = function () {

        // Initialize the sort functions, happens once per app reload

        // Initialize the reactive variables
        ui.set({
            'sortBy': 'focus',  // Sort by focus attribute rather than differential or density
            'layoutAware': false, // layout aware rather than ignore layout
            'listLabel': FOCUS_LIST_LABEL,  // set the list label
            'corrNeg': false,  // sort by positive correlation rather than anticorrelation
        });
        Session.set('bin', true); // binary values included
        Session.set('cat', true); // categorical values included
        Session.set('cont', true); // continuous values included
        reactFocusAttr.set('');
        focusAttr2 = '';

        // Set jquery element names
        $dialog = $('#sort-attributes-dialog');

        // Define some 'delegated' event handlers. Child elements to do not need
        // to exist yet, so we can define handlers once with no worries of
        // freeing or recreating them.
        $dialog
            .on('change', '#sortByFocus', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'focus');
                enableAll();
            })
            .on('change', '#sortByDiff', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'diff');
                enableAll();
            })
            .on('change', '#sortByDensity', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'density');
                enableAll();
            })
            .on('change', '#sample-based', function (ev) {
                if (ev.target.checked) ui.set('layoutAware', false);
                enableAll(true);
            })
            .on('change', '#region-based', function (ev) {
                if (ev.target.checked) ui.set('layoutAware', true);
                enableAll(true);
            })
            .on('change', '#corrPos', function (ev) {
                if (ev.target.checked) ui.set('corrNeg', false);
            })
            .on('change', '#corrNeg', function (ev) {
                if (ev.target.checked) ui.set('corrNeg', true);
            });

        // Define the dialog options
        var opts = {
            title: title,
            width: '25em',
            buttons: [{ text: 'Sort', click: sortIt }],
        };

        // Create an instance of DialogHex
        dialogHex = createDialogHex($('#sort-attributes-button'), $dialog, opts,
            show, justBeforeDestroy);
    }
})(app);
