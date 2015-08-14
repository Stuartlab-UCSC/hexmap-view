// tests/mocha/client/testState.js


if (!(typeof MochaWeb === 'undefined')) {
    MochaWeb.testOnly(function () {

        describe ('State', function () {

            it ('stateCreate should exist', function () {
                Meteor.flush();
                chai.assert(stateCreate);
            });
            it ('state attributes & methods should exist', function () {
                Meteor.flush();
                var s = stateCreate();
                chai.assert.equal(s.background, 'black');
                chai.assert.equal(s.zoom, 1);
                chai.assert.equal(s.layout_names.length, 0);
                chai.assert.equal(s.current_layout_name, '');
                chai.assert(s.project, 'data/public/pancan12/');
                chai.assert.isNull(s.rpc);
            });

        });
    });
}