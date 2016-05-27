// diffAnalysis.js
// This contains the logic for handling the differential analysis function.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var title = 'Differential Analysis',
        computingText = 'Computing differential Analysis now...',
        dialogHex,
        $dialog,
        list,
        list2,
        listSelected,
        listSelected2,
        ui = new ReactiveDict();

    /*
    // Make the variables in the html templates under our dynamic control here.
    Template.diffAnalysis.helpers({
        focusSort: function () {
            return (ui.get('sortBy') === 'focus');
        },
    });
    */

    function show () {

        // Show the contents of the dialog, once per opening button click
        var filters = {selection: true, twoLayersRequired: true};
        if (list2 && list2.selected) {
            filter.otherSelected = list2.otherSelected;
        }
        list = createLayerNameList($('#diffAnalysisDialog .listAnchor'),
                                   $('#diffAnalysisDialog .listLabel'),
                                   listSelected);
        list.enable(true, filters);

        if (list && list.selected) {
            filter.otherSelected = list.otherSelected;
        }
        list2 = createLayerNameList($('#diffAnalysisDialog .listAnchor2'),
                                    $('#diffAnalysisDialog .listLabel2'),
                                    listSelected2,
                                    list);
        list2.enable(true, filters);

        // TODO disable the button that displays the dialog, maybe with a progress wheel
    }

    function receive_data(result, attr, attr2, opts) {

        // These results are of the form:
        // [
        //      [layerName1, layerName2, value2],
        //      [layerName1, layerName3, value3],
        //      ...
        // ]
        for (var i = 0; i < parsed.length; i++) {

            // Extract the value
            count += updateLayerStat(focus_attr, parsed[i][1],
                parsed[i][2], type);
        }


        // Now we're done loading the stats, update the sort properties
        if (count < 1) {
            updateSortUi('noStats');
        } else {
            var text = (type === 'p_value')
                ? 'P-value by: ' + focus_attr + ' (ignoring layout)'
                : 'Differential by: ' + focus_attr;
            updateSortUi(type, text, focus_attr, opts);
        }

    }

    function runIt(attr, attr2) {

        banner('info', computingText);

        // Prepare the parameters for the server call
        var opts = {
            attr1: attr,
            attr2: attr2,
            directory: ctx.project,
            tempFile: 'yes',
            startDate: new Date(),
            tsv: true,
        };

        opts.dynamicData = gatherSelectionData();

        // A stub for the python call
        receive_data(result, attr, attr2, opts);

        /*
        // Make that server call
        Meteor.call('pythonCall', 'diffAnalysis', opts,
            function (error, result) {
                if (error) {
                    banner('error', error);
                } else if (result.slice(0,5).toLowerCase() === 'error') {
                    banner('error', result);
                } else if (result.slice(0,4).toLowerCase() === 'info') {
                    banner('info', result);
                } else {
                    receive_data(result, attr, attr2, opts);
                }
            }
        );
        */
    }

	 function runCheck () {
        var returnMessage,
            attr = list.selected,
            attr2 = list2.selected;

            if (!attr || !attr2) {
                // We should not be able to get here
                returnMessage = 'For some reason an attribute is not selected';

            } else if (attr === attr2) {
                returnMessage = 'Select two different attributes';

            } else { // Go do that differential analysis
                returnMessage = runIt(attr, attr2);
            }

        if (_.isUndefined(returnMessage)) {
            runIt(attr, attr2);
            dialogHex.destroyDialog();
        } else {
            banner('error', returnMessage);
        }
	}

    function justBeforeDestroy() {

        // Destroy some things just before the dialog destroy
        list.destroy();
        list = undefined;
        list2.destroy();
        list2 = undefined;
        // TODO enable the button that displays the dialog
    }

    initDiffAnalysis = function () {

        // Initialize the differential analysis functions, happens once per app reload

        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: title,
            buttons: [{ text: 'Run', click: runCheck }],
        };
        dialogHex = createDialogHex(
            $('#diffAnalysisButton'),
            $('#diffAnalysisDialog'),
            opts,
            show,
            justBeforeDestroy
        );
    }
})(app);
