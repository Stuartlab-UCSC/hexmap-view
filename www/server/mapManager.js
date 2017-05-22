//mapManager prototype. Currently only used for reflections.

var Fiber = Npm.require('fibers');
var readline  = Npm.require('readline');
var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');

var MapManager = require('./mapManager');
var PythonCall = require('./pythonCall');

var ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
var ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');
var LayerPostOffice = new Mongo.Collection('LayerPostOffice');
var Windows = new Mongo.Collection('Windows');
var Path = Npm.require('path');

function read_nodenames(managers_doc,callback) {
    //function for reading the nodeIds (both feature and sample) from a 
    // reflection datafile
    
    var filename = Path.join(FEATURE_SPACE_DIR, managers_doc.mapId.split(('/'))[0] + '/' + managers_doc.datapath);

    var node_names = [];
    var first = true;

    fs.stat(filename,function(err,stats) {
        if (err) {
            //console.log(err);
            return ;
        }
        else if (stats.isFile() ){
            var featOrSamp = managers_doc.featOrSamp;

            var rl = readline.createInterface({
                input : fs.createReadStream(filename),
                terminal: false
            });

            //if we are dealing with sample nodes we only read the header,
            // if dealing with features need to grab first element after first line
            if(featOrSamp === 'feature') {
                rl.on('line', function (line) {
                    if(!first) {
                        //console.log(line.split('\t')[0])
                        node_names.push(line.split('\t')[0]);
                    } else {
                        first = false;
                    }
                });
            } else if (featOrSamp === 'sample') {
                rl.on('line', function (line) {
                    //console.log('typeOfline:',typeof(line));
                    node_names = line.split('\t').splice(1);
                    //console.log('node_names',node_names);
                    rl.close();
                });
            }
            //after we read stuff in we put it in the database (callback should do that)
            rl.on('close',function() {
                callback(managers_doc,node_names);
            });
        }
        else {
            callback(managers_doc,[])
        }
    });

}

function insertNodeNames(doc,node_names){
    //inserts a list of nodes into the proper FileCabinet entry
    new Fiber( function () {
            ManagerFileCabinet.update(doc, {
                $set: {
                    available_nodes: node_names
                }
            });
    }).run();
}

function initManagerHelper() {
    //This function initializes the databases needed for map attribute transfer.
    // Initialized by reading from Meteor's settings.json file
    // erases old db entries and starts fresh everytime the server is booted

    //remove old dbs
    Windows.remove({});
    ManagerAddressBook.remove({});
    ManagerFileCabinet.remove({});
    LayerPostOffice.remove({});

    //insert ManangerAddressBook entries
    var addyentries =
        Meteor.settings.server.mapManagerHelper.ManagerAddressBook;

    _.each(addyentries,function(entry){
        ManagerAddressBook.insert(entry);
        //console.log(entry);
        //read_nodenames(entry,insertNodeNames);
    });

    //insert ManagerFileCabinet entries
    var cabinentEntries =
        Meteor.settings.server.mapManagerHelper.ManagerFileCabinet;

    _.each(cabinentEntries,function(entry){
        ManagerFileCabinet.insert(entry);
        //console.log(entry.datapath);
        //console.log(FEATURE_SPACE_DIR)
        read_nodenames(entry,insertNodeNames);
    });
}

//The following are helper functions specific to reflection functionality
function colorMapMaker(){
    //TODO: make a more flexible colorMapMaker (this one only for reflections)
    var newColorMap = [
        //order needs to be preserved because index needs to be equal to the
        // category
        ['low', '#32cd32'],
        ['middle', '#737373'],
        ['high', '#ce2029']
    ];
    return newColorMap;
}

function layerMaker(layer_name){
    var newLayer={};
    newLayer.timestamp = Math.floor(Date.now()/1000); //UTC timestamp in seconds
    newLayer.layer_name = layer_name;
    newLayer.n          = 300;
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
        //console.log("Reflection: dropInLayerBox Called with user, layer_name",
        //             user, layerData.layer_name);

        layerData.data = arrayLayer(layerData);
        var old_layer_names = [];

        console.log("dropInLayerbox user and toMapId", user, toMapId)

        _.each(LayerPostOffice.findOne({user:user,toMapId:toMapId}).layers,
               function(layer){
                  old_layer_names.push(layer.layer_name);
               });
        
        //console.log('dropInLayerBox: old_layer_names:', old_layer_names);
        
        layerData.layer_name =
            make_layer_name_unique(layerData.layer_name,old_layer_names);
        
        //console.log('dropInLayerBox: layerData.layer_name:', layerData.layer_name);
        
        var rc = LayerPostOffice.update({user:user,toMapId:toMapId},
                               {$set: {lastChange: 'inserted'},
                                $push: {layers : layerData}});

        //console.log('dropInLayerBox: rc:', rc);
        
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
    //console.log("parmMaker being called for mapManager" +
    //            "/reflection with these two maps:", mapId,toMapId);

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
        parm.datapath = Path.join(FEATURE_SPACE_DIR,
                        mapId.split('/')[0] +
                        '/' +
                        parm.datapath);
    }

    return parm;

}

