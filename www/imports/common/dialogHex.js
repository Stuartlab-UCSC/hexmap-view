// dialogHex.js
// Our wrapper around jquery-ui's dialog.
// A jquery element is passed in which is used as the trigger to open the
// dialog. Jquery-UI dialog options passed in are applied after our default
// dialog options. A help icon is provided in the header.

DialogHexagon = function (parms, $el, opts, showFx, hideFx, helpAnchor) {

    if (parms) {
        this.$el = parms.$el ? parms.$el : undefined;
        this.opts = parms.opts ? parms.opts : undefined;
        this.preShowFx = parms.preShowFx ? parms.preShowFx : undefined;
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

    DialogHexagon.prototype.initHelp = function () {
         var $help = $("<a href='"
            + this.helpAnchor
            + "'  target='_blank'><img class='dialog-help' src='/icons/question.png'></a>");
        $('.ui-dialog-titlebar-close').before($help);
    }

    DialogHexagon.prototype.hide = function () {

        try {
            this.$el.dialog('destroy');
        } catch (er) {
            // The dialog may not have been initialized
        }
    }

    DialogHexagon.prototype.finishShow = function () {

        // Complete the show after the dom elements are built.
        var self = this;
        
        if (this.helpAnchor) {
            this.initHelp();
        }

        if (this.showFx) {
            this.showFx(); // Call the instance show function
        }

        this.$el.dialog('open');
    }

    DialogHexagon.prototype.show = function () {

        // Execute the instance pre-show function if there is one.
        if (this.preShowFx) {
            var good = this.preShowFx();

            // Abort the dialog show if the instance says to.
            if (!good) {
                return;
            }
        }

        // Initialize the dialog options to our favorite defaults
        var self = this,
            opts = {
                dialogClass: 'dialog',
                model: true,
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

        // Give the DOM a chance to load so we can find the elements
        Meteor.setTimeout(function () {
            self.finishShow();
        }, 0);
    }

    DialogHexagon.prototype.initButton = function ($button) {

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

exports.create = function (parms, $button, $el, opts, showFx, hideFx,
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
     * @param preShowFx: called before the show function of this class, 
     *                   optional
     * @param showFx: called after the show function of this class, optional
     * @param hideFx: called to destroy the jqueryui dialog, optional. If
     *                not provided, the default destroy method will be used.
     * @param helpAnchor: the html anchor in the user help doc
     */

    var instance = new DialogHexagon(parms, $el, opts, showFx, hideFx,
        helpAnchor);
    if (parms && parms.$button) {
        instance.initButton(parms.$button);
    } else if ($button) {
        instance.initButton($button);
    }

    return instance;
}
