// sortAttrs.js
// This contains the logic for handling the sort attribute button.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Sort by Focus Attribute';

    function destroy_help() {
        $('#sort-attributes-help-dialog').dialog('destroy');
    }

    function show_help() {
        $('#sort-attributes-help-dialog').dialog({
            title: 'Help: ' + title,
            dialogClass: 'dialog',
            close: destroy_help,
            position: { my: "right", at: "left-10", of: '#sort-attributes-dialog'},
        });
        $('#sort-attributes-help-dialog').parent().find('button').blur();
    }

    function show_region_sample() {
        $('.region-sample-options').show();
    }

    function hide_region_sample() {
        $('.region-sample-options').hide();
    }

    function show_region_based() {
        // Show options for region-based focus sort
        $(".region-based-options").show();
    }

    function hide_region_based() {
        // Hide options for region-based focus sort
        $(".region-based-options").hide();
    }

    function show_sample_based () {
        // Show sample_based Options "All Attributes", "Categorical",
        // "Continuous", etc.

        // Show everything
        $(".sample-based-options").show();
    }

    function hide_sample_based () {
        $(".sample-based-options").hide();
    }

    function hide_dialog_buttons() {
        $('#sort-attributes-dialog').parent().find('.ui-dialog-buttonpane').hide();
    }

    function show_dialog_buttons() {
        $('#sort-attributes-dialog').parent().find('.ui-dialog-buttonpane').show();
    }

    function hide_all() {

        // Hide Layout Options and the "Sort" button
        hide_dialog_buttons();
        hide_region_sample();
        hide_region_based();
        hide_sample_based();
    }

    function sample_type_change(ev) {

        // Change handler for any of the sample types changing
        //if ($('#sort-binary').prop('checked') !== 'checked'
        //        && $('#sort-categorical').prop('checked') !== 'checked') {
        if ($('#sort-binary').prop('checked')
                || $('#sort-categorical').prop('checked')) {
            show_dialog_buttons();
        } else {
            hide_dialog_buttons();
        }
    }

    function list_option_change(ev) {

        // This is the change handler for the drop down displaying the 
        // attributes available as a focus attribute.

        if ($("#sort-attributes-dialog .list").val() == "") {

            // Default Selected
            hide_all();
        } else {

            // We've selected an actual layer
            show_region_sample();
            show_sample_based();
        }
    }

    function get_association_stats_values(layer_name, binary, categorical) {
        // @param layer_name: the focus attribute
        // @param binary: true: compare focus attr against binary attrs, false: not
        // @param binary: true: compare focus attr against categorical attrs, false:not
        // @ returns: nothing

        // So far we only support combinations of binary and categorical values,
        // which use the chi-squared method.
            var layer_index = oper.layer_names_by_index.indexOf(layer_name),
                file = ctx.project + "layer_" + layer_index + "_chi2.tab";
            $.get(file, function(tsv_data) {
            //$.get(ctx.project + "colormaps.tab", function(tsv_data) {
                // This is an array of rows, which are arrays of values:
                //
                //	Layer1	Layer2	Layer 3...
                //	value	value	value

                // Parse the file
                var parsed = $.tsv.parseRows(tsv_data),
                    row_header = parsed[0],
                    layer_index = row_header.indexOf(layer_name),
                    stats_values = parsed[1],
                    compare_layer;

                for (var i = 0; i < row_header.length; i++){
                    compare_layer = row_header[i];
                    if ((binary && oper.bin_layers.indexOf(compare_layer) >= 0)
                            || (categorical && oper.cat_layers.indexOf(compare_layer) >= 0)) {
                        value = parseFloat(stats_values[i]);
                        layers[compare_layer].p_value = value;
                    }
                }
            }, "text")
            .done(function() {
                oper.current_sort_text = "(LI) Attributes Ranked According to: " + layer_name;
                update_browse_ui();
                update_shortlist_ui();
                oper.mutual_information_ranked = false; // TODO why when this is sample-based, not region-based


            })
            .fail(function() {
                complain("Association Stats Weren't Precomputed!");
                // var ranked_against_label = document.getElementById("ranked-against").style.visibility="hidden";
                oper.mutual_information_ranked = false;  // TODO why when this is sample-based, not region-based
            });
            var x = 0;
    //function get_association_stats_values(layer_name, single_stat, drop_down_val, layer_names) {
        // @param layer_name: the focus attribute name
        // @param single_stat: true: requesting only one value from the query, false: more values
        //                     Currently unused.
        // @param drop_down_val: 1: compare to other continuous values
        //                       0: compare to other binary values
        //                       Currently unused.
        // @param layer_names: only used if not single_stat
        //                     Currently unused.
        // @ returns: nothing

        // Download the Association Statistics file and fill in values for
        // Each layer depending on the layer_name
        // e.g. fill all pearson correlation values from tests ran between
        // layer_name and all other layers
        
        // TODO: rewrite in terms of with_association_stats

        // If single_stat == true, then the user is only requesting one value 
        // from the query.
    /* Not supporting single value compair nor continuous values yet
        if (single_stat == false) {

            // Determine if the selected layer has continuous or binary data values
            var continuous_type = false;

            // Determine if the selected layer has continuous or binary data values
            layer_index = oper.cont_layers.indexOf(layer_name);
            if (layer_index >= 0) {
                continuous_type = true;
            }
            // drop_down_val == 1, indicates that the user wants to compare
            // the selected attribute to other continuous values
            if (drop_down_val == 1 && continuous_type == true) {
                layer_index = oper.layer_names_by_index.indexOf(layer_name);
                $.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	Layer1	Layer2	Layer 3...
                    //	value	value	value
                    //
                    // Parse the file

                    var parsed = $.tsv.parseRows(tsv_data);
                    row_header = parsed[0];
            
                    stats_values = parsed[1];

                    for (var i = 0; i < row_header.length; i++){
                        compare_layer_name = row_header[i];
                        value = parseFloat(stats_values[i]);
                        layers[compare_layer_name].r_value = value;			
                    }

                }, "text")
                .done(function() {
                    oper.current_sort_text = "(LI) Attributes Ranked According to: " + layer_name;
                    update_browse_ui("r_value");
                    oper.mutual_information_ranked = false;

                })
                .fail(function() {
                    complain("Association Stats Weren't Precomputed!");
                });
            }
        }
    */

    /* Not supporting single value compare:
        // For Stats Query
        if (single_stat == true) {
            // Determine if layer 1 has continuous or binary data values
            var layer1_cont = false
            layer_index = oper.cont_layers.indexOf(layer_names[0]);
            if (layer_index > 0) {
                layer1_cont = true;
            }

            // Determine if layer 2 has continuous or binary values
            var layer2_cont = false
            layer_index = oper.cont_layers.indexOf(layer_names[1]);
            if (layer_index > 0) {
                layer2_cont = true;
            }
            
            // Look in Continuous_Continuous file if they are both Continuous
            if (layer1_cont == true & layer2_cont == true) {
                layer_index = oper.layer_names_by_index.indexOf(layer_names[0])
                $.get(ctx.project + "layer_" + layer_index + "_pear.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	id		Layer1	Layer2	Layer 3...
                    //	Layer1	value	value	value
                    //	Layer2	value	value	value
                    //	Layer3	value	value	value
                    //
                    // Parse the file

                    var parsed = $.tsv.parseRows(tsv_data);	
                    var row_header = parsed[0];
                    var layer2_index = row_header.indexOf(layer_names[1]);	
                    stats_value = parsed[1][layer2_index];	

                }, "text")
                .done(function() {

                })
                .fail(function() {
                    complain("Association Stats Weren't Precomputed!");
                });

                var type = "R-Coefficient: ";
                return type;
            }		

            // Look in b_b files if both are binary
            if (layer1_cont == false & layer2_cont == false) {
            
            $.get(ctx.project + layer_names[0] + "_b_b.tab", function(tsv_data) {
                    // This is an array of rows, which are arrays of values:
                    //
                    //	id		Layer1	Layer2	Layer 3...
                    //	Layer1	value	value	value
                    //	Layer2	value	value	value
                    //	Layer3	value	value	value
                    //
                    // Parse the file

                    parsed = $.tsv.parseRows(tsv_data);	
                    row_header = parsed[0];
                    layer2_index = row_header.indexOf(layer_names[1]);	
                    stats_value = parsed[1][layer2_index];	
                
                }, "text")
                .done(function() {

                })
                .fail(function() {
                    complain("Association Stats Weren't Precomputed!");
                });

                var type = "P-Value: ";
                return type;
            }
            
        }
    */
    }

	function sortIt() {
		var focus_attr = $("#sort-attributes-dialog .list").val(),
            binary = $('#sort-binary').prop('checked'),
            categorical = $('#sort-categorical').prop('checked');


		//if($("#sort-sample-based").is(":checked")) { // Only sample-based is supported so far.
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

        // Get the list of all layers in the shortlist except those that are
        // user creations (for which there are no stats). For now we don't support
        // continuous values.
        var shortlist_layers = [];
        $("#shortlist").children().each(function(index, element) {
            // Get the layer name
            var layer_name = $(element).data("layer");
            if (!layers[layer_name].selection
                    && oper.cont_layers.indexOf(layer_name) === -1) {
                shortlist_layers.push(layer_name);
            }
        });

        // Reset the list
        $('#sort-attributes-dialog .list').empty();

        // Add the default value.
        var $option = $('<option>');
        $option
            .text('Select...')
            .val('')
            .prop('selected', 'selected');
        $('#sort-attributes-dialog .list').append($option);

        // Add the layer names from the shortlist to the picklist. Make sure to put
        // layer names in the values since the text gets mangled by the html parser.
        for (var j = 0; j < shortlist_layers.length; j++) {
            $option = $('<option>');
            $option
                .text(shortlist_layers[j])
                .val(shortlist_layers[j]);
            $('#sort-attributes-dialog .list').append($option);
        }
    }

    function destroy_dialog() {
        try {
            $('#sort-attributes-dialog').dialog('destroy');
        }
        catch (error) {
            $.noop();
        }
        $('#sort-attributes-dialog')
            .off('click', '.help-button')
            .off('change', '.list')
            .off('click', '#sort-binary #sort-categorical');
    }

    function init_dialog () {

        // Hide dialog pieces not existing before
        hide_dialog_buttons();

        // Action handlers
        $('#sort-attributes-dialog')
            .on('click', '.help-button', show_help)
            .on('change', '.list', list_option_change)
            .on('change', '#sort-binary, #sort-categorical', sample_type_change);

        // Initialize values
        populate_list();
        $(".sample-based-options input").prop("checked", false);
    }

    function show_dialog () {

        $('#sort-attributes-dialog').dialog({
            title: title,
            dialogClass: 'dialog',
            modal: true,
            minHeight: '10em',
            width: '27em',
            close: destroy_dialog,
            buttons: [
                {
                    text: 'Sort',
                    click: sortIt
                },
            ],
        });

        // Hide optional controls
        hide_all();

        setTimeout(init_dialog, 0); // give the dialog dom a chance to load
    }

    init_sort_attrs = function () {

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