exports.reflection_post_calc = function (result, context) {
    
    // Process the results of the reflection request where:
    // result: { statusCode: <http-statusCode>, data: <result-data> }
    
    var newLayer = context.post_calc_parms.newLayer,
        userId = context.post_calc_parms.userId,
        toMapId = context.post_calc_parms.toMapId;
    
    //console.log('reflection_post_calc: newLayer, userId, toMapId:',
    //    newLayer, userId, toMapId);
    //console.log('context.post_calc_parms:', context.post_calc_parms);
    
    // Report any errors
    if (result.statusCode !== 200) {
        PythonCall.report_calc_result (result, context);
        return;
    }
    newLayer.data = context.js_result;
    
    dropInLayerBox(newLayer, userId, toMapId);
    
    PythonCall.report_calc_result(result, context);
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
        var post_calc_parms = {
                newLayer: layerMaker(selectionSelected+'_' +dataType+ '_Reflect'),
            };
        post_calc_parms.newLayer.colormap = colorMapMaker();
        
        var ctx = {
            post_calc_parms,
            future: new Future(),
        };
        
        if ( operation === 'reflection' ) {
        
            //load parameters specific to reflection python script
            var userArgs = {node_ids : nodeIds, datatype : dataType};
            var parameters = parmMaker(mapId,toMapId, operation, userArgs);
            
            // Save some values need in the post-calculation function
            ctx.post_calc = MapManager.reflection_post_calc;
            post_calc_parms.userId = userId;
            post_calc_parms.toMapId = toMapId;
            
            //console.log('pre-pythonCall: userId, toMapId:', userId, toMapId);
            //console.log('- ctx:', ctx);
            
            PythonCall.call(operation, parameters, ctx);
            
        } else  {
            console.log('Incorrect toMapId input into mapManager');
        }
        
        return ctx.future.wait();
    }
});

/*
        var newLayer = layerMaker(selectionSelected+'_' +dataType+ '_Reflect');
        newLayer.colormap = colorMapMaker();
        
        if ( operation === 'reflection' ) {
            //load parameters specific to reflection python script
            var userArgs = {node_ids : nodeIds, datatype : dataType};
            var parameters = parmMaker(mapId,toMapId, operation, userArgs);
            //console.log("mapManager calling python with:",parameters);
            
            ctx. post_calc: MapManager.reflection_post_calc,
               newLayer: newLayer,
               userId: userId,
               toMapId: toMapId,
            }

            // Success, so call the python function
            PythonCall.call(operation, parameters, context);

        } else  {
            console.log('Incorrect toMapId input into mapManager');
        }
        return ctx.future.wait();
    }
});
*/

//subscribe is in checkLayerBox.js
Meteor.publish('userLayerBox', function(userId, currMapId) {
    if(!this.userId) { return this.ready(); }

    // For each map id the user could reflect to, check and see if the
    // user has a layer box for that map, if not then make one.

    // Get the entry in the data base holding the array of map ids reflection
    // is possible for.
    var reflectionAddress =
        ManagerAddressBook.findOne({mapId: currMapId, operation: 'reflection'});

    // Empty layers for new entries in the database.
    var emptyLayers=[];

    // Grab the array of mapIds and if there is not a database entry for the
    // user with a mapId, make one.
    if (reflectionAddress) {
        var toMapIds = reflectionAddress.toMapIds;
        _.each(toMapIds, function (toMapId) {
            //If layerbox is empty put something in there
            if (!LayerPostOffice.findOne({user: userId, toMapId: toMapId})) {
                LayerPostOffice.insert({
                    user: userId,
                    toMapId: toMapId,
                    layers: emptyLayers,
                    lastChange: "created"
                });
            }
        })
    }

    // Make sure there is also an entry for the map the user is currently on.
    if (!LayerPostOffice.findOne({user: userId, toMapId: currMapId})) {
        LayerPostOffice.insert({
            user: userId,
            toMapId: currMapId,
            layers: emptyLayers,
            lastChange: "created"
        });
    }

    // Publish the current maps's layer entry.
    var LayerBoxCursor = LayerPostOffice.find({user: userId,
                                               toMapId: currMapId
                                               });
    // Always return Cursor from publish
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

function initPublishers () {

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
        //console.log('publish ManagerAddressBook currMapId:', currMapId);
        return ManagerAddressBook.find({mapId: currMapId, operation: 'reflection'});
    });

    Meteor.publish('ManagerFileCabinet',function(mapId) {
        //publishes a subset of the fileCabinet, mainly so the client is aware of
        // nodes reflection is available to
        
        // if not logged in function won't do anything
        if(!this.userId) { return this.stop(); }

        return ManagerFileCabinet.find({mapId: mapId},{fields:{mapId:1,available_nodes:1, datatype:1,toMapId:1,operation:1}});

    });
}

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

//populate the helper database from settings.json file
initManagerHelper();

initPublishers();

//end Windows collection manipulators
