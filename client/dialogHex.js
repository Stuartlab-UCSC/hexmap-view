// dialogHex.js
// Our wrapper around jquery-ui's dialog.
// A jquery element is passed in which is used as the trigger to open the
// dialog. Jquery-UI dialog options passed in are applied after our default
// dialog options. A help icon is provided in the header.

var app = app || {}; // jshint ignore:line

(function (hex) {

    DialogHex = function ($el, opts, initFx, destroyFx) {

        this.$el = $el;
        this.opts = opts;
        this.initFx = initFx;
        this.destroyFx = destroyFx;
        this.$help = $('.help-button');

        DialogHex.prototype.showHelp = function () {

            // This should either take a
            alert('Sorry, no help here yet for "' + opts.title + '"');
        }

        DialogHex.prototype.destroyDialog = function () {

            try {
                this.destroyFx(); // Call the instance destroy function
            }
            catch (error) {
                $.noop();
            }

            try {
                this.$el.dialog('destroy');
            }
            catch (error) {
                $.noop();
            }
        }

        DialogHex.prototype.init = function () {

            var self = this;
            /* TODO disable this until we have some help
            this.$help.detach()
                .css('display', 'inline');
            $('.ui-dialog-titlebar-close').before(self.$help);

            // Event handlers
            // Remove any old help handlers from other dialogs using it
            this.$help.off('click')
                .on('click', self.showHelp);
            */
            
            this.initFx(); // Call the instance init function
        }

        DialogHex.prototype.show = function () {

            // Initialize the dialog options to our favorite defaults
            var self = this,
                opts = {
                    dialogClass: 'dialog',
                    minHeight: '10em',
                    width: '30em',
                    close: function () {
                        self.destroyDialog();
                    },
            };

            // Override the defaults or add options from the caller
            for (var key in this.opts) {
                if (this.opts.hasOwnProperty(key)) {
                    opts[key] = this.opts[key];
                }
            };
            this.$el.dialog(opts);

            // Give the DOM a chance to load so we can find the elements in init
            setTimeout(function () {
                self.init();
            }, 0);
        }

        DialogHex.prototype.initButton = function ($button) {

            // Give the button jquery-ui style and create a click handler for it
            var self = this;
            $button
                .prop('title', this.opts.title)
                .button()
                .click(function() {

                    // Handler for clicking the button on the header
                    // Hide other functions so that if a dialog is visible,
                    // it disappears from sight.
                    // TODO we can remove this if the other dialogs become
                    // jquery-ui modal dialogs
                    // or maybe we don't want modals anywhere?
                    reset_set_operations();

                    self.show();
                });
        }
    }

    createDialogHex = function ($button, $el, opts, initFx, destroyFx) {

        /* Creates an instance of our dialog, which contains a button to open
         * the dialog in addition to a dialog
         *
         * @param $button: jquery DOM element of the dialog activator
         * @param $el: jquery DOM element of the dialog anchor
         * @param opts: overrides of this class' jquery-ui dialog options
         * @param initFx: called after the init function of this class
         * @param destroyFx: called before the destroy function of this class, 
         *                      optional
         */
        var instance = new DialogHex($el, opts, initFx, destroyFx);
        instance.initButton($button);
        return instance;
    }
})(app);

