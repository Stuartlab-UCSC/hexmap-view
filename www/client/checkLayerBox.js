/**
 * Created by duncan on 6/6/16.
 */

var app = app || {}; 

(function (hex) { // jshint ignore: line
CheckLayerBox = (function () { // jshint ignore: line
 
    var LayerPostOffice = new Mongo.Collection('LayerPostOffice');
    var last_layer_names = []; // list of layer names from the last update

    function jsonLayer(layer){
        //puts together two parallel arrays and makes a single Json data layer
        var vals = layer.data.values;
        var nodes = layer.data.node_ids;

        var Json = {};
        for (var i = 0 ; i < vals.length; i++){
            Json[nodes[i]] = vals[i];
        }
        return Json;
    }
    

    function remove_layer(layer_name) {
        var user = Meteor.user();
        if (user) {
            console.log('checkLayerBox.js: remove_layer(', layer_name, ')');
            Meteor.subscribe(
                'deleteLayer', user.username, ctx.project, layer_name);
        }
    }

    function layers_received (layers) {
        // Find and handle new layers and removed layers

        // Find any new layers and add them to the shortlist
        var doc_layer_names = [];
        var new_layers = _.filter(layers, function (layer) {
            doc_layer_names.push(layer.layer_name);
            return (last_layer_names.indexOf(layer.layer_name) < 0);
        });

        CheckLayerBox.receive_layers(new_layers);

        // Find any layers removed and remove them from the shortlist
        _.each(last_layer_names, function (layer_name) {
            if (doc_layer_names.indexOf(layer_name) < 0) {
                update_shortlist(layer_name, true);
            }
        });

        last_layer_names = doc_layer_names;
    }

    Meteor.autorun(function(){
        var doc = LayerPostOffice.findOne({});

        if (doc) {
            //console.log("reflect auto doc layers:", doc.layers);
            layers_received(doc.layers);
        }
    });

    return {
 
        receive_layers: function (layers) {
            //iterate through layers and place them in the shortlist
            _.each(layers, function (layer){
                var attributes = {};
                attributes.selection = layer.selection;
                attributes.n         = layer.n;
                attributes.magnitude = layer.magnitude;
                attributes.removeFx  = remove_layer;
                attributes.reflection = true;

                // make Json out of parallel arrays, avoids '.' in mongoDB
                layer.data = jsonLayer(layer);
                
                // Create the colormap
                var colormap = layer.colormap;
                _.each(colormap,function(mapentry){
                    //couldn't use the Color() func on the server side, so this:
                    mapentry.color = new Color(mapentry.color);
                    mapentry.fileColor = new Color(mapentry.fileColor);
                });
                
                //Add the layer to the global layers object and global colormaps
                create_dynamic_category_layer(layer.layer_name, layer.data,
                    attributes, colormap);
            });
        },
        init: function() {
            var mapId = ctx.project;
            
            // Subscribe if we have a user
            // TODO do we need to unsubcribe the old user to free memory?
            Meteor.autorun(function() {
                var user = Meteor.user();
                if (user) {
                    Meteor.subscribe('userLayerBox', user.username, mapId);
                }
            });
        },
    };
}());
})(app);
