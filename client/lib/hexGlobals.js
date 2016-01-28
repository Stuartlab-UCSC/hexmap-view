Template.registerHelper("absoluteUrl", function () {
    return Meteor.absoluteUrl();
});
    
Template.headerT.onCreated(function () {
    Session.set('loadingMap', 'block');
});

