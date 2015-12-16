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
        $list,
        $list2,
        focusAttr,
        focusAttr2,
        shortlist,
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
        listMessage: function () {
            return ui.get('listMessage');
        },
        messageColor: function () {
            var x = ui.get('listMessage');
            return 'red';
        },
        listMessageDisplay: function () {
            if (ui.get('listMessage') === '') {
                return 'none';
            } else {
                return 'inline';
            }
        },
        listMessage2: function () {
            return ui.get('listMessage2');
        },
        messageColor2: function () {
            var x = ui.get('listMessage2');
            return 'red';
        },
        listMessageDisplay2: function () {
            if (ui.get('listMessage2') === '') {
                return 'none';
            } else {
                return 'inline';
            }
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
        var disabled = false,
            color = 'inherit',
            msgColor = 'red';

        // Disable any list message up front
        ui.set('listMessage', '');
        $dialog.find('.listMessage').css('color', 'red');

        if (ui.equals('sortBy', 'density')) {

            // Disable the list
            disabled = true;
            color = disabledColor;
        } else {
            if (ui.equals('sortBy', 'focus')) {
                ui.set('listLabel', FOCUS_LIST_LABEL);
            } else {
                ui.set('listLabel', DIFF_LIST_LABEL);
            }
            populateList();
        }
        $dialog.find('.focus_attr, .focus_attr .select2-choice')
            .attr('disabled', disabled)
            .css('color', color);

        // Stupid override
        $('.redMessage').css('color', 'red');
    }

    function enableList2() {
        var disabled = false,
            color = 'inherit';

        // Disable any list message up front
        ui.set('listMessage2', '');

        if (ui.equals('sortBy', 'diff')) {
            populateList2();
        } else {

            // Disable the list
            disabled = true;
            color = disabledColor;
        }
        $dialog.find('.focus_attr2, .focus_attr2 .select2-choice')
            .attr('disabled', disabled)
            .css('color', color);

        // Stupid override
        $('.redMessage').css('color', 'red');
    }

    function enableAll(except_base) {
        if (!except_base) {
            enableBase();
        }
        enableCorr();
        enableList();
        enableList2();
    }

	sortIt = function () {
        var returnMessage;
        if (ui.equals('sortBy', 'density')) {

            // Density sort has been requested
            find_clumpiness_stats(current_layout_index);

        } else if (ui.equals('sortBy', 'focus')) {

            // Focus attribute sort has been requested
            if (focusAttr === '') return;

            if (ui.equals('layoutAware', true)) {
                get_layout_aware_stats(current_layout_index, focusAttr,
                    ui.equals('corrNeg', true));

            } else { // ignore layout requested
                get_layout_ignore_stats(focusAttr, Session.get('bin'),
                    Session.get('cat'), Session.get('cont'));
            }
         } else {

            // Differential attribute sort has been requested
            if (focusAttr === '' || focusAttr2 === '') return;
            if (focusAttr === focusAttr2) {
                banner('error', 'Select two different attributes for differential sort');
                return;
            }
            returnMessage = get_diff_stats(focusAttr, focusAttr2);

         }
        if (_.isUndefined(returnMessage)) {
            dialogHex.destroyDialog();
        } else {
            banner('error', returnMessage);
        }
	}

     function findBinaryFocuslist () {
        var focusList = _.filter(shortlist,
            function (layer_name) {
                return (ctx.bin_layers.indexOf(layer_name) > -1);
            }
        );
        return focusList;
	}

    function findUserGeneratedList () {
        var focusList = _.filter(shortlist,
            function (layer_name) {
                return (layers[layer_name].hasOwnProperty('selection'));
            }
        );
        return focusList;
    }

    function findShortlist() {

        // Get all of the attributes in the shortlist
        shortlist = _.map($("#shortlist").children(),
            function (element, index) {
                return $(element).data("layer");
            }
        )
    }

    populateList = function () {

        // This creates and populates the drop down with the
        // appropriate layers in the shortlist.

        // Reset the list
        try {
            $list.select2('destroy');
        }
        catch (error) {
            $.noop();
        }

        findShortlist();
        var focusList = shortlist;
        if (ui.equals('sortBy', 'focus') && ui.equals('layoutAware', true)) {
            focusList = findBinaryFocuslist();
        } else if (ui.equals('sortBy', 'diff')) {
            focusList = findUserGeneratedList();
        }

        // At least two attributes must be in the list for differential stats
        if (ui.equals('sortBy', 'diff') && focusList.length < 2) {

            // Reset the focus attribute
            focusAttr = '';
            ui.set('listMessage', 'Select two groups of hexagons');

        // At least one attribute must be in the list for focus sort
        } else if (focusList.length < 1) {

            focusAttr = '';
            if (ui.equals('layoutAware', true)) {
                ui.set('listMessage', 'Add label attribute to shortlist');
            } else {
                ui.set('listMessage', 'Add an attribute to shortlist');
            }

        } else {
            setTimeout(function () { // Flush UI to let the list message disappear

                // Transform the focus layer list into the form wanted by select2
                var data = _.map(focusList, function (layer) {
                    return { id: layer, text: layer }
                });

                // Create the select2 drop-down
                focusAttr = (focusList.indexOf(focusAttr) > -1)
                    ? focusAttr : focusList[0];
                var opts = {data: data, minimumResultsForSearch: -1};
                createOurSelect2($list, opts, focusAttr);
            }, 0);
        }
    }

    populateList2 = function () {

        // This creates and populates the drop down with the
        // appropriate layers in the shortlist.

        // Reset the list
        try {
            $list2.select2('destroy');
        }
        catch (error) {
            $.noop();
        }

        var focusList = findUserGeneratedList();

        // At least two attributes must be in the list for differential stats
        if (focusList.length < 2) {

            // Reset the focus attribute
            focusAttr2 = '';
            ui.set('listMessage2', 'Select two groups of hexagons');

        } else {
            setTimeout(function () { // Flush UI to let the list message disappear

                // Transform the focus layer list into the form wanted by select2
                var data = _.map(focusList, function (layer) {
                    return { id: layer, text: layer }
                });

                // Create the select2 drop-down
                focusAttr2 = (focusList.indexOf(focusAttr2) > -1)
                    ? focusAttr2 : focusList[1];
                var opts = {data: data, minimumResultsForSearch: -1};
                createOurSelect2($list2, opts, focusAttr2);
            }, 0);
        }
    }

    function justBeforeDestroy() {
        try {
            $list.select2('destroy');
        }
        catch (error) {
            $.noop();
        }
        try {
            $list2.select2('destroy');
        }
        catch (error) {
            $.noop();
        }
    }

    shortlistChangedForSort = function () {

        // If the shortlist changes and the dialog is open,
        // update the attribute lists
        if ($dialog.parent().hasClass('ui-dialog')) {
            enableList();
            enableList2()
        }
    }

    initSortAttrs = function () {

        // Initialize the reactive variables
        ui.set({
            'sortBy': 'focus',  // Sort by focus attribute rather than differential or density
            'layoutAware': false, // layout aware rather than ignore layout
            'listLabel': FOCUS_LIST_LABEL,  // set the list label
            'corrNeg': false,  // sort by positive correlation rather than anticorrelation
            'listMessage': '', // empty the list message
            'listMessage2': '', // empty the list message2
        });
        Session.set('bin', true); // binary values included
        Session.set('cat', true); // categorical values included
        Session.set('cont', true); // continuous values included
        focusAttr = '';
        focusAttr2 = '';

        // Set jquery element names
        $dialog = $('#sort-attributes-dialog');
        $list = $("#sort-attributes-dialog .list");
        $list2 = $("#sort-attributes-dialog .list2");

        // Define some delegated event handlers. Being 'delegated' means the
        // child elements to do not have to exist yet, so we can define them
        // once and not worry about freeing or re-creating them.
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
            })
            .on('change', '.list', function (ev) {
                focusAttr = $list.val();
            })
            .on('change', '.list2', function (ev) {
                focusAttr2 = $list2.val();
            });

        // Define the dialog options
        var opts = {
            title: title,
            width: '25em',
            buttons: [{ text: 'Sort', click: sortIt }],
        };

        // Create an instance of DialogHex
        dialogHex = createDialogHex($('#sort-attributes-button'), $dialog, opts,
            enableAll, justBeforeDestroy);
    }
})(app);
