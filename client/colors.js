
/* global add_tool, selected_tool, ctx, re_initialize_view, colormaps, Color, $, window */

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    // Define the colormap template helper, at this scope for some reason
    Template.colormapT.helpers({

        // Use the Session version of the colormap
        colorArray: function () {
            var colorArray = Session.get('colorArray')
            return colorArray;
        }
    });

    initColors = function () {

    // A tool to change the background color
        add_tool("change-background", "Background", function () {

            var $form = $('#backgroundDiv');

            Template.background.helpers ({
                whiteChecked: function () {
                    return (Session.equals('background', 'white'))
                        ? 'checked'
                        : '';
                }
            });

            function render() {

                // The modal dialog
                $form.dialog({
                    dialogClass: 'dialog',
                    modal: true,
                    minHeight: '10em',
                    width: '10em',
                    close: function () {
                        selected_tool = undefined;
                    }
                });
            }

            render();

            // Set the proper radio button according to state
            if (Session.equals('background', 'black')) {
                $('#backgroundBlack').prop('checked', true);
            } else {
                $('#backgroundWhite').prop('checked', true);
            }

            // When a radio button is clicked, change background and exit dialog
            // TODO meteorize?
            $form.on('click', 'input', function (event) {
                Meteor.setTimeout(function () { // Let the ui catch up
                    var val = $(event.target).attr('value');
                    if (!Session.equals('background', val)) {
                        Session.set('background', val);
                        re_initialize_view();
                    }
                    $form.dialog('close');
                }, 0);
            });

            // Deselect the tool.
            selected_tool = undefined;
        }, 'Change the background color', 'mapOnly');

        // Prepare a tool to change the colorMap

        findRowLayer = function ($row, colorArray) {

            // Find the layer in the colorArray from a row element
            var layerName = $row.find('td:first').attr('title');
            return _.find(colorArray, function (layer) {
                return (layer.name === layerName);
            });
        };

        findColumnCat = function ($input, colorArray) {

            // Find the category in the colorArray from an input element
            var layer = findRowLayer($input.parents('tr'), colorArray),
                $el = $input.parent().prev(),
                catName = $.trim(($el).text());

            // Trim and remove the trailing colon
            catName = catName.slice(0, catName.length - 1);

            // Return the wanted category
            return _.find(layer.cats, function (cat) {
                return (cat.name === catName);
            });
        };

        setCatAttrs = function (a) {

            // Set category input attributes that may change with user edits.
            if (rgbArrayToObj(a.operVal).dark()) {
                a.dark = 'dark';
            } else {
                a.dark = '';
            }
            if (a.operVal === a.fileVal) {
                a.isFileVal = 'isFileVal';
            } else {
                a.isFileVal = '';
            }
        };

        updateColormap = function (aCat) {

            // Update the colormap, then redraw the hexmap
            var layer = aCat.layer,
                catI;

            _.find(colormaps[layer], function (cat, i) {
                if (cat.name === aCat.name) {
                    catI = i;
                    return true;
                }
                return false;
            });
            colormaps[layer][catI].color = Color(aCat.operVal);
            re_initialize_view();
        };

        Template.colormapT.events({

            // Fires when a row is clicked.
            // Highlights the clicked row to make it easier for the user
            // to follow across all of the categories for this layer.
            'click tr': function (ev) {
                var $t = $(ev.currentTarget),

                    // Clear the 'selected' attribute of all layers
                    colorArray = _.map(Session.get('colorArray'), function (layer) {
                        var l = _.clone(layer);
                        l.selected = '';
                        return l;
                    }),
                    // Find the current layer in the color array
                    selected = findRowLayer($t, colorArray);
                selected.selected = 'selected';
                Session.set('colorArray', colorArray);
            },

            // Fires when a color input field loses focus.
            // Update its properties & the map
            'blur input': function (ev) {
                var $t = $(ev.currentTarget),
                    $row = $t.parents('tr'),
                    colorArray = Session.get('colorArray'),
                    cat = findColumnCat($t, colorArray),
                    newVal = $t.prop('value').trim().toUpperCase();

                if (cat.shaking === 'shaking') {

                    // nothing to do when the input box is shaking
                    return;
                }
                if (!newVal.match(/^#([A-F0-9]{6})$/)) {

                    // An invalid hex string, so set the Session to shake then
                    // set the Session to not shake and put the focus back to this
                    cat.shaking = 'shaking';
                    Session.set('colorArray', colorArray);
                    $t.effect('shake', null, null, function () {
                        cat.shaking = '';
                        Session.set('colorArray', colorArray);
                        $t.focus();
                    });
                    return;
                }
                $t.prop('value', newVal); // clean up the input box value
                if (newVal !== cat.operVal) {

                    // The new value is not the same as the operating color,
                    // so update the operating color & update the colormap
                    cat.operVal = newVal;
                    setCatAttrs(cat);
                    Session.set('colorArray', colorArray);
                    Meteor.flush();
                    updateColormap(cat);
                }
            },
            
            // Fires when a key is released in a color input field
            'keyup input': function (ev, otherKeyup) {
                var $t = $(ev.currentTarget),
                    newVal = $t.prop('value').trim(),
                    colorArray,
                    cat;

                if (newVal === '') {

                    // The textbox is empty so display the file color string
                    // so the user will know what that is
                    colorArray = Session.get('colorArray');
                    cat = findColumnCat($t, colorArray);
                    $t.prop('value', cat.fileVal)
                }
                if (ev.which === 13) {

                    // This is the return key, so trigger a blur event
                    $t.parent().next().next().find('input').focus();
                }
            },
        });

        // A tool to change the colorMap

        // Convert an rgb array, [66, 77, 88], to an object, {r:66, b:77, g:88}
        rgbArrayToObj = function (arr) {
            return new Color({r: arr[0], g: arr[1], b: arr[2]});
        };
/* BROKEN TODO
        add_tool("change-foreground", "ColorMap", function () {

            var $form = $('#colorMapDiv'),
                $link = $('#colorMapDiv a');

            function makeTsv($link) {
                var tsv = '';

                Object.keys(colormaps).forEach(function (layer) {
                    tsv += layer;
                    colormaps[layer].forEach(function (cat, catIndex) {
                        tsv += '\t' + catIndex + '\t' + cat.name + '\t' + cat.color.hexString();
                    });
                    tsv += '\n';
                });

                // Fill in the data URI for saving. We use the handy
                // window.bota encoding function.
                $link.attr("href", "data:text/plain;base64," + window.btoa(tsv));

                $link[0].click();
            }

           function render() {
                $form
                    .append($link)
                    .dialog({
                        dialogClass: 'dialog',
                        modal: true,
                        width: $(window).width() * 2 / 3,
                        height: $(window).height() * 2 / 3,
                        position: {my: 'left top', at: 'left top', of: window},
                        buttons: [
                            {
                                text: 'Done',
                                click: function () {
                                    $(this).dialog('close');
                                }
                            },
                            {
                                text: 'Download',
                                click: function () {
                                    makeTsv($link);
                                    $(this).dialog('close');
                                }
                            }
                        ],
                        close: function () {
                            selected_tool = undefined;
                        }
                    });
            }

            function colormapToColorArray() {

                // Convert the colormap into a form the template can use
                return _.map(colormaps, function(layerVal, layerKey) {
                    var cats = _.map(layerVal, function(val, key) {
                        var cat = {
                                name: val.name,
                                fileVal: rgbArrayToObj(val.fileColor.values.rgb).hexString(),
                                operVal: val.color.hexString(),
                                layer: layerKey,
                            };
                        setCatAttrs(cat);
                        return cat;
                    })
                    return {name: layerKey, cats: cats, selected: ''};
                });
            }

            Session.set('colorArray', colormapToColorArray());
            render();

            // Deselect the tool.
            selected_tool = undefined;
        }, 'Change colors of attributes', 'mapOnly');
*/
    }
})(app);

