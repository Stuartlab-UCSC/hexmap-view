//mapManager prototype. Currently only used for reflections.


var Fiber = Npm.require('fibers');
var readline  = Npm.require('readline');
var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');

// global definition explanation below
// if not global then when I try and use the local reference in 
// another file,zLoadDbs.js I get the error:
// A method named '/ManagerFileCabinet/insert' is already defined
// could keep local if all manipualtions are in one file?
ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');
LayerPostOffice = new Mongo.Collection('LayerPostOffice');
Windows = new Mongo.Collection('Windows');


//The following are helper functions specific to reflection functionality
function colorMapMaker(){
    //TODO: make a more flexible colorMapMaker (this one only for reflections)
    var newColorMap = [
        //order needs to be preserved because index needs to be equal to the
        // category
        {name:'low',color:'#32cd32',fileColor:'#32cd32'},
        {name:'middle',color:'#737373',fileColor:'#737373'},
        {name:'high',color:'#ce2029',fileColor:'#ce2029'}
                  ];
    return newColorMap;
}

function layerMaker(layer_name){
    var newLayer={};
    newLayer.timestamp = Math.floor(Date.now()/1000); //UTC timestamp in seconds
    newLayer.layer_name = layer_name;
    newLayer.selection  = true;
    newLayer.n          = 300;
    newLayer.magnitude = 3;//TODO: should this be 2?
    return newLayer;
}

function arrayLayer(layerData){

    //makes parallel arrays out of layerData
    var Json = layerData.data;
    var nodes = [];
    var vals = [];
    
    for (var node in Json){
        nodes.push(node);
        vals.push(Json[node]);
    }

    return {node_ids: nodes, values: vals};

}

function make_layer_name_unique (new_layer_name,old_layer_names) {

    // We're done if the name is unique
    if (old_layer_names.indexOf(new_layer_name) === -1) {
        return new_layer_name;
    }

    var last_suffix,
        name = new_layer_name,
        seq = 1;

    // Keep looking for a name until it is unique
    while (true) {

        // We're done if the name is unique
        if (old_layer_names.indexOf(name) === -1) { break; }

        // Find any previously tried sequence suffix
        if (seq > 1) {
            last_suffix = ' ' + (seq - 1);
            if (name.endsWith(last_suffix)) {

                // Remove the existing sequence suffix
                name = name.slice(0, name.length - last_suffix.length);
            }
        }
        name += ' ' + seq;
        seq += 1;
    }
    return name;
}
////////////////////


function dropInLayerBox(layerData,user,toMapId){
    //function adds reflection computation to DB
    new Fiber( function (){
        console.log("Refelction: dropInLayerBox Called with user, layer_name",
                     user,
                     layerData.layer_name
                    );

        layerData.data = arrayLayer(layerData);
        var old_layer_names = [];
        _.each(LayerPostOffice.findOne({user:user,toMapId:toMapId}).layers,
               function(layer){
                  old_layer_names.push(layer.layer_name);
               });
        
        layerData.layer_name =
            make_layer_name_unique(layerData.layer_name,old_layer_names);

        LayerPostOffice.update({user:user,toMapId:toMapId},
                               {$set: {lastChange: 'inserted'},
                                $push: {layers : layerData}});

    }).run();
}

function parmMaker(mapId,toMapId, operation,argsObj) {
    //function that accesses the ManagerFileCabinet DB in order to produce
    // the correcct parmameter Json object for the reflection python script.

    var scriptDoc =
        ManagerFileCabinet.findOne({operation: operation,
                                    datatype: argsObj.datatype,
                                    mapId: mapId,
                                    toMapId: toMapId
                                    });
    console.log("parmMaker being called for mapManager" +
                "/reflection with these two maps:", mapId,toMapId);

    var parm = {};
    //TODO: make cleaner by using precedence and writing over if necessary (?)
    //go through the necessary arguments
    _.each(scriptDoc.args, function (arg) {

        if ( scriptDoc[arg] ) {
            parm[arg] = scriptDoc[arg];
        } else if (argsObj[arg]) {
            parm[arg] = argsObj[arg];
        } else {
            //complain like alot
        }
    });

    //go through optional arguments
    _.each(scriptDoc.opts, function (opt) {

        if (argsObj[opt]) {
            parm[opt] = argsObj[opt];
        } else {
            //complain like a lot
        }
    });

    if(parm.datapath){
        //TODO: this may cause a problem if you are reflecting outside
        // TODO: of the major directory, for example
        // TODO: cont: geneMap -> geneMap instance.
        // TODO: Will need a refactoring of the databases to make this smooth
        parm.datapath = FEATURE_SPACE_DIR +
                        mapId.split('/')[0] +
                        '/' +
                        parm.datapath;
    }

    return parm;

}

