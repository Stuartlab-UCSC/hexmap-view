// sortAttrs.js
// This contains the logic for handling the sort attribute function.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort Attributes',
        disabled_color = '#aaaaaa',
        $dialog,
        $focus,
        $sample_based,
        $corr_neg,
        $bin,
        $cat,
        $cont,
        $list,
        $help_dialog,
        focus,
        sample_based,
        corr_neg,
        bin,
        cat,
        cont,
        focus_attr;

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

        if (!focus) {

            // Disable correlation options for focus sort
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.based').attr('disabled', disabled);
        //$dialog.find('#sample-based, #region-based').attr('disabled', disabled);
        $dialog.find('.based').css('color', color);
    }
    function enable_corr() {
        var disabled = false,
            color = 'inherit';

        if (!focus || sample_based) {

            // Disable correlation options for sample-based
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.corr').attr('disabled', disabled);
        $dialog.find('.corr').css('color', color);
    }

    function enable_value_types() {
        var disabled = false,
            color = 'inherit';

        if (!focus) {

            // Disable all value types for density sort
            disabled = true;
            color = disabled_color;
            $dialog.find('.bin, .cat, .cont').attr('disabled', disabled);
            $dialog.find('.bin, .cat, .cont').css('color', color);
            return;
        }

        // Enable binary with and without layout
        $dialog.find('.bin').attr('disabled', disabled);
        $dialog.find('.bin').css('color', color);

        if (!sample_based) {

            // Disable categorical and continuous for region-based
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.cat, .cont').attr('disabled', disabled);
        $dialog.find('.cat, .cont').css('color', color);
    }

    function enable_list() {
        var disabled = false,
            color = 'inherit';

        if (focus) {
            populate_list();
        } else {

            // Disable the list
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('.focus_attr').attr('disabled', disabled);
        $dialog.find('.focus_attr').css('color', color);
    }

    function enable_all(except_base) {
        if (!except_base) {
            enable_base();
        }
        enable_corr();
        enable_value_types();
        enable_list();
    }

    function focus_density_change(ev) {

        // Change handler for focus vs. density sort
        focus = $focus.prop('checked');
        enable_all();
    }

    function base_change(ev) {

        // Change handler for either of the sample-based or region-based
        sample_based = $sample_based.prop('checked');
        enable_all(true)

    }
    function corr_change(ev) {

        // Change handler for either of the positive or negative correlation
        corr_neg = $corr_neg.prop('checked');
    }

    function value_type_change(ev) {

        // Change handler for any of the value types
        bin = $bin.prop('checked');
        cat = $cat.prop('checked');
        cont = $cont.prop('checked');
        enable_list();
    }

    function list_option_change(ev) {

        // Change handler for the selected focus attribute
        focus_attr = $list.select2('val');
    }

	function sortIt() {
        if (!focus) {
            Session.set('sort', ctx.defaultSort());
            update_browse_ui();
            update_shortlist_ui();

        } else if (sample_based) {
            if (!bin && !cat) {
                alert('At least one of these must be selected:\n\n\t- '
                    + $('.bin-label').text().trim() + '\n\t- '
                    + $('.cat-label').text().trim());
                return;
            }
            getSortStats(focus_attr, bin, cat);

		} else { // region-based requested
			get_layout_aware_stats(current_layout_index, focus_attr, corr_neg);
        }
/*
		// TODO give a message Check to see which radio label is selected.
		if($("#region-based").is(":checked")) {
			print("The Mutual Information Stats Should Load Now...");
			clear_current_stats_values ();
			// The function to set the mututal information stats takes
			// the current layout index (global), the array containing
			// the name of the focus attribute and 1 for pair ranking 
			// (we don't want this) and 2 for sorting attributes (we want).
		}
*/
        destroy_dialog();
	}

    populate_list = function () {

        // This creates and populates the drop down with the
        // appropriate layers in the shortlist.

        // Reset the list
        $list.empty(); // TODO recreate or just change data?

        // Find the appropriate layers to put in the selection list
        var shortList = _.map($("#shortlist").children(),
                function (element, index) {
                    return $(element).data("layer");
                }
            ),
            focusList = _.filter(shortList,
                function (layer_name) {
                    if (ctx.bin_layers.indexOf(layer_name) > -1) {
                        return true;
                    } else if (sample_based) {
                        if (ctx.cat_layers.indexOf(layer_name) > -1
                            || ctx.cont_layers.indexOf(layer_name) > -1) {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            );

        // At least one attribute must be in the list.
        if (focusList.length < 1) {

            if (sample_based) {

                // Any value type is allowed when ignoring layout
                alert('To sort, add at least one attribute to the short list.');
            } else {

                // Region-based sort allows only binary value types
                alert('To sort, add at least one Label (yes/no) attribute to the short list.');
            }
            destroy_dialog();
            return;
        }

        // Transform the focus layer list into the form wanted by select2
        var data = _.map(focusList, function (layer) {
            return { id: layer, text: layer }
        });

        // Create the select2 drop-down
        // TODO recreate the select2 or just change data?
        // _.has(x, 'key');
        focus_attr = (focusList.indexOf(focus_attr) > -1) ? focus_attr : focusList[0];
        var opts = {data: data, minimumResultsForSearch: -1};
        createOurSelect2($list, opts, focus_attr);

        /* TODO
        $list.on("select2-selecting", function(event) {
            focus_attr = event.val;
        });
        */
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
        $focus.prop('checked', focus);
        $sample_based.prop('checked', sample_based);
        $bin.prop("checked", bin);
        $cat.prop("checked", cat);
        $cont.prop("checked", cont);
        $corr_neg.prop('checked', corr_neg);

        // Enable the appropriate UI elements
        enable_all();

        $help.detach()
            .css('display', 'inline');
        $('.ui-dialog-buttonpane').append($help);

        // Action handlers
        $dialog
            .on('change', '#sortByFocus, #sortByDensity', focus_density_change)
            .on('change', '#sample-based, #region-based', base_change)
            .on('change', '.list', list_option_change)
            .on('change', '.bin, .cat, .cont', value_type_change)
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
            buttons: [
                {
                    text: 'Sort',
                    click: sortIt
                },
            ],
        });
        setTimeout(init_dialog, 0); // give the dialog DOM a chance to load
    }

    init_sort_attrs = function () {

        // Initialize the session values
        focus = true; // Sort is by focus attribute rather than by density
        sample_based = true; // sort is sample-based rather than region-based
        corr_neg = false; // sort by positive correlation
        $('#corr-pos').prop('checked', true);
        bin = true; // binary values included
        cat = false; // categorical values included
        cont = false; // continuous values included
        focus_attr = '';

        // Set jquery element names
        $dialog = $('#sort-attributes-dialog');
        $focus = $('#sortByFocus');
        $sample_based = $('#sample-based');
        $bin = $dialog.find('.bin');
        $cat = $dialog.find('.cat');
        $cont = $dialog.find('.cont');
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

