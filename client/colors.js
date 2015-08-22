
/* global add_tool, oper, ctx, re_initialize_view, colormaps, Color, $, window */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    initColors = function () {

    // A tool to change the background color
    add_tool("change-background", "Background", function() {

        var $form, $black, $white;

        function renderChoice (color) {
            var $name = $("<input>" + color + "</input>")
                .attr({
                    name: 'backgroundColor',
                    value: color,
                    type: 'radio'
                })
                .css('margin', '0.5em');
            $form.append($('<label/>').css('margin', '1em').append($name));
            return $name;
        }

        function render () {

            $form = $("<form/>")
                .attr("title", "Background")
                .css('min-height', '3em')
                .css('padding', '0.5em');

            // A set of black or white choice buttons
            $black = renderChoice('black');
            $form.append($('<br>'));
            $white = renderChoice('white');

            // The modal dialog
            $form.dialog({
                dialogClass: 'dialog',
                modal: true,
                minHeight: '10em',
                width: '10em',
                close: function() {
                    oper.tool_selected = undefined;
                }
            });
        }

            render();

            // Set the proper radio button according to state
            if (ctx.background === 'black') {
                $black.prop('checked', true);
            } else {
                $white.prop('checked', true);
            }

            // When a radio button is clicked, change background and exit dialog
            $form.on('click', 'input', function(event) {
                ctx.background = $(event.target).attr('value');
                $form.dialog('close');
                re_initialize_view()
            });

		// Deselect the tool.	
		oper.tool_selected = undefined;
    });

    // A tool to change the colorMap
    add_tool("change-foreground", "ColorMap", function() {

        var $form;

        function makeTsv ($link) {
            var tsv = '';

            Object.keys(colormaps).forEach(function (layer) {
                tsv += layer;
                colormaps[layer].forEach(function (attr, j, array) {
                    tsv += '\t' + j + '\t' + attr.name + '\t' + attr.color.hexString();
                });
                tsv += '\n';
            });

            // Fill in the data URI for saving. We use the handy
            // window.bota encoding function.
            $link.attr("href", "data:text/plain;base64," + window.btoa(tsv));

            $link[0].click();
        }

        function setInputAttrs ($t, color, defalt) {
            var val = color.hexString();
            $t
                .prop('value', val)
                .data('operVal', val)
                .css('background-color', val);
            $t.removeClass('empty');
            if (color.dark()) {
                $t.addClass('dark');
            } else {
                $t.removeClass('dark');
            }
            if (defalt) {
                $t.addClass('defalt');
            } else {
                $t.removeClass('defalt');
            }
        }

        function focusout (ev) {

            // When a textbox loses focus,
            // update its properties & update the map
            var $t = $(ev.target),
                newVal = $t.prop('value').trim().toUpperCase(),
                operVal = $t.data('operVal'),
                fileVal,
                fileColor,
                category;

            $t.removeClass('empty');

            if (newVal === operVal) {

                // No change, so clean up the textbox & bail
                $t.prop('value', operVal);
                return;
            }
            category = colormaps[$t.data('layer')][$t.data('index')]
            fileColor = category.fileColor;
            fileVal = fileColor.hexString();

            if (newVal === fileVal || (newVal === '' && operVal !== fileVal)) {

                // The new value is the same as the color in the file,
                // or the new value is empty and the operating color is
                // different than the color in the file.
                // Either way, update the operating color & textbox to the
                // color in the file
                category.color = fileColor;
                setInputAttrs($t, fileColor, true);

            } else if (!newVal.match(/^#([a-fA-F0-9]{6})$/)) {

                // An invalid hex string, so disable the event
                // handling while we shake the textbox, then bail
                $form.off('focusout', 'input');
                $t.effect('shake', null, null, function () {
                    $form.on('focusout', 'input', focusout);
                    $t.focus();
                });
                return;

            } else {
                // The new value is not the same as the operating or file color,
                // so update the operating color & clean up the textbox
                category.color = Color(newVal);
                setInputAttrs($t, category.color, false);
            }
            re_initialize_view() // Update the map with the new color
        }

        function keyup (ev) {

            // When a textbox loses focus & has changed,
            // update its properties & update the map
            var $t = $(ev.target),
                newVal = $t.prop('value').trim(),
                category;

            $t.removeClass('empty');

            if (ev.keyCode === 13) {
                focusout(ev);

            } else if (newVal === '') {

                // When the textbox is empty, display the file color string
                // so the user will know what that is
                category = colormaps[$t.data('layer')][$t.data('index')]
                $t
                    .prop('value', category.fileColor.hexString())
                    .addClass('empty');
            }
        }

        function renderTableBody ($tbody) {
            var $row, $input, title, color;

            // Step through the layers/attributes in the colormap,
            // adding a row for each
            Object.keys(colormaps).forEach(function (layer) {
                $row = $('<tr/>');
                $tbody.append($row);
                $row.append($('<td/>')
                    .prop('title', layer)
                    .text(layer + ':')
                );

                // Step through the attribute's categories,
                // adding a label and color cell for each
                colormaps[layer].forEach(function (attr, j) {
                    title = attr.name + " of " + layer;
                    color = attr.color;
                    $input = $('<input/>')
                        .data({
                            layer: layer,
                            index: j,
                            operVal: color.hexString()
                        })
                        .prop({
                            'title': title,
                            'value': color.hexString()
                        })
                        .css('background-color', color.hexString());
                    if (color.dark()) {
                        $input.addClass('dark');
                    }
                    if (color.hexString() === attr.fileColor.hexString()) {
                        $input.addClass('defalt');
                    }
                    $row
                        .append($('<td/>')
                            .prop('title', title)
                            .text(attr.name + ':')
                        )
                        .append($('<td/>')
                            .append($input)
                        );
                 });
            });
        }

        function render () {
            var $form = $('<form/>'),
                $tbody = $('<tbody/>'),
                hint;

            // a table of colors in the same format as
            // the colormaps.tab file, minus the indexes
            $form
                .attr('title', 'ColorMap')
                .append($('<table/>')
                    .prop('id', 'colorTable')

                    // Add the table header
                    .append($('<thead/>')
                        .append($('<tr/>')
                            .append($('<td/>').text('Attribute'))
                            .append($('<td/>').text('Category'))
                            .append($('<td/>').text('Color'))
                            .append($('<td/>').text('...'))
                        )
                    )
                    .append($tbody)
                );

            renderTableBody($tbody);

            hint = "<div style='font-size:0.9em;padding-top:0.3em'>"
                + "Hint: Restore a color from the colormaps file by"
                + " emptying the text-box.</div>"
            $form.append($(hint))

            // Add a hidden download file link. The "download"
            // attribute makes the browser save it, and the
            // href data URI holds the data
            $link = $('<a/>')
                .attr({
                    'download': 'colormaps.tab',
                    'href': 'used later'
                })
                .text('download')
                .css('display', 'none');

            $form
                .append($link)
                .dialog({
                    dialogClass: 'dialog',
                    modal: true,
                    width: $(window).width() * 2 / 3, //'54em',
                    height: $(window).height() * 2 / 3,
                    maxHeight: $(window).height(),
                    position: {my: 'left top', at: 'left top', of: window},
                    buttons: [
                        {text: 'Done',
                            click: function() {
                                $(this).dialog('close');
                            }
                        },
                        {text: 'Download',
                            click: function() {
                                makeTsv($link);
                                $(this).dialog('close');
                            }
                        }
                    ],
                    close: function() {
                        oper.tool_selected = undefined;
                    }
                })
            return $form;
        }

            $form = render();
            $form

                // Highlight the clicked row to make it easier to follow
                // across all of the categories for this attribute
                .on('click', 'tr', function(event) {
                    $form.find('tr').removeClass('selected');
                    $(event.target).parents('tr').addClass('selected');
                })

                // Handle events from the color input textbox
                .on('keyup', 'input', keyup)
                .on('focusout', 'input', focusout);

		// Deselect the tool.	
		oper.tool_selected = undefined;

    });
    }
})(app);

