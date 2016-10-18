/**
 * Created by duncan on 10/17/16.
 */
var app = app || {};

(function (hex) { // jshint ignore: line
    //ATTRDB this doesn't need to be global but for debuggin purposes
    // it is for now
    AttrDB = new Mongo.Collection('AttribDB');
    DensityDB = new Mongo.Collection('DensityDB');
    //switch to control whether layers global is read from DB
    TESTING = false;

    attrDB = (function () { // jshint ignore: line
    
    
    
        //ATTRDB: use this function in place of add_layer_url (in hexagram.js), to
        //  
        /*
         attrAddToLayerObj = function (attribute_name,attributes){
         var attrDoc = AttrDB.findOne({attribute_name: attribute_name})
         var layersDoc = {
         url: attrDoc.url,
         data: undefined,
         magnitude : undefined,
    
         }
    
         for (var name in attributes){
         // Copy over each specified attribute
         layers[layer_name][name] = attributes[name];
         }
         // Add it to the sorted layer list.
         var sorted = Session.get('sortedLayers').slice();
         sorted.push(layer_name);
         Session.set('sortedLayers', sorted);
    
         };
         */

        //ATTRDB

        getClumpinessArray = function (attribute_name){
            //accesses the clumpiness or Density collection
            // and returns an array like would be found by old implementation.
            var clumpCurs = DensityDB.find(
                {attribute_name: attribute_name},
                { fields : {density:1,index:1}});

            var clumpArray = new Array(clumpCurs.count());

            clumpCurs.forEach(function(doc){
                clumpArray[doc.index] = doc.density;
            });

            return clumpArray;

        };
        attrHasLayer = function(attribute_name){
            return (!_.isUndefined(AttrDB.findOne({attribute_name: attribute_name})))
        };
        attrHasData = function (attribute_name){
            //the namespace is already limited on the client,
            // therefore attribute_name is a key

            //data and nodeIds are loaded simultaneously, and perhaps later for
            // binaries will not be interested in 0's
            return ( _.isUndefined(AttrDB.findOne({attribute_name: attribute_name}))
            ||
            !_.isUndefined(AttrDB.findOne({attribute_name: attribute_name})
                .node_ids));
        };
        attrHasTag = function (attribute_name,tag){
            var tags = AttrDB.findOne({attribute_name: attribute_name}).tags;
            return (tags.indexOf(tag) > -1)
        };
        attrHasTags = function(attribute_name){
            //returns true if there are any tags for this attribute
            return (!_.isUndefined(AttrDB.findOne({attribute_name: attribute_name}).tags))
        }
        attrGetMax = function (attribute_name){
            return (AttrDB.findOne({attribute_name: attribute_name}).max)
        };
        attrGetMin = function(attribute_name){
            return (AttrDB.findOne({attribute_name: attribute_name}).min)
        };
        attrGetNodeIds = function(attribute_name){
            return (AttrDB.findOne({attribute_name: attribute_name}).node_ids)
        };
        attrGetValues = function(attribute_name){
            return (AttrDB.findOne({attribute_name: attribute_name}).values)
        };
        attrIsContinuous = function(attribute_name) {
            return(AttrDB.findOne({attribute_name: attribute_name}).datatype === 'Continuous');
        };
        attrGetContinuousNames = function() {
            //returns all the continuos variables for the current filter
            var continuousAttr = [];
            AttrDB.find({datatype : 'Continuous'}).forEach(
                function(doc){
                    continuousAttr.push()
                }
            );
            return continuousAttr;
        }
        attrIsBinary = function(attribute_name) {
            return(AttrDB.findOne({attribute_name: attribute_name}).datatype === 'Binary');
        };
        attrGetBinaryNames = function() {
            //returns all the continuos variables for the current filter
            var binaryAttr = [];
            AttrDB.find({datatype : 'Binary'}).forEach(
                function(doc){
                    binaryAttr.push()
                }
            );
            return continuousAttr;
        };

        attrIsCategorical = function(attribute_name) {
            return(AttrDB.findOne({attribute_name: attribute_name}).datatype === 'Categorical');
        };
        attrGetCategoricalNames = function() {
            //returns all the continuos variables for the current filter
            var binaryAttr = [];
            AttrDB.find({datatype : 'Categorical'}).forEach(
                function(doc){
                    continuousAttr.push()
                }
            );
            return continuousAttr;
        };
        attrIsSelection = function(attribute_name) {
            return (AttrDB.findOne({attribute_name: attribute_name}).selection)
        };
        attrGetSelectionNames = function(){
            //returns an array of attribute names that are selections

            //stuff all the attribute names that are selection into an array
            var selectionNames = [];
            AttrDB.find({selection: true}).forEach(
                function(doc){
                    selectionNames.push(doc.attribute_name);
                });
            return selectionNames;
        };
        attrGetColorMap = function(attribute_name){
            var attrDoc = AttrDB.findOne({attribute_name: attribute_name});
            if (!attrDoc){
                return undefined;
            }
            if (attrDoc.datatype === 'Binary') {
                //noticed that getting a binary's colormap returns empty object
                return {};
            } else if (attrDoc.datatype === 'Continuous'){
                return undefined;
            } else {
                //it should be Categorical

                var unparsedcolormap = AttrDB.findOne({attribute_name: attribute_name}).colormap;
                var colormap = [];
                //ATTRDB HACK
                // TODO: deal with below
                // don't deal with marked categoricals that have no colormap
                // perhaps we should be prompting the user to enter one?
                if(!unparsedcolormap) {return undefined}
                for (var j = 1; j < unparsedcolormap.length; j += 3) {
                    // Store each color assignment.
                    // Doesn't run if there aren't any assignments, leaving an empty
                    // colormap object that just forces automatic color selection.

                    // This holds the index of the category
                    var category_index = parseInt(unparsedcolormap[j]);

                    // The colormap gets an object with the name and color that the
                    // index number refers to. Color is stored as a color object.
                    colormap[category_index] = {
                        name: unparsedcolormap[j + 1],
                        color: Color(unparsedcolormap[j + 2]), // operating color in map
                        fileColor: Color(unparsedcolormap[j + 2]), // color from orig file
                    };
                }
            }
            return colormap;
        };
        attrRequestLayerTags = function(){
            //this function is called over at filter.js,
            // there may be timing issues if the subs

            //this returns tag data in the same way that the TSV file reader does,
            // namely as an array of arrays, with
            // the first being a header:
            // note the header is skipped only because there is no layer name in
            // layers that is 'attribute'
            var tagdata = [];
            tagdata[0] = ["attribute","keywords (tab separated)"];
            var index = 1;

            // go through all attributes we have tags for, and put them in the
            // array of arrays.
            // $type explaination:
            // for some reason the 'tags' field is a BSON 2, i.e. String
            // (thought it would be an array but no no)
            AttrDB.find({tags :{$type: 2}}).forEach(
                function(doc){
                    var tags = [doc.attribute_name];
                    tagdata[index] = tags.concat(doc.tags);
                    index +=1;
                }
            );
            return tagdata;
        };
        attrHaveColormap = function(layer_name){
            //the previous implemtation (have_colormap)
            // returns true if
            var attrDoc = AttrDB.findOne({attribute_name: attribute_name})
            return (attrDoc.datatype === 'Categorical'
                ||
                attrDoc.datatype == 'Binary'
            )
        }
        equalsTest = function(val1,val2, calledFrom,feedback) {
            //if feedback is true then will chatter on positive result
            if(!_.isEqual(val1,val2)){
                console.log("equals test failed from:", calledFrom,"\nvalues:",val1,val2)
            } if (feedback){
                console.log("TEST PASSED, from",calledFrom)
            }
        };
        //initialization
        DBstoLayersGlobal = function(){
            //function that puts the basic amount of information from the database
            // and into the layers global object

            //HACK
            // the below: this works based on timing, this function has to be called
            // after setting the Session layouts or it won't be a happy day

            //if there's not any density for the layer than we need
            // to put a NULL clumpiness vector, so we just fill an
            // array with the appropriate amount of NAN's
            //
            NaNClumpiness = [];
            for (var i =0 ; i < Session.get('layouts').length; i++){
                NaNClumpiness.push(NaN)
            }


            //console.log(AttrDB.find().count());
            AttrDB.find({}).forEach(function(doc){
                //will take this out after making sure they are equivelent
                //console.log("has layer,", doc);

                //if we don't find a density value then we put one in that
                // is full of NaN's, otherwise we use the one in the DB
                var clumpiness_array = !_.isUndefined(DensityDB.findOne(
                    {
                        attribute_name: doc.attribute_name,
                        project : ctx.project
                    })) ? DensityDB.findOne(
                    {
                        attribute_name: doc.attribute_name,
                        project : ctx.project
                    }).clumpiness_array : NaNClumpiness;
                //console.log(clumpiness_array);
                layers[doc.attribute_name] = {
                    clumpiness_array : clumpiness_array,
                    clumpiness : undefined,
                    magnitude : undefined,
                    data: undefined,
                    n: doc.n,
                    positives : doc.positives,
                    url : doc.url

                };
                // Add it to the sorted layer list.
                var sorted = Session.get('sortedLayers').slice();
                sorted.push(doc.attribute_name);
                Session.set('sortedLayers', sorted);


            });
            console.log('intitedLayerIndex Session gets True');
            Session.set('initedLayerIndex', true);
        };
        initTypesFromDB = function(){
            var dtypes = ["Binary","Continuous","Categorical"],
                ctxObs   = ["bin_layers","cont_layers","cat_layers"];
            _.zip(dtypes,ctxObs).forEach(function(pair) {
                console.log("from initTypesFromDB",pair[0],pair[1],
                    AttrDB.find({datatype: pair[0]}).count(),"found");
                ctx[pair[1]] = [];
                AttrDB.find({datatype: pair[0]}).forEach(function(doc){
                    ctx[pair[1]].push(doc.attribute_name);
                })
            });
            console.log('inited LayerTypes Session turns true');
            Session.set('initedLayerTypes', true);
        };
        initColormapsFromDB = function(){
            AttrDB.find({datatype : "Categorical"}).forEach(
                function(doc){
                    colormaps[doc.attribute_name]= attrGetColorMap(doc.attribute_name);
                }
            )
            console.log("initedColorMaps gets true");
            Session.set('initedColormaps', true);
        };
        //does all the initializations needed for filling the layers, colormaps
        // and types
        initAttrDB =  function() {

            //initiallizes the attribute database
            Meteor.call("getNamespace", ctx.project, function (err, namespace) {
                    if (err) {
                        console.log("error in retrieving namespace, db can not be initiated")
                    } else {
                        //console.log(namespace);
                        Session.set("namespace", namespace);
                        console.log("begininning subscription to attrDB and density DBs");
                        Meteor.subscribe('basalAttrDB', namespace, ctx.project, 0 , function() {
                            console.log("done subscribing to attrDB,filling layers");
                            DBstoLayersGlobal();
                            console.log("initing types");
                            initTypesFromDB();
                            console.log('initing colormaps');
                            initColormapsFromDB();
                        });
                    }
                }
            );

        };

        return {
            initAttrDB: initAttrDB,
            eTest: equalsTest,
            /*
            create_dynamic_binary_layer: create_dynamic_binary_layer,
            get_active_layers: get_active_layers,
            update_shortlist: update_shortlist,
            update_shortlist_metadata: update_shortlist_metadata,

            create_dynamic_category_layer: function (layer_name, data, attributes,
                                                     colormap) {

                // @param: layer_name: layer name for the global layers object
                // @param: data: data for the global layers
                // @param: attributes: attributes for the global layers. At least these
                //                     should be included for now:
                //                         selection
                //                         n
                //                         magnitude
                // @param: colormap: the colormap for this layer, required for now

                attributes.minimum = 0;
                add_layer_data(layer_name, data, attributes);
                update_shortlist(layer_name);
                colormaps[layer_name] = colormap;
            },

            with_filtered_signatures: function (filters, callback) {
                // Takes an array of filters, as produced by get_current_filters.
                // Computes an array of all signatures passing all filters, and passes
                // that to the given callback.

                // TODO: Re-organize this to do filters one at a time, recursively, like
                // a reasonable second-order filter.

                // Prepare a list of all the layers
                var layer_names = [];

                for(var i = 0; i < filters.length; i++) {
                    layer_names.push(filters[i].layer_name);
                }

                with_layers(layer_names, function(filter_layers) {
                    // filter_layers is guaranteed to be in the same order as filters.

                    // This is an array of signatures that pass all the filters.
                    var passing_signatures = [];

                    for(var signature in polygons) {
                        // For each signature

                        // This holds whether we pass all the filters
                        var pass = true;

                        for(var i = 0; i < filter_layers.length; i++) {

                            // For each filtering layer
                            if(!filters[i].filter_function(
                                    filter_layers[i].data[signature])) {

                                // If the signature fails the filter function for the
                                // layer, skip the signature.
                                pass = false;

                                break;
                            }
                        }
                        if(pass) {

                            // Record that the signature passes all filters
                            passing_signatures.push(signature);
                        }
                    }

                    // Now we have our list of all passing signatures, so hand it off to
                    // the callback.
                    callback(passing_signatures);
                });
            },

            get_slider_range: function (layer_name) {
                // Given the name of a layer, get the slider range from its shortlist UI
                // entry. Assumes the layer has a shortlist UI entry.
                var range = Util.session('filter_value', 'get', layer_name);
                if (_.isUndefined(range)) {
                    return [layers[layer_name].minimum, layers[layer_name].maximum];
                } else {
                    return range;
                }
            },

            init: function () {
                if (initialized) { return; }
                //TIMING
                console.log("shortlist initialization taking place")
                initialized = true;

                // Initialize some handy variables
                $shortlist = $('#shortlist');
                $dynamic_controls = $shortlist.find('.dynamic_controls');
                $float_controls = $shortlist.find('.float');

                // Autorun to finish initializiation when the first layer is set
                // and after the initial sort
                Meteor.autorun(complete_initialization);

                // Run this whenever the active list changes to update the hot primary
                // and secondary icons and change the map colors.
                Meteor.autorun(when_active_layers_change);

                // Create the controls that move from entry to entry
                create_float_controls();
            }
            */
        };
    }());
})(app);
