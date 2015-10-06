// tests/mocha/client/testState.js

if (!(typeof MochaWeb === 'undefined')) {
    MochaWeb.testOnly(function () {

        describe ('Background color button', function () {
            it ('background tool button should exist', function () {
                Meteor.flush();
                chai.assert($("#tool_change-background").length, 1);
            });
            it ('background tool button should have a click handler', function () {
                Meteor.flush();
                chai.assert($("#tool_change-background").click);
            });
            it ('background dialog should no longer exist when color selected', function () {
                this.timeout(1000);
                Meteor.flush();
                $("#tool_change-background").click();
                $("#background_black").click();
                chai.assert($('.dialog').length, 0)
            });
        });

        describe ('Background color dialog', function () {
            after( function(){ $(".dialog .ui-button").click(); });

            it ('background dialog should exist when button clicked', function () {
                this.timeout(1000);
                Meteor.flush();
                $("#tool_change-background").click();
                chai.assert($('.dialog').length, 1)
            });
            it ('background should be black on initialization', function () {
                Meteor.flush();
                chai.assert(Session.equals('background', 'black')
            });
            it ('background should be white when white selected', function () {
                this.timeout(1000);
                Meteor.flush();
                $("#tool_change-background").click();
                $("#background_white").click();
                chai.assert(Session.equals('background', 'white');
            });
            it ('background should be black when black selected', function () {
                this.timeout(1000);
                Meteor.flush();
                $("#tool_change-background").click();
                $("#background_black").click();
                chai.assert(Session.equals('background', 'black');
            });
        });
        describe ('Foreground color button', function () {

            // foreground color edit tests require the pancan12 dataset be loaded
            it ('colorEdit tool button should exist', function () {
                Meteor.flush();
                chai.assert($("#tool_change-foreground").length, 1);
            });
            it ('colorEdit tool button should have a click handler', function () {
                Meteor.flush();
                chai.assert($("#tool_change-foreground").click);
            });
            it ('colorEdit dialog should no longer exist after dialog button pressed', function () {
                this.timeout(1000);
                Meteor.flush();
                $("#tool_change-foreground").click();
                $(".dialog .ui-button").click();
                chai.assert($('.dialog').length, 0)
            });
        });

        describe ('Foreground color dialog', function () {
            after( function(){ $(".dialog .ui-button").click(); });

            it ('colorEdit dialog should exist when button clicked', function () {
                this.timeout(1000); Meteor.flush(); $("#tool_change-foreground").click();
                chai.assert($('.dialog').length, 1)
            });
            it ('Buttons should exist', function () {
                 this.timeout(1000); Meteor.flush(); $("#tool_change-foreground").click();
                chai.assert($(".dialog .ui-button").length, 2);
            });
            it ('BLCA tissue entry should exist', function () {
                this.timeout(1000); Meteor.flush(); $("#tool_change-foreground").click();
                chai.assert($("#colormap_tissue0").length, 1);
            });
            it ('BLCA tissue should be #A5CFE7 on dialog open', function () {
                this.timeout(1000); Meteor.flush(); $("#tool_change-foreground").click();
                chai.assert($("#colormap_tissue0").val(), '#A5CFE7');
            });
            it ('BLCA tissue should change displayed color on losing focus', function () {
                this.timeout(1000); Meteor.flush(); $("#tool_change-foreground").click();
                var $in = $("#colormap_tissue0")
                $in.val('#ff0000');
                $in.focusout();
                chai.assert(colormaps['tissue'][0], '#ff0000');
            });
        });
    });
}
