// layerNameList.js
// A class for a layer name list

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var instance;

    LayerNameList = function ($anchor, $label) {

        this.$anchor = $anchor;
        this.$label = $label;
        this.selected = '';
        this.message = new ReactiveVar();
        this.filter = {};
        var self = this;

        LayerNameList.prototype.filterBinary = function (shortlist) {

            // Finds layer names in the shortlist that are binary
            return _.filter(shortlist,
                function (layerName) {
                    return (ctx.bin_layers.indexOf(layerName) > -1);
                }
            );
        }

        LayerNameList.prototype.filterSelection = function (shortlist) {

            // Finds layer names in the shortlist that are selections
            return _.filter(shortlist,
                function (layerName) {
                    return (layers[layerName].hasOwnProperty('selection'));
                }
            );
        }

        LayerNameList.prototype.populate = function (filter) {

            // This creates and populates the drop down with the
            // appropriate layers in the shortlist.

            // Reset the list
            try {
                this.$el.select2('destroy');
            }
            catch (error) {
                $.noop();
            }

            // Find the layer names in the short list, and filter if requested
            var shortlist = Session.get('shortlist'),
                list = shortlist;
            if (filter.binary) {
                list = this.filterBinary(shortlist);
            } else if (filter.selection) {
                list = this.filterSelection(shortlist);
            }

            // If at least 2 attributes must be in the list
            // and there are less than 2, give a message rather than a list
            if (filter.twoLayersRequired && list.length < 2) {
                this.message.set('Select two groups of hexagons');

            // Give a message rather than a list if there are no layers in the list
            } else if (list.length < 1) {
                if (filter.binary) {
                    this.message.set('Add label attribute to shortlist');
                } else if (filter.selection) {
                    this.message.set('Select a group of hexagons');
                } else {
                    this.message.set('Add an attribute to shortlist');
                }

            } else {
                // Flush UI to let the list message disappear
                var self = this;
                setTimeout(function () {

                    // Transform the layer list into the form wanted by select2
                    var data = _.map(list, function (layer) {
                        return { id: layer, text: layer }
                    });

                    // Create the select2 drop-down
                    if (list.indexOf(self.selected) < 0) {
                        self.selected = list[0];
                    }
                    var opts = {data: data, minimumResultsForSearch: -1};
                    createOurSelect2(self.$el, opts, self.selected);
                }, 0);
            }
        }

        LayerNameList.prototype.enable = function (enabled, filter) {

            // Enable or disable this list. If enabling, also populate the list

            // Undefined enable comes from an update of the shortlist
            if (_.isUndefined(enabled)) {

                // This means we should use our stored values to re-populate
                if (_.isUndefined(this.enabled)) {

                    // We have no stored values so just return
                    return;

                }
            } else {
                this.enabled = enabled;
                if (enabled) {
                    this.filter = filter;
                }
            }

            var color = this.enabled ? 'inherit' : DISABLED_COLOR;

            // Disable any list message up front
            this.message.set('');

            // Populate the list after applying filters to the shortlist
            if (this.enabled) {
                this.populate(this.filter);
            }

            // Apply to the list, it's choice element, and it's label
            this.$anchor.find('.list, .list .select2-choice')
                .attr('disabled', !this.enabled)
                .css('color', color);
            this.$label
                .attr('disabled', !this.enabled)
                .css('color', color);

            // Stupid override to make it red
            this.message.set(this.message.get());
        }

        LayerNameList.prototype.destroy = function () {

            // Remove any event listeners
            this.$el.off('change');

            // Stop any meteor tracker autoruns
            this.messageAutorun.stop();
            this.shortlistAutorun.stop();

            // Destroy the select2
            try {
                this.$el.select2('destroy');
            }
            catch (error) {
                $.noop();
            }
        }

        LayerNameList.prototype.emulateTrackerForClass = function () {

            // Whenever the message is set, display it with red
            // TODO Emulate meteor tracker's helper because we don't know how
            // to access this instance's reactive vars from the class
            this.messageAutorun = Tracker.autorun(function () {
                var message = self.message.get(),
                    $message = self.$anchor.find('.message');
                $message.text(message);
                if (message.length > 0) {
                    $message.css('color', 'red');
                    $message.css('display', 'inline');
                } else {
                    $message.css('display', 'none');
                }
            });
        }

        LayerNameList.prototype.init = function () {
            var self = this;

            // Initialize the reactive variables
            this.message.set('');

            this.emulateTrackerForClass();
            this.shortlistAutorun = Tracker.autorun(function () {
                Session.get('shortlist');
                self.enable();
            })

            this.$el = $anchor.find('.list');

            // Define the event handler for the selecting in the list
            this.$el.on('change', function (ev) {
                self.selected = ev.target.value;
            });
        }
    }

    createLayerNameList = function ($anchor, $label) {

        // Creates an instance of the LayerNameList.
        instance = new LayerNameList($anchor, $label);
        instance.init($anchor);
        return instance;
    }
})(app);
