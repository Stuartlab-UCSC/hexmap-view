/**
* Created by duncan on 6/6/16.
*/

import Layer from '/imports/mapPage/longlist/layer.js';
import Shortlist from '/imports/mapPage/shortlist/shortlist.js';

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

function receive_layers (layers) {
    
    //iterate through layers and place them in the shortlist
    _.each(layers, function (layerIn){
        var layer = {
            data: jsonLayer(layerIn),
            n: layerIn.n,
            dataType: layerIn.dataType,
            removeFx: remove_layer,
            reflection: true,
            colormap: layerIn.colormap,
        }
        
        var dynLayers = {};
        dynLayers[layerIn.layer_name] = layer;
        
        // Add the layer to the global layer objects
        Layer.with_one(layerIn.layer_name, function(){}, dynLayers);
    });
}
    
function layers_received (layers) {
    // Find and handle new layers and removed layers

    // Find any new layers and add them to the shortlist
    var doc_layer_names = [];
    var new_layers = _.filter(layers, function (layer) {
        doc_layer_names.push(layer.layer_name);
        return (last_layer_names.indexOf(layer.layer_name) < 0);
    });

    receive_layers(new_layers);

    // Find any layers removed and remove them from the shortlist
    _.each(last_layer_names, function (layer_name) {
        if (doc_layer_names.indexOf(layer_name) < 0) {
            Shortlist.removeEntry(layer_name);
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

exports.init = function() {
    var mapId = ctx.project;
    
    // Subscribe if we have a user
    // TODO do we need to unsubcribe the old user to free memory?
    Meteor.autorun(function() {
        var user = Meteor.user();
        if (user) {
            Meteor.subscribe('userLayerBox', user.username, mapId);
        }
    });
}
