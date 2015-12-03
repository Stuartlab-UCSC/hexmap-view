// sortUi.js
// This contains the logic for handling the sort attribute function.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort Attributes',
        disabled_color = '#aaaaaa',
        $dialog,
        $sample_based,
        $corr_neg,
        $list,
        $help_dialog,
        sample_based,
        corr_neg,
        focus_attr,
        shortlist;

    Template.sortUiT.helpers({
        focusSort: function () {
            return Session.get('focusSort');
        },
        bin: function () {
            return Session.get('bin');
        },
        cat: function () {
            return Session.get('cat');
        },
        cont: function () {
            return Session.get('cont');
        },
        listMessage: function () {
            return Session.get('listMessage');
        },
        listMessageDisplay: function () {
            return Session.get('listMessageDisplay');
        },
    });

    function destroy_help() {
        $help_dialog.dialog('destroy');
    }

    function show_help() {

        // Make the help dialog no taller than the main window
        var height = $(window).height() - 15;

        $help_dialog = $('#sort-attributes-help-dialog');
        $help_dialog.dialog({
            title: 'Help: ' + title,
            dialogClass: 'dialog',
            width: '35em',
            maxHeight: height,
            close: destroy_help,
            position: { my: "right", at: "left-10", of: '#sort-attributes-dialog'},
        });
        $help_dialog.parent().find('button').blur();
    }

    function enable_base() {
        var disabled = false,
            color = 'inherit';

        if (Session.equals('focusSort', false)) {

            // Disable correlation options for focus sort
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.based')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enable_corr() {
        var disabled = false,
            color = 'inherit';

        if (Session.equals('focusSort', false) || sample_based) {

            // Disable correlation options for sample-based
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.corr')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enable_value_types() {
    /* TODO may not want value types
        var disabled = false,
            color = 'inherit';

        if (Session.equals('focusSort', false)) {

            // Disable all value types for density sort
            disabled = true;
            color = disabled_color;
            $dialog.find('.bin, .cat, .cont')
                .attr('disabled', disabled)
                .css('color', color);
            return;
        }

        // Enable binary with or without layout
        $dialog.find('.bin')
            .attr('disabled', disabled)
            .css('color', color);

        if (!sample_based) {

            // Force selection of binary values
            Session.set('bin', true);

            // Disable categorical and continuous for region-based
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.cat, .cont')
            .attr('disabled', disabled)
            .css('color', color);
    */
    }

    function enable_list() {
        var disabled = false,
            color = 'inherit';

        if (Session.equals('focusSort', true) && (
                Session.equals('bin', true)
                || Session.equals('cat', true)
                || Session.equals('cont', true))) {
            populate_list();
        } else {

            // Disable the list
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.focus_attr, .focus_attr .select2-choice')
            .attr('disabled', disabled)
            .css('color', color);
    }

    function enable_all(except_base) {
        if (!except_base) {
            enable_base();
        }
        enable_corr();
        enable_value_types();
        enable_list();
    }

    function base_change(ev) {

        // Change handler for either of the sample-based or region-based
        var newVal = $sample_based.prop('checked');
        if (sample_based !== newVal) {
            sample_based = newVal;
            enable_all(true)
        }
    }

    function corr_change(ev) {

        // Change handler for either of the positive or negative correlation
        corr_neg = $corr_neg.prop('checked');
    }

    function list_option_change(ev) {

        // Change handler for the selected focus attribute
        focus_attr = $list.select2('val');
    }

	function sortIt() {
        if (Session.equals('focusSort', false)) {

            find_clumpiness_stats(current_layout_index);

        } else {

            // A sort on a focus attribute has been requested
            if (focus_attr === '') {
                return;
            }
            if (sample_based) {
                if (Session.equals('bin', false)
                        && Session.equals('cat', false)
                        && Session.equals('cont', false)) {
                    alert('At least one of these must be selected:\n\n\t- '
                        + $('.bin-label').text().trim() + '\n\t- '
                        + $('.cat-label').text().trim() + '\n\t- '
                        + $('.cont-label').text().trim());
                    return;
                }
                get_layout_ignore_stats(focus_attr, Session.get('bin'),
                    Session.get('cat'), Session.get('cont'));

            } else { // region-based requested
                get_layout_aware_stats(current_layout_index, focus_attr, corr_neg);
            }
         }
        destroy_dialog();
	}

    function listMessage (msg) {
        if (msg === 'clear') {
            Session.set('listMessageDisplay', 'none');
        } else {
            Session.set('listMessage', msg)
            Session.set('listMessageDisplay', 'inline')
        }
    }

    populate_list = function () {

        // This creates and populates the drop down with the
        // appropriate layers in the shortlist.

        // Reset the list
        try {
            $list.select2('destroy');
        }
        catch (error) {
            $.noop();
        }

        var focusList = _.filter(shortlist,
            function (layer_name) {

                // For layout-ignore, select all attributes from the short list
                if (sample_based) {
                    return true;

                // For layout-aware, select only binary data types
                } else if (ctx.bin_layers.indexOf(layer_name) > -1) {
                    return true;
                } else {
                    return false;
                }

                /* TODO for data type selection
                // Is the attribute in the binary layers list?
                if (Session.equals('bin', true)
                    && ctx.bin_layers.indexOf(layer_name) > -1) {
                    return true;
                }
                if (sample_based) {

                    // Is the attribute in the categorical or continuous list?
                    if ((Session.equals('cat', true)
                        && ctx.cat_layers.indexOf(layer_name) > -1)
                        ||  (Session.equals('cont', true)
                        && ctx.cont_layers.indexOf(layer_name) > -1)) {
                        return true;
                    }
                }
                return false;
                */
            }
        );

        // At least one attribute must be in the list.
        if (focusList.length < 1) {

            // Reset the focus attribute
            focus_attr = '';
            listMessage('No candidates in shortlist');

        } else {
            listMessage('clear');

            setTimeout(function () { // Flush UI to let the list message disappear

                // Transform the focus layer list into the form wanted by select2
                var data = _.map(focusList, function (layer) {
                    return { id: layer, text: layer }
                });

                // Create the select2 drop-down
                focus_attr = (focusList.indexOf(focus_attr) > -1) ? focus_attr : focusList[0];
                var opts = {data: data, minimumResultsForSearch: -1};
                createOurSelect2($list, opts, focus_attr);
            }, 0);
        }
    }

    function destroy_dialog() {
        try {
            $list.select2('destroy');
        }
        catch (error) {
            $.noop();
        }
        try {
            $dialog.dialog('destroy');
        }
        catch (error) {
            $.noop();
        }
    }

    function init_dialog () {

        // Initialize elements to current operating values
        $sample_based.prop('checked', sample_based);
        $corr_neg.prop('checked', corr_neg);

        // Enable the appropriate UI elements
        enable_all();

        $help.detach()
            .css('display', 'inline');
        $('.ui-dialog-buttonpane').append($help);

        // Event handlers
        $dialog
            .on('change', '#sortByFocus', function (ev) {
                Session.set('focusSort', ev.target.checked);
                enable_all();
            })
            .on('change', '#sortByDensity', function (ev) {
                Session.set('focusSort', !ev.target.checked);
                enable_all();
            })
            .on('change', '#sample-based, #region-based', base_change)
            .on('change', '.list', list_option_change)
            .on('change', '.bin', function (ev) {
                Session.set('bin', ev.target.checked);
                enable_list();
            })
            .on('change', '.cat', function (ev) {
                Session.set('cat', ev.target.checked);
                enable_list();
            })
            .on('change', '.cont', function (ev) {
                Session.set('cont', ev.target.checked);
                enable_list();
            })
            .on('change', '#corr-pos, #corr-neg', corr_change);
        $help.on('click', show_help);
    }

    function show_dialog () {
        $dialog.dialog({
            title: title,
            dialogClass: 'dialog',
            modal: true,
            minHeight: '10em',
            width: '25em',
            close: destroy_dialog,
            buttons: [{ text: 'Sort', click: sortIt }],
        });

        // Get all of the attributes in the shortlist
        shortlist = _.map($("#shortlist").children(),
            function (element, index) {
                return $(element).data("layer");
            }
        )

        setTimeout(init_dialog, 0); // give the dialog DOM a chance to load
    }

    init_sort_attrs = function () {

        // Initialize the session values
        Session.set('focusSort', true); // Sort is by focus attribute rather than by density
        sample_based = true; // sort is sample-based rather than region-based
        corr_neg = false; // sort by positive correlation
        $('#corr-pos').prop('checked', true);
        Session.set('bin', true); // binary values included
        Session.set('cat', true); // categorical values included
        Session.set('cont', true); // continuous values included
        Session.set('listMessageDisplay', 'none'); // set the list message display to none
        Session.set('listMessage', ''); // empty the list message
        focus_attr = '';

        // Set jquery element names
        $dialog = $('#sort-attributes-dialog');
        $sample_based = $('#sample-based');
        $corr_neg = $('#corr-neg');
        $list = $("#sort-attributes-dialog .list");
        $help = $('.help-button');

        // Handler for clicking the button on the toolbar
        $("#sort-attributes-button")
            .prop('title', title)
            .button()
            .click(function() {

                // Hide other functions so that if a dialog is visible,
                // it disappears from sight.
                reset_set_operations();
                reset_comparison_stats();

                show_dialog();
            });
    }
})(app);
