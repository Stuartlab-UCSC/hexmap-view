// layerNameList.js
// A class for a layer name list

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    LayerNameList = function ($anchor, $label, selected, firstList) {

        this.$anchor = $anchor;
        this.$label = $label;
        this.selected = selected;
        this.firstList = firstList;
        this.message = new ReactiveVar();
        this.filter = {},
        this.shortListUpdateCount;

        LayerNameList.prototype.filterer = function (filter) {

            // Find the layer names in the short list
            var list = Session.get('shortlist').slice();

            if (filter.binary) {

                // Filter on binary layers
                list = _.filter(list,
                    function (layerName) {
                        return (ctx.bin_layers.indexOf(layerName) > -1);
                    }
                );
            }

             // Filter on selection layers
            if (filter.selection) {
                list = _.filter(list,
                    function (layerName) {
                        try {
                            return (layers[layerName].hasOwnProperty('selection'));
                        }
                        catch (error) {
                            console.log('lllllllllll layerName:', layerName);
                            return false;
                        }
                    }
                );
            }

            return list;
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

            // Apply the filters to the shortlist
            var list = this.filterer(filter);

            // If at least 2 attributes must be in the list
            // and there are less than 2, give a message rather than a list
            if (this.firstList && list.length < 2) {
                // We assume 2 lists means they are both filtered by selections
                this.message.set('Select another group of hexagons');

            // Give a message rather than a list if there are no layers in the list
            } else if (list.length < 1) {
                if (filter.binary) {
                    this.message.set('Add label attribute to shortlist');
                } else if (filter.selection) {
                    this.message.set('Select a group of hexagons');
                } else {
                    this.message.set('Add an attribute to shortlist');
                }
                this.selected = undefined;

            } else {
                // Flush UI to let the list message disappear
                var self = this;
                setTimeout(function () {

                    // Transform the layer list into the form wanted by select2
                    var data = _.map(list, function (layer) {
                        return { id: layer, text: layer }
                    });

                    // Determine the selected item on the list
                    if (list.indexOf(self.selected) < 0) {
                        self.selected = list[0];
                        if (self.firstList
                            && self.firstList.selected === self.selected) {
                            self.selected = list[1];
                        }
                    }

                    // Create the select2 list
                    createOurSelect2(self.$el, {data: data}, self.selected);
                }, 0);
            }
        }

        LayerNameList.prototype.enable = function (enabled, filter) {

            // Enable or disable this list. If enabling, also populate the list
            // Valid filters are:
            //      binary: true: only include binary layers
            //      selection: true: only include selection layers

            if (_.isUndefined(enabled)) {

                // Undefined enable comes from an update of the shortlist
                // This means we should use our stored values to re-populate
                if (_.isUndefined(this.enabled)) {

                    // We've not yet been enabled by the caller, so we
                    // have no stored values so just return
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

            // Stupid override to make the message red
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
            var self = this;
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
                // TODO an abuse of meteor session vars, because this is called
                // at times when the session var is not updated
                var count = Session.get('shortlistUiUpdated');
                if (_.isUndefined(self.shortListUpdateCount)) {
                    self.shortListUpdateCount = count;
                    self.enable();
                } else {
                    if (count !== self.shortListUpdateCount) {
                        self.shortListUpdateCount = count;
                        self.enable();
                    }
                }
            });

            this.$el = $anchor.find('.list');

            // Define the event handler for the selecting in the list
            this.$el.on('change', function (ev) {
                self.selected = ev.target.value;
            });
        }
    }

    createLayerNameList = function ($anchor, $label, selected, firstList) {

        // Creates an instance of the LayerNameList.
        var instance = new LayerNameList($anchor, $label, selected, firstList);
        instance.init($anchor);
        return instance;
    }
})(app);
