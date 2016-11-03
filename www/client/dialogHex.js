// dialogHex.js
// Our wrapper around jquery-ui's dialog.
// A jquery element is passed in which is used as the trigger to open the
// dialog. Jquery-UI dialog options passed in are applied after our default
// dialog options. A help icon is provided in the header.

var app = app || {}; 

(function (hex) {

    DialogHex = function (parms, $el, opts, showFx, hideFx, helpAnchor) {

        if (parms) {
            this.$el = parms.$el ? parms.$el : undefined;
            this.opts = parms.opts ? parms.opts : undefined;
            this.showFx = parms.showFx ? parms.showFx : undefined;
            this.hideFx = parms.hideFx ? parms.hideFx : this.hide;
            this.helpAnchor = parms.helpAnchor ? parms.helpAnchor : undefined;
        } else {
            this.$el = $el;
            this.opts = opts;
            this.showFx = showFx;
            this.hideFx = hideFx ? hideFx : this.hide;
            this.helpAnchor = helpAnchor;
        }

        DialogHex.prototype.initHelp = function () {
             var $help = $("<a href='"
                + this.helpAnchor
                + "'  target='_blank'><img class='dialog-help' src='/icons/question.png'></a>");
            $('.ui-dialog-titlebar-close').before($help);
        }

        DialogHex.prototype.hide = function () {

            try {
                this.$el.dialog('destroy');
            } catch (er) {
                // The dialog may not have been initialized
            }
        }

        DialogHex.prototype.init = function () {

            var self = this,
                closeSvg = '/icons/close.svg';

            // Replace jqueryUI's sad close icon
            $('.ui-dialog-titlebar-close').css({
                'background-color': 'inherit',
                'background-image': 'url(' + closeSvg + ')',
                'border-size': '0',
                'width': '14',
                'height': '14',
            })
            .find('span').hide();

            if (this.helpAnchor) {
                this.initHelp();
            }
 
            if (this.showFx) {
                this.showFx(); // Call the instance init function
            }
            this.$el.dialog('open');
        }

        DialogHex.prototype.show = function () {
 
            // Initialize the dialog options to our favorite defaults
            var self = this,
                opts = {
                    dialogClass: 'dialog',
                    minHeight: '10em',
 
                    // 'resolve' seems to be an undocumented value that
                    // shrink-wraps the dialog around the content
                    width: 'resolve',
                    autoOpen: false,
                    close: self.hideFx,
                    position: { my: "center top", at: "center top+30", of: window },
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
                
                    // Recreate the dialog if the button is pressed while
                    // a dialog instance is defined.
                    if (self.$el.dialog('instance')) {
                        self.hideFx();
                    }
                    self.show();
                });
        }
    }

    createDialogHex = function (parms, $button, $el, opts, showFx, hideFx,
        helpAnchor) {

        /* Creates an instance of our dialog, which contains a button to open
         * the dialog in addition to a dialog
         *
         * @param parms: the preferred way to pass parms. if defined, the rest 
         *               of the parms are ignored. If undefined the parms are
         *               passed in separately following this parm
         * @param $button: jquery DOM element of the dialog activator
         *          where null indicates the button is already initialized
         * @param $el: jquery DOM element of the dialog anchor
         * @param opts: overrides of this class' jquery-ui dialog options
         * @param showFx: called after the show function of this class, optional
         * @param hideFx: called to destroy the jqueryui dialog, optional
         * @param helpAnchor: the html anchor in the user help doc
         */

        var instance = new DialogHex(parms, $el, opts, showFx, hideFx,
            helpAnchor);
        if (parms && parms.button) {
            instance.initButton(parms.$button);
        } else if ($button) {
            instance.initButton($button);
        }

        return instance;
    }
})(app);

