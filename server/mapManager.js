//mapManager prototype. Currently only used for reflections.

var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

LayerPostOffice = new Mongo.Collection('LayerPostOffice');

function colorMapMaker(){ //TODO: make a more flexible colorMapMaker (this one only for reflections)
    newColorMap = [];
    newColorMap = [ //this is because index needs to be equal to the category
        {name:'low',color:'#ce2029',fileColor:'#ce2029'},
        {name:'middle',color:'#737373',fileColor:'#737373'},
        {name:'high',color:'#32cd32',fileColor:'#32cd32'}
                  ];
    return newColorMap;
};

function LayerMaker(layer_name,datalocation){
    newLayer={};
    newLayer.layer_name = layer_name;
    //newLayer.url        = datalocation;
    newLayer.selection  = true;
    newLayer.n          = 300;
    magnitude = 3;
    return newLayer
};


function dropInLayerBox(layerData,user,toMapId){
    //changing terminology of Mailbox to layerbox
    //looking for all layer data you would need.

    Fiber( function (){
        user=user;
        LayerPostOffice.upsert({user:user,toMapId:toMapId},{$push: {layers : layerData}});

    }).run();

}

Meteor.methods({

    // For calling python functions from the client
    mapManager: function (operation,userId, toMapId, nodeIds,selectionSelected) {

        this.unblock();
        var future = new Future();


        var newLayer = LayerMaker(selectionSelected); 
        newLayer.colormap = colorMapMaker();

        if (operation === 'test') {
            console.log('testing simple helloworld2');


            var parameters = {'hello': 'why'};

            callPython('helloworld2', parameters, function (result) {
                if (result) {
                    
                    //console.trace();
                    //future.throw(error);
                    //TODO we should check stderror as well
                    //var res = result;
                    console.log(result);
                    newLayer.data = result.data;
                    newLayer.url  = result.filename;
                } else {

                    //console.log();
                    //future.return(success);
                }
            });
        }
        if (operation === 'reflection') {

            //load parameters specific to reflection python script
            var parameters = {
                              datapath: FEATURE_SPACE_DIR + 'pancan12/reflection/pancan12_expr_signedClrscores.pi',
                              toMapId: toMapId,
                              node_ids: nodeIds,
                              out_file: 'trash.csv', //usage is commented out in reflections.py
                              };

            callPython(operation, parameters, function (result) {
                if (result) {

                    //console.log('mapManager: ' + operation + ' success');
                    newLayer.data = result.data;
                    dropInLayerBox(newLayer,userId,toMapId);
                }
            });

        }

        return future.wait();

    }
});

Meteor.methods({
    checkLayerBox: function (userId, MapId) {

        this.unblock();
        var future = new Future();

        LayerBox = LayerPostOffice.findOne({user: userId, toMapId: MapId});
        console.log('LayerBox:', LayerBox);

        (LayerBox === undefined) ? future.return(false) : future.return(LayerBox.layers) ;
        //return false if user doesn't have any layers in their box
        return future.wait();
    }
});
