// filter.js: Filter the attributes displayed in the longlist by data type and
// tags.

import DialogHex from '/imports/common/DialogHex.js';
import tool from '/imports/mapPage/head/tool.js';
import userMsg from '/imports/common/userMsg';

import '/imports/mapPage/head/header.html';
import './filter.html';
import './filter.css';

var TITLE = 'Filter Attributes',
    BIN_LABEL = 'Binary',
    CAT_LABEL = 'Categorical',
    CONT_LABEL = 'Continuous',
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
    autorun = [],
    tagData;

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
    if (!tagData || tagData.length < 1) {
        return true;
    }

    if (!layers[layer].hasOwnProperty('tags')) {
        return (chk.equals('untagged', true));
    }

    // The layer has tags, so find the first matching checked tag
    var passed = _.find(tagList.get(), function(tag) {
        return (chk.equals(tag, true)
            && layers[layer].tags.indexOf(tag) > -1);
    });

    return (!_.isUndefined(passed));
}

function filterAttributes () {

    // Apply all the filters to the sorted list to get the new displayLayers
    var sorted = Session.get('sortedLayers');

    if (!_.isUndefined(sorted)) {
        Session.set('displayLayers', _.filter(sorted, passFilter));
    }
}

function processTags () {

    // Attach the tags to the layers and load them into the filter UI

    var sorted = Session.get('sortedLayers');

    // A few things need to be ready before we can process the tags
    // TODO don't need all of these checks with our new init
    if (!tagData || tagData.length < 1
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

function whenDisplayOrSortedLayersChange () {
    var display = Session.get('displayLayers'),
        sorted = Session.get('sortedLayers');
    if (!display || !sorted) { return; }

    if (display.length < 1 && Session.equals('mapSnake', false)) {
        userMsg.warn('No attributes to display, relax some filters');
        $passFilters.addClass('red');
    } else {
        $passFilters.removeClass('red');
    }

    // Set the button icon color depending on whether the display layers
    // length is the same as that of sorted layers.
    if (display.length === sorted.length) {
        $('.header .layer-row .filter').addClass('active');
        $('.header .layer-row .filter-hot').removeClass('active');
    } else {
        $('.header .layer-row .filter-hot').addClass('active');
        $('.header .layer-row .filter').removeClass('active');
    }

}

function hide() {
    _.each(autorun, function (run) {
        run.stop();
    });
    dialogHex.hide();
}

function show() {

    // Define functions to run when dialog reactive vars change
    autorun[0] = Tracker.autorun(whenDisplayOrSortedLayersChange);
    autorun[1] = Tracker.autorun(whenAllChanges);
    autorun[2] = Tracker.autorun(whenCheckboxesChange);
}

function init () {

    // Initialize the attribute filtering function, happens once per app load

    // Initialize the data type information
    _.each (dataTypeList, function (type) {
        chk.set(type, true);
        count.set(type, 0);
    });
    label.bin = BIN_LABEL;
    label.cat = CAT_LABEL;
    label.cont = CONT_LABEL;

    // Save jquery element names
    $dialog = $('.filterDialog');
    $button = $('.header .layer-row .filter, .header .layer-row .filter-hot');
    $passFilters = $('.passFilters');

    $('.header .layer-row .filter').addClass('active');

    // Set delegated event handlers just once
    $dialog
        .on('change', 'input', function (ev) {
            var data = $(ev.target).data();
            chk.set(data.tag, ev.target.checked);
        });

    // Define a function to run when the first attribute sort happens
    setTimeout(function () {
        tagsAutorun = Tracker.autorun(processTags);
    });

    // Create an instance of DialogHex
    dialogHex = DialogHex.create({
        $button: $button,
        $el: $dialog,
        opts: {title: TITLE},
        showFx: show,
        hideFx: hide,
        helpAnchor: '/help/filter.html',
    });

    // Create a link from the navBar
    tool.add("filterAttributes", function(ev) {
        $button.click();
        tool.activity(false);
    }, 'Filter attributes');
};
exports.clearAll = function () {

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

exports.requestLayerTagsError = function () {

    // Don't look for tags data anymore
    if (tagsAutorun) {
        tagsAutorun.stop();
    }
    init();
};

exports.receiveLayerTags = function (data) {
    if (data === '404') {

        // This means no tags were generated, which is just fine.
        exports.requestLayerTagsError();
    } else {
        init();
    }

    // Save the counts. Dynamic layer don't get reflected here.
    if (ctx.bin_layers) count.set('bin', ctx.bin_layers.length);
    if (ctx.cat_layers) count.set('cat', ctx.cat_layers.length);
    if (ctx.cont_layers) count.set('cont', ctx.cont_layers.length);

    // Update the untagged count
    if (taggedCount) {
        count.set('untagged', Session.get('sortedLayers').length - taggedCount);
    }

    tagData = data;
    processTags();
};