Meteor.methods({

    // For calling python functions from the client
    mapManager: function (operation,
                          dataType,
                          userId,
                          mapId,
                          toMapId,
                          nodeIds,
                          selectionSelected) {
        //console.log(Meteor.userId());
        this.unblock();
        var future = new Future();


        var newLayer = layerMaker(selectionSelected+'_' +dataType+ '_Reflect');
        newLayer.colormap = colorMapMaker();
        
        if ( operation === 'reflection' ) {
            //load parameters specific to reflection python script
            var userArgs = {node_ids : nodeIds, datatype : dataType};
            var parameters = parmMaker(mapId,toMapId, operation, userArgs);
            //console.log("mapManager calling python with:",parameters);
            callPython(operation, parameters, function (result) {
                if (result) {
                    newLayer.data = result.data;
                    dropInLayerBox(newLayer,userId,toMapId);
                }
            });
        } else  {
            console.log('Incorrect toMapId input into mapManager');
        }

        return future.wait();

    }
});

//subscribe is in checkLayerBox.js
Meteor.publish('userLayerBox', function(userId, currMapId) {
    if(!this.userId) { return this.ready(); }

    //If layerbox is empty put something in there
    if( ! LayerPostOffice.findOne({user: userId, toMapId: currMapId}) ) {
        //console.log('mapManager: No layerbox found, making empty entry');
        var emptyLayers=[];
        LayerPostOffice.insert({user: userId,
                                toMapId: currMapId,
                                layers: emptyLayers,
                                lastChange:"created"
                                });
    } 

    var LayerBoxCursor = LayerPostOffice.find({user: userId,
                                               toMapId: currMapId
                                               });
    //always return Cursor from publish
    return LayerBoxCursor;
});



//Helper function for Windows database
function getWindowCount(WindowsDoc,mapId){
    /*
    Input is windows document from the Windows collection.
    Returns how many windows are open for a given mapId
     */
    var count = 0;

    if (WindowsDoc) {
        _.each(WindowsDoc.maps, function (val) {
            if (val.mapId === mapId) { //flip switch and return
                count = val.count;
            }
        });
    }

    return count;

}

//The following 2 publish functions are for manipulating the Windows database.
// the windows database is
// a state database that keeps track of how many and which windows
// are opened by a client
// We keep track of this so that the manager can open a new window if desired
Meteor.publish('OpenedWindow', function(userId,mapId) {
    //prevents update if user isn't signed in, or not on defined map
    if(!this.userId || ! userId || ! mapId) { return this.stop(); }

    //if we don't have a window open then make an entry
    if( !Windows.findOne({user: userId, "maps.mapId": mapId}) ) {
        Windows.upsert({user: userId},
                       {$push :
                           { maps :
                               {mapId: mapId, count : 1 } }} );
    } else { //otherwise update
        Windows.update( {user: userId,"maps.mapId":mapId},
                        {$inc : {"maps.$.count": 1} } );
    }
    //console.log('user',userId, 'has just opened a window for', mapId);
    return this.stop();
});

Meteor.publish('ClosedWindow', function(userId,mapId) {

    //Decrement count, and make sure it is never negative
    if (getWindowCount(
            Windows.findOne({user: userId,"maps.mapId":mapId}),
            mapId
            ) > 0) {
        Windows.update({user: userId,"maps.mapId":mapId},
                       {$inc : {"maps.$.count": -1} } );
    }

    return this.stop();
});

//deletes a layer (specified by layer_name)
// from a (userId, mapId) LayerBox entry
Meteor.publish('deleteLayer',function(userId,mapId,layer_name) {
    // if not logged in function won't do anything
    if(!this.userId) { return this.stop(); }

    LayerPostOffice.update({user: userId, toMapId: mapId},
                           {$set :
                              { lastChange: "removed"},
                               $pull:
                                  {layers: {layer_name: layer_name}} });
});

//Gives client access to the address database
// so that user knows where they can 'reflect' to.
Meteor.publish('reflectionToMapIds', function(currMapId) {
    return ManagerAddressBook.find({mapId: currMapId, operation: 'reflection'});
});

Meteor.publish('ManagerFileCabinet',function(mapId) {
    //publishes a subset of the fileCabinet, mainly so the client is aware of
    // nodes reflection is available to
    
    // if not logged in function won't do anything
    if(!this.userId) { return this.stop(); }

    return ManagerFileCabinet.find({mapId: mapId},{fields:{mapId:1,available_nodes:1, datatype:1,toMapId:1,operation:1}});

});

Meteor.methods({
    isWindowOpen: function (userId, mapId) {
        this.unblock();
        var future = new Future();

        var userWindowsDoc = Windows.findOne({user: userId,
                                              "maps.mapId": mapId});

        future.return(getWindowCount(userWindowsDoc,mapId) !== 0);

        return future.wait();
    }
});
//end Windows collection manipulators

