
var app = app || {}; 

(function (hex) { 
    //'use strict';

    // Some global colors
    COLOR_BINARY_OFF = '#333';          // binary attr off
    COLOR_BINARY_ON = '#FFFF00';        // binary attr on
    COLOR_BINARY_BOTH_ON = '#00FF00';   // binary both attrs on
    COLOR_BINARY_SECOND_ON = '#0000FF'; // binary second attr on

    // The color to use as hexagon fill, depending on the background color
    var NO_DATA_LIGHT_BG = '#ccc',
        NO_DATA_DARK_BG = '#555',
        badValue = false; // The current category input has a bad value

    noDataColor = function () {
        return (Session.equals('background', 'white'))
            ? NO_DATA_LIGHT_BG
            : NO_DATA_DARK_BG;
    }

    // Define the colormap template helper, at this scope for some reason
    Template.colormapT.helpers({

        // Use the Session version of the colormap
        colorArray: function () {
            // TODO this should be a local reactiveVar rather than a global session var
            var colorArray = Session.get('colorArray')
            return colorArray;
        }
    });

    // Define the background color template helper
    Template.navBarT.helpers({

        background: function () {
            if (Session.get('background') === 'black') {
                return 'White';
            } else {
                return 'Black';
            }
        }
    });

    initColors = function () {

        $('#background').on('click', function () {
            if (Session.equals('background', 'white')) {
                Session.set('background', 'black');
            } else {
                Session.set('background', 'white');
            }
            // The background change requires a new map to show the background.
            createMap();
            createHexagons();
            refreshColors();
            showOverlayNodes();
        });
 
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
            refreshColors();
        };

        // Convert an rgb array, [66, 77, 88], to an object, {r:66, b:77, g:88}
        rgbArrayToObj = function (arr) {
            return new Color({r: arr[0], g: arr[1], b: arr[2]});
        };

        add_tool("colormap", function () {

            // A tool to change the colorMap
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

            function rowClick(ev) {

                // Fires when a row is clicked.
                // Highlights the clicked row to make it easier for the user
                // to follow across all of the categories for this layer.
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
            }

            function inputBlur (ev) {

                // Fires when a color input field loses focus.
                // Update its properties & the map
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
                    badValue = true;
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
                    badValue = false;
                }
            }

            function inputKeyup (ev) {

                // Fires when a key is released in a color input field
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
                                text: 'Download',
                                click: function () {
                                    if (!badValue) {
                                        makeTsv($link);
                                        $(this).dialog('close');
                                    }
                                }
                            }
                        ],
                        close: function () {
                            tool_activity(false);
                        }
                    })
                    .on('click', 'tr', rowClick)
                    .on('blur', 'input', inputBlur)
                    .on('keyup', 'input', inputKeyup);
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
            tool_activity(false);
        }, 'Change colors of attributes', 'mapShow');
    }
})(app);

