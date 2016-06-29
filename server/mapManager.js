//mapManager prototype. Currently only used for reflections.

var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

LayerPostOffice = new Mongo.Collection('LayerPostOffice');
ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
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
    console.log('mapManager: initManagerHelper called');
    console.log('mapManager: initManagerHelper called: addy truth value', !ManagerAddressBook.findOne({}));
    if ( !ManagerAddressBook.findOne({}) ){
        addAddressEntry('Pancan12mRNA/SampleMap/','reflection', ['Pancan12mRNA/GeneMap/']);
        addAddressEntry('Pancan12mRNA/GeneMap/','reflection', ['Pancan12mRNA/SampleMap/']);
        console.log('mapManager: initManagerHelper called: addresses added');

    };

    if ( !ManagerFileCabinet.findOne({}) ){
        ManagerFileCabinet.insert(
            {
                "operation" : "reflection",
                "mapId" : "Pancan12mRNA/SampleMap/",
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
                "mapId" : "Pancan12mRNA/GeneMap/",
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
        console.log('mapManager: initManagerHelper called: FileCab added');
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
    magnitude = 3;
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
        //TODO: need to call over and get the project major so isn't hard coded
        parm.datapath = FEATURE_SPACE_DIR + 'Pancan12mRNA/' + parm.datapath;
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

Meteor.methods({
    checkLayerBox: function (userId, MapId) {
        //TODO, this should be done via publish and subscribe, not by calling a server function as is
        this.unblock();
        var future = new Future();

        LayerBox = LayerPostOffice.findOne({user: userId, toMapId: MapId});

        //return false if user doesn't have any layers in their box
        (LayerBox === undefined) ? future.return(false) : future.return(LayerBox.layers) ;

        return future.wait();
    }
});

Meteor.publish('reflectionToMapIds', function(currMapId) {
    return ManagerAddressBook.find({mapId: currMapId, operation: 'reflection'});
});

Meteor.methods({

    emptyLayerBox: function (userId, MapId) {

        this.unblock();
        var future = new Future();

        LayerPostOffice.remove({user: userId, toMapId: MapId});
        
        return future.wait();
    }
});