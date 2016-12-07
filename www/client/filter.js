// filter.js: Filter the attributes displayed in the longlist by data type and
// tags.

var app = app || {}; 

(function (hex) {
    FILTERTEST =true;
    var BROWSE_LAYERS_SIZE = 1000;
    var TITLE = 'Filter Attributes',
        BIN_LABEL = 'Binary',
        CAT_LABEL = 'Category',
        CONT_LABEL = 'Numeric',
        UNTAGGED_LABEL = 'Untagged attributes',
        dataTypeList = ['bin', 'cat', 'cont'],
        realDataTypeLables = {
            bin  : "Binary",
            cat  : "Categorical",
            cont : "Continuous"
        },
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
        tagData,
        hasTagInfo = false;

    // Meteor HTML template values
    
    Template.filterMessage.helpers ({
        display: function () {
            var display = Session.get('displayLayers');
            //ATTRDB:
            // here is probably where we could interact with
            // the data base...
            // display above is a list of all the layers
            // in sorted ordered, we can replace that session
            // with a hook to our collection..? where our collection
            // only holds the next 150 layers or so...
            if (display) {
                return display.length;
            } else {
                return 1;
            }
        },
        total: function () {
            //ATTRDB:
            // this session is strange because 'sortedLayers' is equal to the
            // displayLayers above.
            // you can test this on the client by writing
            // _.isEqual(Session.get('sortedLayers',Session.get('displayLayers'))
            // maybe there something is done when they are not equal?
            // oh, they aren'y equal after filtering... we shouldm.n't need to
            // do this I dont think
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
            }
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

    //HACK Duncan is starting to filter using the database..
    // all you need to do that is to pass the tags you want to see
    // into the database
    getSelectedTags = function(){
        // returns the checked boxes from the long list
        //this function needs to interface with the longlist in the case
        // where we are getting data from Stuart Lab

        //get selected tags
        var tags = _.filter(tagList.get(), function(tag){
            return chk.get(tag);
        });

        //get selected datatypes
        var dtypes = _.filter(dataTypeList, function(dytpe){
            return chk.get(dytpe);
        });

        dtypes = _.map(dtypes,function (dtype) {
                return realDataTypeLables[dtype];
            }
        );

        var filters = {
            dtypes : dtypes,
            tags   : tags
        };
        //console.log(filters);
        return filters;
    };

    function passFilter(layer) {

        //ATTRDB:
        // this function gets called on every single layer,
        // every time anything in the filter box is clicked,
        // that seems unecessary, how bout we just change what 
        // layers/attributes are present in the local colleciton?
        // you can see the above by uncommenting the console.log below and 
        // playing with the filters box
        //console.log(layer);
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
        //ATTRDB
        /*
        attrHasTags(layer)
         */
        if (!layers[layer].hasOwnProperty('tags')) {
            return (chk.equals('untagged', true));
        }

        //ATTRDB
        /*
        attrHasTag(layer,tag);
         */
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
    
    filterAttributes2 = function () {
        // here we are going to populate the sorted layers based on a database
        // call... this happens when ever a check box changes....
        var filters = getSelectedTags();
        // Apply all the filters to the sorted list to get the new displayLayers
        var queryObj = {
            term: '', //TODO this shouldn't have to be an empty string...
            tags: filters.tags,
            dtypes: filters.dtypes,
            namespace: Session.get('namespace'),
            project: ctx.project,
            layout_name: String(Session.get('layoutIndex')),
            start: 0,
            page_size: BROWSE_LAYERS_SIZE
        };
        var results = [];
        console.log("starting call to populate sortedLayers... ")
        Meteor.call("longListQuery", queryObj, function (err, res) {
            if (err) {
                console.log("longListQuery from filter.js failed with error:", err);
            }
            else {
                //this filters the results down to the feild of interest...
                res.listResponse.forEach(function (doc) {
                    results.push(doc.name);
                });
                Session.set('sortedLayers', results)
                console.log("sortedLayers Set")
            }
        });
    };
    function processTags () {

        // Attach the tags to the layers and load them into the filter UI

        var sorted = Session.get('sortedLayers');

        // A few things need to be ready before we can process the tags
        // TODO don't need all of these checks with our new init
        if (!tagData || tagData.length < 1
            || !sorted || sorted.length < 0) {
            console.log("tags aren't running");
            return;
        }

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
            //ATTRDB
            //this function appears to be setting the tags of the layers
            // the tags are already in the attribute data base,
            // so this shouldn't be needed 
            /*
            attrHasLayer(layer)
             */
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
        //ATTRDB:
        if (TESTING){
            console.log("getting Tag data from server");
            tagData =attrRequestLayerTags();

            if(tagData.length > 1){
                console.log("there are tags, count", tagData.length -1 );
                processTags();
                hasTagInfo = true;
            } else {
                console.log('info', 'There are no filter attribute tags for this namespace.');

                // We don't want look for tags data anymore
                tagsAutorun.stop();
            }

        }
        else {
            Meteor.call('getTsvFile', 'attribute_tags.tab', ctx.project,
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
        console.log("when check boxes change called");
        _.each(tagList.get(), function (tag, i) {
            if (tag !== 'all') {
                chk.get(tag);
            }
        });
        filterAttributes();
    }

    function whenDisplayLayersChange () {
        //console.log("whenDisplayLayersChange called");
        var display = Session.get('displayLayers');
        if (!display) return;

        if (display.length < 1 && Session.equals('loadingMap', false)) {
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

        //ATTRDB:
        // does this make sense?
        if (ctx.bin_layers) count.set('bin', ctx.bin_layers.length);
        if (ctx.cat_layers) count.set('cat', ctx.cat_layers.length  );
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
        autorun[0] = Tracker.autorun(whenDisplayLayersChange);
        autorun[1] = Tracker.autorun(whenSortedLayersChange);
        autorun[2] = Tracker.autorun(whenAllChanges);
        autorun[3] = Tracker.autorun(whenCheckboxesChange);
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
        tagsAutorun = Tracker.autorun(processTags);

        // Create an instance of DialogHex
        dialogHex = createDialogHex(undefined, $button, $dialog, {title: TITLE},
            show, hide);
 
        // Create a link from the navBar
        add_tool("filterAttributes", function(ev) {
            $button.click();
            tool_activity(false);
        }, 'Filter attributes');
    }
})(app);

