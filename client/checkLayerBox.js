/**
 * Created by duncan on 6/6/16.
 */

var app = app || {}; // jshint ignore:line


(function (hex) { // jshint ignore:line
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

    function receive_layers(layers){
        //iterate through layers and place them in the shortlist
        _.each(layers, function (layer){
            attributes = {};
            attributes.selection = layer.selection;
            attributes.n         = layer.n;
            attributes.magnitude = layer.magnitude;

            // make Json out of paraellel arrays, avoids '.' in mongoDB
            layer.data = JsonLayer(layer);

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
            //console.log(colormaps);
            //new_layer_name = layer_name;
        })

        
    }

    initLayerBox = function() {

        // If no user is logged in, there is no layerBox doc for this
        if (_.isUndefined(Meteor.user()) || _.isNull(Meteor.user())) return;

        //variables needed for querry
        mapId = ctx.project;
        username = Meteor.user().username;

        //Meteor.subscribe('makeBox',username,mapId);
        //subscribe to LayerBox and stuff in shortlist when ready.

        //first thing when it's ready is display on map
        LayerBoxHandle = Meteor.subscribe('userLayerBox',username,mapId,
            {
                onReady: function () {

                    //console.log('Subscription to Layerbox ready: Grabbing Doc');

                    LayerBoxDoc = LayerPostOffice.findOne();

                    //console.log(LayerBox);
                    if (LayerBoxDoc) {
                        receive_layers(LayerBoxDoc.layers);
                    }
                },
                onError: function (error) { console.log("onError: subscribe to LayerBox",error); }
            }
        );

        //now observe for any changes and display them
        LayerBoxCurser = LayerPostOffice.find();
        //console.log(LayerBoxCurser);
        LayerBoxCurser.observeChanges({
            //console.log('checkLayerBox: observing Layerbox');
            changed: function (id, fields) {
                //console.log('checkLayerBox: Users layerBox Doc updated: id, feilds:',id, fields);
                receive_layers(fields.layers);
                banner('info','You now have a new reflection in your short list')
            }
        })

    };


})(app);
