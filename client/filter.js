// filter.js: Filter the attributes displayed in the longlist by data type and
// tags.

var app = app || {}; // jshint ignore:line

(function (hex) {

    var TITLE = 'Filter Attributes',
        BIN_LABEL = 'Labels (yes/no)',
        CAT_LABEL = 'Category',
        CONT_LABEL = 'Numeric',
        UNTAGGED_LABEL = 'Untagged attributes',
        dataTypeList = ['bin', 'cat', 'cont'],
        label = {
            bin: BIN_LABEL,
            cat: CAT_LABEL,
            cont: CONT_LABEL,
        },
        tagList = new ReactiveVar(),
        taggedCount, // Number of attributes with tags, assumed fixed per project

        // TODO for checked and count we could have name collisions on tags of:
        // bin, cat, cont, untagged
        chk = new ReactiveDict(),
        count = new ReactiveDict(),

        $dialog,
        $passFilters,
        tagsAutorun,
        tagData,
        hasTagInfo = false;

    // Meteor HTML template values
    
    Template.filterMessage.helpers ({
        display: function () {
            var display = Session.get('displayLayers');
            if (display) {
                return display.length;
            } else {
                return 1;
            }
        },
        total: function () {
            var sorted = Session.get('sortedLayers');
            if (sorted) {
                return sorted.length;
            } else {
                return 1;
            }
        },
    });
    Template.filterT.helpers ({
        display: function () {
            var display = Session.get('displayLayers');
            if (display) {
                return display.length;
            } else {
                return 1;
            }
        },
        total: function () {
            var sorted = Session.get('sortedLayers');
            if (sorted) {
                return sorted.length;
            } else {
                return 1;
            }
        },
        dataTypeList: function () {
            return dataTypeList;
        },
        label: function () {
            return label[this];
        },
        checked: function () {
            return chk.get(this);
        },
        count: function () {
            return count.get(this);
        },
        tagDisplay: function () {
            var list = tagList.get();
            if (list && list.length > 0) {
                return 'table-row';
            } else {
                return 'none';
            };
        },
        allTagschecked: function () {
            return chk.get('allTags');
        },
        untaggedChecked: function () {
            return chk.get('untagged');
        },
        untaggedCount: function () {
            return count.get('untagged');
        },
        tagList: function () {
            return tagList.get();
        },
        savechecked: function () {
            return chk.get('save');
        },
    });

    function passFilter(layer) {

        // Does this attribute pass the data type filters?
        if (chk.equals('bin', false) && ctx.bin_layers.indexOf(layer) > -1) {
            return false;
        }
        if (chk.equals('cat', false) && ctx.cat_layers.indexOf(layer) > -1) {
            return false;
        }
        if (chk.equals('cont', false) && ctx.cont_layers.indexOf(layer) > -1) {
            return false;
        }

        // If there is no tag information we're done with filters
        if (!hasTagInfo) {
            return true;
        }

        if (!layers[layer].tags) {
            return (chk.equals('untagged', true));
        }

        // The layer has tags, so find the first matching checked tag
        var passed = _.find(tagList.get(), function(tag) {
            return (chk.equals(tag, true)
                && layers[layer].tags.indexOf(tag) > -1);
        });

        return (!_.isUndefined(passed));
    }

    filterAttributes = function () {

        // Apply all the filters to the sorted list to get the new displayLayers
        Session.set('displayLayers',
            _.filter(Session.get('sortedLayers'), passFilter));
    }

    function processTags () {

        // Attach the tags to the layers and load them into the filter UI

        var sorted = Session.get('sortedLayers'),
            layersLoaded = Session.get('initialLayersLoaded');

        // A few things need to be ready before we can process the tags
        if (!tagData || tagData.length < 1 || !layersLoaded
            || !sorted || sorted.length < 0) return;

        // We don't want this to run anymore
        if (tagsAutorun) tagsAutorun.stop();

        // TODO how much of this do we want to load with each display of
        // the dialog and how much just once per tag file read?

        var layer,
            layerTags,
            uniqTags = [];
        taggedCount = 0;

        _.each(tagData, function (row) {
            layer = row[0],
            layerTags = row.slice(1);

            // If this layer exists...
            if (layers[layer]) {

                // Attach the tags to their layers
                layers[layer].tags = layerTags;
                taggedCount += 1;

                // Add to our unique tags list, initializing or updating counts
                _.each(layerTags, function (tag) {
                    if (uniqTags.indexOf(tag) < 0) {
                        uniqTags.push(tag);
                        count.set(tag, 1);
                        chk.set(tag, true);
                        label[tag] = tag;
                    } else {
                        count.set(tag, 1 + count.get(tag));
                    }
                });
            }
        });

        count.set('untagged', sorted.length - taggedCount);

        // Create the special tag values
        chk.set('allTags', true);
        chk.set('untagged', true);

        // Add the tag elements to the UI
        uniqTags.sort();
        tagList.set(uniqTags);
    }

    function requestLayerTags () {

        // Retrieve the layer tags data from the server
        Meteor.call('getTsvFile', 'attribute_tags.tab', ctx.project, Session.get('proxPre'),
                function (error, data) {
            if (error) {
                console.log('info', 'There are no filter attribute tags for this project. ' + error);

                // We don't want look for tags data anymore
                tagsAutorun.stop();

            } else {
                // Save the fact there is tag information for this project
                hasTagInfo = true;

                tagData = data;
                processTags();
            }
        });
    }

    function whenAllChanges () {

        // Whenever the 'all' checkbox changes, set all of the tag checkboxes
        // accordingingly
        var tags = tagList.get();

        if (chk.get('allTags') === true) {
            _.each(tags, function (tag) {
                chk.set(tag, true);
            });
            //chk.set('untagged', true);

        } else {
            _.each(tags, function (tag) {
                chk.set(tag, false);
            });
            //chk.set('untagged', false);
        }
    }

    function whenCheckboxesChange () {
        _.each(tagList.get(), function (tag, i) {
            if (tag !== 'all') {
                chk.get(tag);
            }
        });
        filterAttributes();
    }

    function whenDisplayLayersChange () {
        var display = Session.get('displayLayers');
        if (!display) return;

        if (display.length < 1) {
            banner('warn', 'No attributes to display, relax some filters');
            $passFilters.addClass('red');
        } else {
            $passFilters.removeClass('red');
        }
    }

    function whenSortedLayersChange () {
        var sorted = Session.get('sortedLayers');
        if (!sorted || sorted.length === 0) return;

        var display = Session.get('displayLayers');
        if (!display) return;

        // Update the data type counts. ctx.*_layers only change on project
        // load and possibly on sortedLayer change so this is not a bad
        // place to update their counts. For filtering purposes they do not
        // need to be reactive vars.
        if (ctx.bin_layers) count.set('bin', ctx.bin_layers.length);
        if (ctx.cat_layers) count.set('cat', ctx.cat_layers.length);
        if (ctx.cont_layers) count.set('cont', ctx.cont_layers.length);

        // Update the untagged count
        if (taggedCount) {
            count.set('untagged', sorted.length - taggedCount);
        }

        // Apply the filters
        filterAttributes();

        // Set the button icon color depending on whether the display layers
        // length is the same as that of sorted layers.
        if (Session.get('displayLayers').length === sorted.length) {
            $('.header .filter').addClass('active');
            $('.header .filterCaution').removeClass('active');
        } else {
            $('.header .filterCaution').addClass('active');
            $('.header .filter').removeClass('active');
        }
    }

    clearAllFilters = function () {

        // Set all the filters to the defaults, unless 'save' is checked
        if (chk.equals('save', true)) return;

        // Initialize the filter list to the data types
        var filters = dataTypeList;

        // If we have any tags, add those to the reset list
        if (!_.isUndefined(chk.get('allTags'))) {
            filters = filters.concat(tagList.get(), 'untagged', 'allTags');
        }

        // Set all of the filters to include everything
        _.each(filters, function (filter) {
            chk.set(filter, true);
        });

    }

    initFilter = function () {

        // Initialize the attribute filtering function, happens once per app load

        // Initialize some reactive vars
        Session.set('displayLayers', Session.get('sortedLayers'));

        // Initialize the data type information
        _.each (dataTypeList, function (type) {
            chk.set(type, true);
            count.set(type, 0);
        });
        chk.set('save', false); // To retain the filters on sort
        label.bin = BIN_LABEL;
        label.cat = CAT_LABEL;
        label.cont = CONT_LABEL;

        requestLayerTags();

        // Save jquery element names
        $dialog = $('.filterDialog');
        $button = $('.header .filter, .header .filterCaution');
        $passFilters = $('.passFilters');

        $('.header .filter').addClass('active');

        // Set delegated event handlers just once
        $dialog
            .on('change', 'input', function (ev) {
                var data = $(ev.target).data();
                chk.set(data.tag, ev.target.checked);
            });

        // Define functions to run when reactive vars change
        tagsAutorun = Tracker.autorun(processTags);
        Tracker.autorun(whenDisplayLayersChange);
        Tracker.autorun(whenSortedLayersChange);
        Tracker.autorun(whenAllChanges);
        Tracker.autorun(whenCheckboxesChange);

        // Create an instance of DialogHex
        dialogHex = createDialogHex($button, $dialog, {title: TITLE});
    }
})(app);

