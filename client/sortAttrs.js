// sortAttrs.js
// This contains the logic for handling the sort attribute function.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort by Focus Attribute',
        disabled_color = '#aaaaaa',
        $dialog,
        $sample_based,
        $corr_neg,
        $list,
        $bin,
        $cat,
        $cont,
        $help_dialog,
        focus_attr,
        sample_based,
        corr_neg,
        bin,
        cat,
        cont;

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

    function enable_proper_corr(ev) {
        var disabled = false,
            color = 'inherit';

        // Anticorrelation association only applies to mutual info stats.
        if (sample_based) {

            // Disable correlation options for sample-based
            disabled = true;
            color = disabled_color;
        }
        $dialog.find('#corr-pos, #corr-neg').attr('disabled', disabled);
        $dialog.find('.corr-label, .corr-pos-label, .corr-neg-label').css('color', color);
    }

    function enable_proper_value_types(ev) {
        var disabled = false,
            color = 'inherit';

        // Always disable continuous values for now
        $cont.attr('disabled', true);
        $dialog.find('.cont-label').css('color', disabled_color);

        if (!sample_based) {

            // Disable categorical values for region-based
            disabled = true;
            color = disabled_color;
        }
        $cat.attr('disabled', disabled);
        $dialog.find('.cat-label').css('color', color);

    }

    function sort_base_change(ev) {

        // Change handler for either of the sample-based or region-based
        sample_based = $sample_based.prop('checked');
        populate_list();
        enable_proper_value_types();
        enable_proper_corr();
    }

    function corr_change(ev) {

        // Change handler for either of the positive or negative correlation
        corr_neg = $corr_neg.prop('checked');
    }

    function list_option_change(ev) {

        // Change handler for the selected focus attribute
        focus_attr = $list.val();
    }

    function value_type_change(ev) {

        // Change handler for any of the value types
        bin = $bin.prop('checked');
        cat = $cat.prop('checked');
        cont = $cont.prop('checked');
    }

	function sortIt() {
        if (focus_attr === 'none') {
            alert('A focus attribute must be selected.');
            return;
        }
		if(sample_based) {
            if (!bin && !cat) {
                alert('At least one of these must be selected:\n\n\t- '
                    + $('.bin-label').text().trim() + '\n\t- '
                    + $('.cat-label').text().trim());
                return;
            }
            get_association_stats_values(focus_attr, bin, cat);

		} else { // region-based requested
			get_mutual_information_statistics (current_layout_index, focus_attr, 'rank', corr_neg);
        }
/*
		// Check to see which radio label is selected. 
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
        // This populates the drop down containing the list of layers
        // to match the appropriate layers found in the shortlist.

        var count = 1; // initialize the count to have only the filler option

        // Reset the list
        $list.empty();

        // Add the default value.
        var $option = $('<option>');
        $option
            .text('Select...')
            .val('none')
            .prop('selected', 'selected');
        $list.append($option);

        // Get the list of all layers in the shortlist except those that are
        // user creations (for which there are no stats). For now we don't support
        // continuous values.
        // TODO this is slow for just one element in the shortlist.
        $("#shortlist").children().each(function(index, element) {
            // Get the layer name
            var layer_name = $(element).data("layer");
            if (ctx.bin_layers.indexOf(layer_name) > -1
                    && _.isUndefined(layers[layer_name].selection)) {
                $option = $('<option>');
                $option
                    .text(layer_name)
                    .val(layer_name);
                $list.append($option);
                count += 1;
            }
        });
        $option = $('option[value="' + focus_attr + '"]');
        $option.attr('selected', 'selected');
        if (count < 2) {
            alert('To sort by a focus attribute, add at least one Label (yes/no) attribute to the short list.');
            destroy_dialog();
        }
    }

    function destroy_dialog() {
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
        populate_list();
        $bin.prop("checked", bin);
        $cat.prop("checked", cat);
        $cont.prop("checked", cont);
        enable_proper_value_types();
        $corr_neg.prop('checked', corr_neg);
        enable_proper_corr();

        $help.detach()
            .css('display', 'inline');
        $('.ui-dialog-buttonpane').append($help);

        // Action handlers
        $dialog
            .on('change', '#sample-based, #region-based', sort_base_change)
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
            width: '34em',
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
        sample_based = true; // sort is sample-based
        focus_attr = 'none';
        bin = true; // binary values included
        cat = false; // categorical values included
        cont = false; // continuous values included
        corr_neg = false; // sort by positive correlation
        $('#corr-pos').prop('checked', true);

        // Set element jquery names
        $dialog = $('#sort-attributes-dialog');
        $sample_based = $('#sample-based');
        $list = $("#sort-attributes-dialog .list");
        $bin = $dialog.find('.bin');
        $cat = $dialog.find('.cat');
        $cont = $dialog.find('.cont');
        $corr_neg = $('#corr-neg');
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

