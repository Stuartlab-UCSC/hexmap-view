/**
 * Created by duncan on 6/6/16.
 */

var app = app || {}; // jshint ignore:line


(function (hex) { // jshint ignore:line
    //LayerPostOffice = new Mongo.Collection('LayerPostOffice');
    /*
    checkLayerBox = function ({},callback) {
        //TODO: FIX CHEAT WAY BELOW, IN REFLECT.JS AS WELL
        if ('PAM50' in layers) {
            mapId = 'feature'
        } else {
            mapId = 'sample'
        }
        mapId= 'sample';
        LayerBox = LayerPostOffice.findOne({});//user: Meteor.user().username, toMapId: mapId});
        callback(LayerBox);
    };
    */
    
    function receive_layers(layers){

        _.each(layers, function (layer){
            attributes = {};
            //attributes.selection = layer.selection;
            attributes.n         = layer.n;
            attributes.magnitude = layer.magnitude;

            add_layer_data(layer.layer_name,layer.data,attributes);

            // Update the browse UI with the new layer.
            updateLonglist();
            var shortlist = Session.get('shortlist').slice();
            shortlist_push = true;
            if (shortlist_push !== false) {
                // Immediately shortlist it if the attribute is being created for
                // the first time.
                shortlist.push(layer.layer_name);
                Session.set('shortlist', shortlist);
                updateShortlist();
            } else if (shortlist.indexOf(layer.layer_name) >= 0) {
                // Immediately update shortlist it if the attribute is being loaded
                // and has been declared as part of the shortlist.
                updateShortlist();
            }
            colormap = layer.colormap;
            //console.log(colormap);
            _.each(colormap,function(mapentry){
                mapentry.color = Color(mapentry.color); //couldn't use the COlor() func on the server side
                mapentry.fileColor = Color(mapentry.fileColor);
            });
            colormaps[layer.layer_name] = colormap;
            console.log(colormaps);
            //new_layer_name = layer_name;
        })

        
    }
    initLayerBox = function() {
        if ('PAM50' in layers) {
            mapId = 'feature';
        } else {
            mapId = 'sample';
        }
 
        // If no user is logged in, there is no layerBox doc for this
        if (_.isUndefined(Meteor.user()) || _.isNull(Meteor.user())) return;

 
        username = Meteor.user().username;
        Meteor.call('checkLayerBox', username, mapId, function (error, result){
           
                if (error) {
                    banner('error', error);
                    //updateSortUi('noStats');
                } else if (result) {
                    //console.log(result);
                    receive_layers(result);
                }
            
        })
    }
})(app);
/*


        //return
        //shortlist = Session.get('shortlist').slice();
        //shortlist = Session.get('shortlist').slice();
        Layers = LayerBox.layers;
        for (var i = 0, i < Layers.length,i++){
            console.log(Layers[i]);
        };
        //shortlist = [];
        //longList = [];


    };

*/