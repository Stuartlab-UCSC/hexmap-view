//mapManager prototype. Currently only used for reflections.

var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

//LayerPostOffice = new Mongo.Collection('LayerPostOffice');
ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
LayerPostOffice = new Mongo.Collection('LayerPostOffice');
Windows = new Mongo.Collection('Windows'); //a simple state tracker for how many windows are up

initManagerHelper();


function addAddressEntry(mapId,operation, allowedToMapIds){
    ManagerAddressBook.insert( {
                                mapId : mapId,
                                operation: operation,
                                toMapIds: allowedToMapIds
                                });
}

function initManagerHelper() {
    //TODO: better way to make sure that helper entries are inside the database
    //if the helper databases are empty put the minimal needed inside them.
    //console.log('mapManager: initManagerHelper called');
    //console.log('mapManager: initManagerHelper called: addy truth value', !ManagerAddressBook.findOne({}));

    /*
    TODO: this block of code will read in the required mapManager information from a file. 
    Currently mapManager info is hardcoded (see below)
    fs.readFile('/home/duncan/Desktop/TumorMap/TumorMapDevBranch/hexagram/.bin/managerInit.json', 'utf-8', function(err,dat){
        if (err){//

            console.log("settings.json file not found, mapManager and reflection functionality may not be available")
        } else {
            var settingsObj = JSON.parse(dat);

            //Look Into the addressBook database and add any that are not present
            addresses = settingsObj.ManagerAddressBook;

            console.log(addresses)

            _.each(addresses,function(index,item){
               if(ManagerAddressBook.findOne({mapId:item.mapId})){
                   console.log('found it')
               }
            });


            
            //console.log(settingsObj)
        }
    });
    */

    if ( !ManagerAddressBook.findOne({}) ){
        addAddressEntry('Pancan12/SampleMap/','reflection', ['Pancan12/GeneMap/']);
        addAddressEntry('Pancan12/GeneMap/','reflection', ['Pancan12/SampleMap/']);
        addAddressEntry('dmccoll_MESO/GeneMap/','reflection', ['dmccoll_MESO/SampleMap/']);
        addAddressEntry('dmccoll_MESO/SampleMap/','reflection', ['dmccoll_MESO/GeneMap/']);
        console.log('mapManager: initManagerHelper called: addresses added');

    };

    if ( !ManagerFileCabinet.findOne({}) ){
        ManagerFileCabinet.insert(
            {
                "operation" : "reflection",
                "mapId" : "Pancan12/SampleMap/",
                "opts" : undefined,
                "args" : [
                    "datapath",
                    "featOrSamp",
                    "node_ids"
                ],
                "datapath" : "reflection/pancan12_expr_signedClrscores.csv",
                "featOrSamp" : "sample"
            }

        );
        ManagerFileCabinet.insert(
            {
                "operation" : "reflection",
                "mapId" : "Pancan12/GeneMap/",
                "opts" : undefined,
                "args" : [
                    "datapath",
                    "featOrSamp",
                    "node_ids"
                ],
                "datapath" : "reflection/pancan12_expr_signedClrscores.csv",
                "featOrSamp" : "feature"
            }

        );
        ManagerFileCabinet.insert(
            {
                "operation" : "reflection",
                "mapId" : "dmccoll_MESO/GeneMap/",
                "opts" : undefined,
                "args" : [
                    "datapath",
                    "featOrSamp",
                    "node_ids"
                ],
                "datapath" : "reflection/clrMeso.csv",
                "featOrSamp" : "feature"
            }

        );
        ManagerFileCabinet.insert(
            {
                "operation" : "reflection",
                "mapId" : "dmccoll_MESO/SampleMap/",
                "opts" : undefined,
                "args" : [
                    "datapath",
                    "featOrSamp",
                    "node_ids"
                ],
                "datapath" : "reflection/clrMeso.csv",
                "featOrSamp" : "sample"
            }

        );
        //console.log('mapManager: initManagerHelper called: FileCab added');
    };
}
function colorMapMaker(){
    //TODO: make a more flexible colorMapMaker (this one only for reflections)
    newColorMap = [];
    newColorMap = [ //this is because index needs to be equal to the category
        {name:'low',color:'#32cd32',fileColor:'#32cd32'},
        {name:'middle',color:'#737373',fileColor:'#737373'},
        {name:'high',color:'#ce2029',fileColor:'#ce2029'}
                  ];
    return newColorMap;
};

function LayerMaker(layer_name,datalocation){
    newLayer={};
    newLayer.timestamp = Math.floor(Date.now()/1000); //UTC timestamp in seconds
    newLayer.layer_name = layer_name;
    //newLayer.url        = datalocation;
    newLayer.selection  = true;
    newLayer.n          = 300;
    magnitude = 3;//TODO: should this be 2?
    return newLayer
};

function arrayLayer(layerData){

    //makes parallel arrays out of layerData
    Json = layerData.data;
    nodes = [];
    vals = [];
    
    for (var node in Json){
        nodes.push(node);
        vals.push(Json[node]);
    };

    return {node_ids: nodes, values: vals}

}
function dropInLayerBox(layerData,user,toMapId){
    //changing terminology of Mailbox to layerbox
    //looking for all layer data you would need.

    Fiber( function (){
        user=user;
        layerData.data = arrayLayer(layerData);
        LayerPostOffice.upsert({user:user,toMapId:toMapId},{$push: {layers : layerData}});

    }).run();

}

