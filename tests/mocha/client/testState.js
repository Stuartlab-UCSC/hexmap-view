// tests/mocha/client/testState.js


if (!(typeof MochaWeb === 'undefined')) {
    MochaWeb.testOnly(function () {

        describe ('State', function () {

            it ('initState should exist', function () {
                Meteor.flush();
                chai.assert(initState);
            });
            it ('state attributes & methods should exist', function () {
                Meteor.flush();
                var s = initState();
                chai.assert.equal(Session.get('background'), 'black');
                chai.assert.equal(s.zoom, 1);
                chai.assert.equal(Session.get('layouts').length, 0);
                chai.assert.equal(Session.get('current_layout_name'), null);
                chai.assert(s.project, 'public/pancan12/');
            });

        });
    });
}
