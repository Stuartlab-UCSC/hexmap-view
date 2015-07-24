/*
getCollection = function (string) {
    for (var globalObject in window) {
        if (window[globalObject] instanceof Meteor.Collection) {
            if (globalObject === string) {
                return (window[globalObject]);
                break;
            };        
        }
    }
    return undefined; // if none of the collections match
};

Meteor.startup (function () {


    Ctx = new Mongo.Collection('clientState');
    console.log(Ctx);


    //Ctx = {};
    //ctxId = '';
    //ctxRecord = {_id: false};

        //ctxRecord = Ctx().fetch()[0];
        //ctxId = ctxRecord._id;

    /*
      Ctx = Meteor.getCollection('clientState');
      if(Ctx.find().count() === 0){
        Ctx.insert({
                background: 'black', // Visualization background color
                zoom: 1, // Map zoom level where 1 is most zoomed out
                layout_names: [], // Map layout names maintained in order of entry
                current_layout_name: '', // Current Layout Displayed
                project: 'data/public/pancan12/',
                rpc: null, // remote procedure call object
            });

      }
    

});
*/