function parmMaker(mapId,operation,argsObj) {
    //function that access the File Cabinet in order to produce a parmameter Json for python script.
    scriptDoc = ManagerFileCabinet.findOne({operation: operation , mapId: mapId});
    parm = {};
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

    //go through optional arguemnts
    _.each(scriptDoc.opts, function (opt) {

        if (argsObj[opt]) {
            parm[opt] = argsObj[opt];
        } else {
            //complain like alot//console.log(something meaningful that says filecabinent not good)
        }
    });

    if(parm.datapath){
        //TODO: this may cause a problem if you are reflecting outside of the major directory, for example
        // TODO: cont: geneMap -> geneMap instance. Will need a refactoring of the databases to make this smooth
        parm.datapath = FEATURE_SPACE_DIR + mapId.split('/')[0] + '/' + parm.datapath;
    }

    return parm;

}

Meteor.methods({

    // For calling python functions from the client
    mapManager: function (operation, userId, mapId, toMapId, featOrSamp, nodeIds,selectionSelected) {

        this.unblock();
        var future = new Future();


        var newLayer = LayerMaker(selectionSelected+'_Reflect');
        newLayer.colormap = colorMapMaker();
        //console.log(newLayer.colormap);
        
        if ( operation === 'reflection' ) {

            //load parameters specific to reflection python script
            //console.log("MapManager.js: parmMaker:",parmMaker(mapId,operation,{node_ids: nodeIds}));
            userArgs = {node_ids : nodeIds};
            parameters = parmMaker(mapId,operation, userArgs);
            //console.log(parameters);
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
    if(!this.userId) { return this.ready() }

    //If layerbox is empty put something in there so client can observe (in checkLayerBox.js: initLayerBox)
    if( ! LayerPostOffice.findOne({user: userId, toMapId: currMapId}) ) {
        //console.log('mapManager: No layerbox found, making empty entry');
        emptyLayers=[];
        LayerPostOffice.insert({user: userId, toMapId: currMapId, layers: emptyLayers});
    } 
    
    //console.log('mapManager: published user specific LayerBox: UserId,currMap:', userId, currMapId);
    LayerBoxCursor = LayerPostOffice.find({user: userId, toMapId: currMapId}); //must be cursor
    //allways return Cursor from publish
    return LayerBoxCursor;
});



//The following 2 publish functions are for manipulating the Windows database.
// the windows database is
// a state database that keeps track of how many and which windows are opened by a client
// We keep track of this so that the manager can open a new window if desired
Meteor.publish('OpenedWindow', function(userId,mapId) {
    if(!this.userId) { return this.stop() } //prevents update if user isn't signed in

    //if we don't have a window open then make an entry
    if( !Windows.findOne({user: userId, "maps.mapId": mapId}) ) {
        Windows.upsert({user: userId}, {$push : { maps : {mapId: mapId, count : 1 } }} )
    } else { //otherwise update
        Windows.update( {user: userId,"maps.mapId":mapId}, {$inc : {"maps.$.count": 1} } )
    }
    //console.log('user',userId, 'has just opened a window for', mapId);
    return this.stop();
});

Meteor.publish('ClosedWindow', function(userId,mapId) {
    //if(!this.userId) { return this.stop() } we need this function to be called when the user is not signed in

    //decrement the count of users window by one, delete entry if all windows closed
    Windows.update({user: userId,"maps.mapId":mapId},{$inc : {"maps.$.count": -1} } )

    //if (Windows.findOne({user: userId, "maps.mapId": mapId, "maps.count": 0} )){
    //    Windows.update({user: userId},{$pull : {"maps.mapId": mapId, "maps.count":0} } )
    //}
    //console.log('user',userId, 'has just closed a window for', mapId);

    return this.stop();
});
Meteor.methods({
    isWindowOpen: function (userId, mapId) {
        this.unblock();
        var future = new Future();
        //look to see if an entry is there, if so check if count == 0. If not there then window not opened
        if (Windows.findOne({user: userId, "maps.mapId": mapId})) {
            //console.log('toMapId:',mapId,'found, isOpen returning:',_.isUndefined(Windows.findOne({user: userId, "maps.mapId": mapId, "maps.count": 0})));
            future.return (_.isUndefined(Windows.findOne({user: userId, "maps.mapId": mapId, "maps.count": 0})) );
        } else {
            future.return(false);
        }
        return future.wait()
    }
});
//end Windows collection manipulators

//acccess the address database so that user is presented with where they can 'reflect' to.
Meteor.publish('reflectionToMapIds', function(currMapId) {
    return ManagerAddressBook.find({mapId: currMapId, operation: 'reflection'});
});

//TODO: this should be publish-subscribe too (not that it matters, but a user could access this function from console)
Meteor.methods({

    emptyLayerBox: function (userId, MapId) {

        this.unblock();
        var future = new Future();

        LayerPostOffice.remove({user: userId, toMapId: MapId});
        
        return future.wait();
    }
});

