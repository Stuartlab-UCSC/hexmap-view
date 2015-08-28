// sortAttrs.js
// This contains the logic for handling the sort attribute button.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort by Focus Attribute',
        $dialog,
        $list,
        $sort_binary,
        $sort_categorical,
        $sample_based,
        $help_dialog;


    function destroy_help() {
        $help_dialog.dialog('destroy');
    }

    function show_help() {
        $help_dialog = $('#sort-attributes-help-dialog');

        $help_dialog.dialog({
            title: 'Help: ' + title,
            dialogClass: 'dialog',
            width: '35em',
            close: destroy_help,
            position: { my: "right", at: "left-10", of: '#sort-attributes-dialog'},
        });
        $help_dialog.parent().find('button').blur();
    }

    function show_region_sample_section() {
        //$dialog.find('.region-sample-section').show();
    }

    function hide_region_sample_section() {
        $dialog.find('.region-sample-section').hide();
    }

    function show_region_section() {
        $dialog.find('.region-section').show();
    }

    function hide_region_section() {
        $dialog.find('.region-section').hide();
    }

    function show_sample_section () {
        $dialog.find('.sample-section').show();
        value_type_change();
    }

    function hide_sample_section () {
        $dialog.find('.sample-section').hide();
    }

    function show_dialog_buttons() {
        $dialog.parent().find('.ui-dialog-buttonpane').show();
    }

    function hide_dialog_buttons() {
        $dialog.parent().find('.ui-dialog-buttonpane').hide();
    }

    function show_list() {
        $dialog.find('.list').show();
    }

    function hide_list() {
        $dialog.find('.list').hide();
    }

    function hide_sections() {

        // Hide Layout Options and the "Sort" button
        hide_dialog_buttons();
        hide_region_sample_section();
        hide_region_section();
        hide_sample_section();
    }

    function value_type_change(ev) {

        oper.sort_binary = $sort_binary.prop('checked');
        oper.sort_categorical = $sort_categorical.prop('checked');

        // Change handler for any of the value types changing
        if (oper.sort_binary || oper.sort_categorical) {
            show_dialog_buttons();
        } else {
            hide_dialog_buttons();
        }
    }

    function list_option_change(ev) {

        // This is the change handler for the drop down displaying the 
        // attributes available as a focus attribute.

        if ($list.val() == "") {

            // Default Selected
            hide_sections();
        } else {

            // We've selected an actual layer
            show_region_sample_section();
            show_sample_section();
        }
    }

	function sortIt() {
		var focus_attr = $list.val(),
            binary = $sort_binary.prop('checked'),
            categorical = $sort_categorical.prop('checked');


		//if($sample_based.is(":checked")) { // Only sample-based is supported so far.
			clear_current_stats_values();
            get_association_stats_values(focus_attr, binary, categorical);
		//}
/*
		// Check to see which radio label is selected. 
		if($("#sort-region-based").is(":checked")) {
			print("The Mutual Information Stats Should Load Now...");
			clear_current_stats_values ();
			// The function to set the mututal information stats takes
			// the current layout index (global), the array containing
			// the name of the focus attribute and 1 for pair ranking 
			// (we don't want this) and 2 for sorting attributes (we want).
			get_mutual_information_statistics (current_layout_index, focus_attr, 2, $("#anticorrelated-only").is(":checked")); 
		}
*/
        destroy_dialog();
	}

    populate_list = function () {
        // This populates the drop down containing the list of layers
        // to match the appropriate layers found in the shortlist.

        // Reset the list
        $list.empty();

        // Add the default value.
        var $option = $('<option>');
        $option
            .text('Select...')
            .val('')
            .prop('selected', 'selected');
        $list.append($option);

        // Get the list of all layers in the shortlist except those that are
        // user creations (for which there are no stats). For now we don't support
        // continuous values.
        // TODO this is slow for just one element in the shortlist.
        $("#shortlist").children().each(function(index, element) {
            // Get the layer name
            var layer_name = $(element).data("layer");
            if (!layers[layer_name].selection // we don't support dynamic attributes yet
                    && oper.cont_layers.indexOf(layer_name) === -1) {
                $option = $('<option>');
                $option
                    .text(layer_name)
                    .val(layer_name);
                $list.append($option);
            }
        });
        setTimeout(show_list, 0);
        //show_list();
    }

    function destroy_dialog() {
        try {
            $dialog.dialog('destroy');
        }
        catch (error) {
            $.noop();
        }
        $dialog
            .off('click', '.help-button')
            .off('change', '.list')
            .off('click', '.sort-binary .sort-categorical');
    }

    function init_dialog () {

        // Hide pieces created by the dialog
        hide_dialog_buttons();

        // Initialize element jquery names
        $list = $("#sort-attributes-dialog .list");
        $sort_binary = $dialog.find('.sort-binary');
        $sort_categorical = $dialog.find('.sort-categorical');
        $sample_based = $('#sort-sample-based');

        // Initialize values to current operating values
        populate_list();
        $sample_based.prop('checked', oper.sort_sample_based);
        $sort_binary.prop("checked", oper.sort_binary);
        $sort_categorical.prop("checked", oper.sort_categorical);

        // Action handlers
        $dialog
            .on('click', '.help-button', show_help)
            .on('change', '.list', list_option_change)
            .on('change', '.sort-binary, .sort-categorical', value_type_change);
    }

    function show_dialog () {

        // Hide everything inside the dialog
        $dialog = $('#sort-attributes-dialog');
        hide_list();
        hide_sections();

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

        // Hide some sections
        //hide_sections();

        setTimeout(init_dialog, 0); // give the dialog dom a chance to load
    }

    init_sort_attrs = function () {

        // Initialize the operating values
        oper.sort_binary = true;
        oper.sort_categorical = true;
        oper.sort_sample_based = true;


        // Create the handler for pressing of the button on the toolbar
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

