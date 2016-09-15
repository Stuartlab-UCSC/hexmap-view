/**
 * Created by duncan on 6/6/16.
 */

var app = app || {}; 

(function (hex) {
CheckLayerBox = (function () {
 
    LayerPostOffice = new Mongo.Collection('LayerPostOffice');

    function JsonLayer(layer){
        //puts together two parallel arrays and makes a single Json data layer
        vals = layer.data.values;
        nodes = layer.data.node_ids;

        Json = {};
        for (var i = 0 ; i < vals.length; i++){
            Json[nodes[i]] = vals[i]
        }
        return Json
    }

    function remove_layer(layer_name) {
        var user = Meteor.user();
        if (user) {
            console.log('checkLayerBox.js: remove_layer(', layer_name, ')');
            Meteor.subscribe(
                'deleteLayer', user.username, ctx.project, layer_name);
        }
    }

    function receive_layers(layers){
        //iterate through layers and place them in the shortlist
        _.each(layers, function (layer){
            var attributes = {};
            attributes.selection = layer.selection;
            attributes.n         = layer.n;
            attributes.magnitude = layer.magnitude;
            attributes.removeFx  = remove_layer;
            attributes.reflection = true

            // make Json out of parallel arrays, avoids '.' in mongoDB
            layer.data = JsonLayer(layer);
            
            // Create the colormap
            var colormap = layer.colormap;
            _.each(colormap,function(mapentry){
                mapentry.color = Color(mapentry.color); //couldn't use the Color() func on the server side
                mapentry.fileColor = Color(mapentry.fileColor);
            });
            
            // Add the layer to the global layers object and global colormaps
            create_dynamic_category_layer(layer.layer_name, layer.data,
                attributes, colormap);
        })
    }

    return {
 
        receive_layers: function (layers) {
            //iterate through layers and place them in the shortlist
            _.each(layers, function (layer){
                var attributes = {};
                attributes.selection = layer.selection;
                attributes.n         = layer.n;
                attributes.magnitude = layer.magnitude;
                attributes.removeFx  = remove_layer;
                attributes.reflection = true

                // make Json out of parallel arrays, avoids '.' in mongoDB
                layer.data = JsonLayer(layer);
                
                // Create the colormap
                var colormap = layer.colormap;
                _.each(colormap,function(mapentry){
                    mapentry.color = Color(mapentry.color); //couldn't use the Color() func on the server side
                    mapentry.fileColor = Color(mapentry.fileColor);
                });
                
                // Add the layer to the global layers object and global colormaps
                create_dynamic_category_layer(layer.layer_name, layer.data,
                    attributes, colormap);
            })
        },

        init: function() {
            mapId = ctx.project;
            username = Meteor.user().username;
            Meteor.subscribe('userLayerBox', username, mapId);

        },
    }
}());
})(app);
