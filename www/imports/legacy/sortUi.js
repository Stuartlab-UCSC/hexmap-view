// sortUi.js
// This contains the logic for handling the sort attribute function.

import Colors from '/imports/legacy/colors.js';
import DialogHex from '/imports/legacy/dialogHex.js';
import LayerNameList from '/imports/legacy/layerNameList.js';
import Sort from '/imports/legacy/sort.js';
import Tool from '/imports/legacy/tool.js';
import Util from '/imports/legacy/util.js';

    var title = 'Sort Attributes by Associative Statistics',
        FOCUS_LIST_LABEL = 'Attribute A:', //was 'Focus attribute:',
        DIFF_LIST_LABEL = 'Attribute A:',
        dialogHex,
        $dialog,
        list,
        list2,
        listSelected,
        listSelected2,
        ui = new ReactiveDict(),
        autorun;

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
            color = Colors.disabled_color();
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
            color = Colors.disabled_color();
        }
        $dialog.find('.corr')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enableList() {

        if (_.isUndefined(list)) return;

        if (ui.equals('sortBy', 'density')) {
            list.enable(false);
        } else {
            var filter = {};
            if (ui.equals('sortBy', 'focus') && ui.equals('layoutAware', true)) {
                filter.binary = true;
            } else if (ui.equals('sortBy', 'diff')) {
                filter.selection = true;
            }
            list.enable(true, filter);
        }
    }

    function enableList2() {

        if (_.isUndefined(list2)) return;

        if (ui.equals('sortBy', 'diff')) {
            var filter = {
                selection: true,
                secondList: true,
            };
            list2.enable(true, filter, list.selected);
        } else {
            list2.enable(false);
        }
    }

    function enableAll() {
        enableBase();
        enableCorr();
        enableList();
        enableList2();
    }

    function show () {

        // Show the contents of the dialog, once per trigger button click
        list = LayerNameList.create($('#sort-attributes-dialog .listAnchor'),
                                   $('#sort-attributes-dialog .listLabel'),
                                   listSelected);
        list2 = LayerNameList.create($('#sort-attributes-dialog .listAnchor2'),
                                    $('#sort-attributes-dialog .listLabel2'),
                                    listSelected2,
                                    list);
        enableAll();

        // Define an autorun for when UI variables change
        autorun = Tracker.autorun(function () {
            ui.get('sortBy');
            ui.get('layoutAware');
            enableAll();
        });
    }

	 function sortIt () {
        var returnMessage,
            focusAttr = list.selected,
            focusAttr2 = list2.selected;
        if (ui.equals('sortBy', 'density')) {

            // Density sort has been requested
            Sort.find_clumpiness_stats(Session.get('layoutIndex'));

        } else if (ui.equals('sortBy', 'focus')) {

            // Focus attribute sort has been requested
            if (focusAttr === '') {
                // We should not be able to get here
                returnMessage = 'For some reason an attribute is not selected';

            } else if (ui.equals('layoutAware', true)) {
                Sort.get_layout_aware_stats(Session.get('layoutIndex'), focusAttr,
                    ui.equals('corrNeg', true));

            } else { // ignore layout requested
                Sort.get_layout_ignore_stats(focusAttr, true, true, true);
            }
         } else {

            // Differential attribute sort has been requested
            if (focusAttr === '' || focusAttr2 === '') {
                // We should not be able to get here
                returnMessage = 'For some reason an attribute is not selected';

            } else if (focusAttr === focusAttr2) {
                returnMessage = 'Select two different attributes for differential sort';

            } else { // Go get those differential stats
                returnMessage = Sort.get_diff_stats(focusAttr, focusAttr2);
            }
        }
        if (_.isUndefined(returnMessage)) {
            hide();
        } else {
            Util.banner('error', returnMessage);
        }
	}

    function hide() {

        // Free some memory just before the dialog hide
        autorun.stop();
        listSelected = list.selected;
        list.destroy();
        list = undefined;
        listSelected2 = list2.selected;
        list2.destroy();
        list2 = undefined;
 
        dialogHex.hide();
    }

exports.init = function () {

        // Initialize the sort functions

        // Density sort is the default sort
        Sort.find_clumpiness_stats(Session.get('layoutIndex'));

        // Initialize the reactive variables
        ui.set({
            'sortBy': 'focus',  // Sort by focus attribute rather than differential or density
            'layoutAware': false, // layout aware rather than ignore layout
            'listLabel': FOCUS_LIST_LABEL,  // set the list label
            'corrNeg': false,  // sort by positive correlation rather than anticorrelation
        });

        // Set jquery element names
        $dialog = $('#sort-attributes-dialog');

        // Define some 'delegated' event handlers. Child elements to do not need
        // to exist yet, so we can define handlers once with no worries of
        // freeing or recreating them. Meteor template event handlers should be
        // able to do this, but they are broken in the latest meteor version
        // (1.1.0.3) that runs under our python version (2.6) on su2c-dev/su2c.
        $dialog
            .on('change', '#sortByFocus', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'focus');
            })
            .on('change', '#sortByDiff', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'diff');
            })
            .on('change', '#sortByDensity', function (ev) {
                if (ev.target.checked) ui.set('sortBy', 'density');
            })
            .on('change', '#sample-based', function (ev) {
                if (ev.target.checked) ui.set('layoutAware', false);
            })
            .on('change', '#region-based', function (ev) {
                if (ev.target.checked) ui.set('layoutAware', true);
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
            buttons: [{ text: 'Sort', click: sortIt }],
        };

        // Create an instance of DialogHex with a link from the navbar menu item
        dialogHex = DialogHex.create({
            $button: $('#sort-attributes-button'),
            $el: $dialog,
            opts: opts,
            showFx: show,
            hideFx: hide,
            helpAnchor: '/help/statsNsort.html',
        });
 
        // Create a link from the header button
        Tool.add("statsSort", function(ev) {
            $('#sort-attributes-button').click();
            Tool.activity(false);
        }, 'Sort attributes by associative statistics');
        
        // initialize the snake.
        Session.set('statsSnake', false);
    }
