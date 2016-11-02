//mapManager prototype. Currently only used for reflections.

var Fiber = Npm.require('fibers');
var readline  = Npm.require('readline');
var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');
var Path = Npm.require('path');

var MapManager = require('./mapManager');
var PythonCall = require('./pythonCall');

// global definition explanation below
// if not global then when I try and use the local reference in 
// another file,zLoadDbs.js I get the error:
// A method named '/ManagerFileCabinet/insert' is already defined
// could keep local if all manipualtions are in one file?
ManagerFileCabinet = new Mongo.Collection('ManagerFileCabinet');
ManagerAddressBook = new Mongo.Collection('ManagerAddressBook');
LayerPostOffice = new Mongo.Collection('LayerPostOffice');
Windows = new Mongo.Collection('Windows');


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
//populate the helper database from settings.json file
initManagerHelper();

//The following are helper functions specific to reflection functionality
function colorMapMaker(){
    //TODO: make a more flexible colorMapMaker (this one only for reflections)
    var newColorMap = [
        //order needs to be preserved because index needs to be equal to the
        // category
        {name:'low',color:'#32cd32',fileColor:'#32cd32'},
        {name:'middle',color:'#737373',fileColor:'#737373'},
        {name:'high',color:'#ce2029',fileColor:'#ce2029'}
                  ];
    return newColorMap;
}

function layerMaker(layer_name){
    var newLayer={};
    newLayer.timestamp = Math.floor(Date.now()/1000); //UTC timestamp in seconds
    newLayer.layer_name = layer_name;
    newLayer.selection  = true;
    newLayer.n          = 300;
    newLayer.magnitude = 3;//TODO: should this be 2?
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
        console.log("Refelction: dropInLayerBox Called with user, layer_name",
                     user,
                     layerData.layer_name
                    );

        layerData.data = arrayLayer(layerData);
        var old_layer_names = [];
        _.each(LayerPostOffice.findOne({user:user,toMapId:toMapId}).layers,
               function(layer){
                  old_layer_names.push(layer.layer_name);
               });
        
        layerData.layer_name =
            make_layer_name_unique(layerData.layer_name,old_layer_names);

        LayerPostOffice.update({user:user,toMapId:toMapId},
                               {$set: {lastChange: 'inserted'},
                                $push: {layers : layerData}});

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
    console.log("parmMaker being called for mapManager" +
                "/reflection with these two maps:", mapId,toMapId);

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
    // result: { code: <http-code>, data: <result-data> }
    
    var newLayer = context.post_calc_parms.newLayer,
        userId = context.post_calc_parms.userId,
        toMapId = context.post_calc_parms.toMapId;
    
    // Report any errors
    if (result.code !== 200) {
        PythonCall.report_local_result (result, context);
        return;
    }
    newLayer.data = context.js_result.data;
    
    dropInLayerBox(newLayer, userId, toMapId);
    
    PythonCall.report_local_result(result, context);
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
            post_calc_parms : post_calc_parms, //editor complained with shorthan
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

    //If layerbox is empty put something in there
    if( ! LayerPostOffice.findOne({user: userId, toMapId: currMapId}) ) {
        //console.log('mapManager: No layerbox found, making empty entry');
        var emptyLayers=[];
        LayerPostOffice.insert({user: userId,
                                toMapId: currMapId,
                                layers: emptyLayers,
                                lastChange:"created"
                                });
    } 

    var LayerBoxCursor = LayerPostOffice.find({user: userId,
                                               toMapId: currMapId
                                               });
    //always return Cursor from publish
    return LayerBoxCursor;
});

function regExForLongListSeach(term){
    //function used for each regular expression when querring the long list
    return(new RegExp(term,"i"));
}

function queryCaseMaker(queryObj){
    //determine which case is present in the query

    var qcase;
    //considerations determining case
    var tagsOn = (queryObj.tags !== undefined);
    var searchOn = (queryObj.term !== '');
    var userDefined = (queryObj.nodes !== undefined);

    //depending on the case execute the appropriate function
    if(userDefined){
        qcase = 'userDefined';
    } else if (tagsOn && searchOn){
        qcase = 'tagsAndSearch';
    } else if( tagsOn && !searchOn){
        qcase = 'tagsAndNotSearch';
    } else if( !tagsOn && searchOn){
        qcase = 'notTagsAndSearch';
    } else if( !tagsOn && !searchOn){
        qcase = 'notTagsAndNotSearch';
    } 
    else {
        qcase = undefined;
    }
    return qcase;
}
//

function getCountofLongListQuerry(queryObj){
    //counts the documents that match a request from a longList query
    var namespace = queryObj.namespace;
    var tags = queryObj.tags;
    var term = queryObj.term;
    var dtypes = queryObj.dtypes;

    var qcount,regEx;

    switch (queryCaseMaker(queryObj)) {
        case 'tagsAndSearch':
            regEx = regExForLongListSeach(term);
            qcount = AttribDB.find(
                { $and :
                    [
                        {namespace: namespace},
                        {"tags.name": {$in: tags}},
                        {datatype: {$in : dtypes}},
                        {name: regEx}
                    ]
                }
            ).count();
            break;

        case 'tagsAndNotSearch':
            qcount = AttribDB.find(
                { $and :
                    [
                        {namespace: namespace},
                        {"tags.name": {$in: tags}},
                        {datatype: {$in : dtypes}}
                    ]
                }).count();
            break;

        case 'notTagsAndNotSearch':
            qcount = AttribDB.find({namespace: namespace}).count();
            break;

        case 'notTagsAndSearch':
            regEx = regExForLongListSeach(term);
            qcount = AttribDB.find({
                namespace: namespace,
                name: regEx
            }).count();
            break;

        default :
            break;
    }
    return qcount;
}

function clientDefinedOrder(queryObj){
    // if the client is defining the order then we only need
    // to get the layer names, stuff them in an array and send em back.
    
    var namespace = queryObj.namespace;
    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var start = queryObj.start || 0; //if undefined then 0
    var tags  = queryObj.tags; //an array of tags applied to the query
    var page_size = queryObj.page_size; //for each query this many are populated
    var dtypes      = queryObj.dtypes;
    
    //these feilds are specific to a client defined query
    //nodes should peice of the sorted array 
    var nodes = queryObj.nodes;
    var qcount = queryObj.qcount; // these two get passed through this function 
    var skip = start + page_size; //  so the API for client defined stays the same
    
    var listResponse = [];
    
    nodes.forEach(function(node){
        var attrDoc = AttribDB.findOne({namespace: namespace,name: node});
        var densDoc = DensityDB.findOne({project: project, layout_name: layout_name, name: node}, {project: {density:1}});
        
        var displayDoc = {
            name: attrDoc.name,
            datatype: attrDoc.datatype,
            density: densDoc.density,
            n : attrDoc.n,
            p : attrDoc.positives
        };
        listResponse.push(displayDoc);
    });
    var resDoc = {
        listResponse : listResponse,
        qcount : qcount,
        skip : skip
    };
    return resDoc;
    
    
}
function testIt(queryObj) {
    // doing joins by "hand" increases performance
    //returns an array with two entries
    // 0 index is the array of display docs
    // 1 index is the new start parameter for the next database call

    //these are all the things you need from the query object
    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var start = queryObj.start || 0; //if undefined then 0
    var tags  = queryObj.tags; //an array of tags applied to the query
    var page_size = queryObj.page_size; //for each query this many are populated
    var dtypes      = queryObj.dtypes;

    var densCurs = DensityDB.find({project: project,layout_name: layout_name},{sort: {density:-1}, skip:start});


    var entriesFound= [];

    //switch
    var ON = true;
    //we need to be able to break out of the loop when we are done
    // try catch is messy, but the only way to do so using the cursor's .forEach
    var breakException = {};
    try {
        densCurs.forEach(function (doc){
            if (ON) {
                ON = false;
                console.log("first document's name is", doc.name);
            }
            var attrDoc = AttribDB.findOne({name: doc.name, "tags.name" : {$in : tags},datatype : {$in : dtypes}});
            if (attrDoc){
                var displayDoc = {
                    name: attrDoc.name,
                    datatype: attrDoc.datatype,
                    density: doc.density,
                    n : attrDoc.n,
                    p : attrDoc.positives
                };
                page_size -=1;
                entriesFound.push(displayDoc);
                if (page_size === 0) throw breakException;
            }

            start+=1;

        });
    } catch (e) {
        if (e !== breakException) {
            throw e; //if something else happened then toss the exception on
        }
    }
    var retObj = {
        listResponse : entriesFound,
        skip : start,
        qcount : densCurs.count()
    };
    return retObj;
}
//aggregate functions used to query the longlist
// each function is seperate because the aggregate function has
// a different pipeline in each case
// for instance when scrolling we don't search based on a regEx
// and if not using tags we can limit our results before checking the tags
//
// extra verbosity added by processing query object so that values needed is
// explicit
function scrollLongListTags(queryObj){

    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var start = queryObj.start || 0;
    var tags  = queryObj.tags; //an array of tags applied to the query
    var page_size = queryObj.page_size; //for each query this many are populated
    var dtypes      = queryObj.dtypes;

    //console.log("tags and dtypes for this call",tags,dtypes);
    //console.log(queryObj);
    console.time("test");
    var test = testIt(queryObj);
    console.timeEnd("test");
    //console.log("about to run aggregate querry with tags, dtypes:",tags,dtypes);

    /*
    console.time("longListArray");


    var longListArray =
        DensityDB.aggregate(
            [
                {$sort: {density: -1}},
                //grab the density documents we want
                {$match: {project: project, layout_name: layout_name}},
                //sort them now so we can take advantage of any index
                //join them with the attribute data
                {
                    $lookup: {
                        from: "AttribDB",
                        localField: "attribute_name",
                        foreignField: "attribute_name",
                        as: "attrMetaData"
                    }
                },
                //match the tags and datatypes
                {$match:
                { $and :
                    [
                        {"attrMetaData.tags.name": {$in: tags}} ,
                        {"attrMetaData.datatype" : {$in : dtypes}}
                    ]
                }
                },
                //start is where you left off on the client
                {$skip: start},
                //limit the results over the wire to 250
                {$limit: page_size}
            ]
        );
    console.timeEnd("longListArray");
    return longListArray;
    */
    return test;
}

function scrollLongListNoTags(queryObj){

    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var start = queryObj.start || 0;
    var page_size = queryObj.page_size;

    //generate the longList data to be returned
    var longListArray =
        DensityDB.aggregate(
            [
                //grab the density documents we want
                {$match: {project: project,
                          layout_name: layout_name}
                },
                //sort them now so we can take advantage of any index
                {$sort: {density: -1}},
                // if their are no tags then we can do the limiting step now
                //start is where you left off on the client
                {$skip: start},
                //limit the results over the wire to 250
                {$limit: page_size},
                //join them with the attribute data
                {
                    $lookup: {
                        from: "AttribDB",
                        localField: "attribute_name",
                        foreignField: "attribute_name",
                        as: "attrData"
                    }
                }
            ]
        );
    return longListArray;
}

function searchLongListTags(queryObj){
    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var term        = queryObj.term;
    var tags        = queryObj.tags;
    var dtypes      = queryObj.dtypes;
    var start = queryObj.start || 0; // for infinite scroll...
    var page_size = queryObj.page_size;

    //generate case insenitive regular expression to search on
    var regEx = regExForLongListSeach(term);

    var longListArray =
        DensityDB.aggregate(
            [
                //grab the density documents we want
                {$match: {project: project, layout_name: layout_name}},
                //sort them now so we can take advantage of any index
                {$sort: {density: -1}},

                {$match: {name: regEx}},

                //join them with the attribute data
                {
                    $lookup: {
                        from: "AttribDB",
                        localField: "attribute_name",
                        foreignField: "attribute_name",
                        as: "attrMetaData"
                    }
                },
                //match the tags and datatypes
                {$match:
                    { $and :
                        [
                            {"attrMetaData.tags.name": {$in: tags}} ,
                            {"attrMetaData.datatype" : {$in : dtypes}}
                        ]
                    }
                },
                //start is where you left off on the client
                {$skip: start},
                //limit the results over the wire to 250
                {$limit: page_size}
            ]
        );

    return longListArray;
}
function searchLongListNoTags(queryObj){

    var project = queryObj.project;
    var layout_name = queryObj.layout_name;
    var term        = queryObj.term;
    var start = queryObj.start || 0; // for infinite scroll...
    var page_size = queryObj.page_size;

    //generate case insenitive regular expression to search on
    var regEx = regExForLongListSeach(term);

    var longListArray =
        DensityDB.aggregate(
            [
                //grab the density documents we want
                {$match: {project: project, layout_name: layout_name, name: regEx}},
                //{$match: {attribute_name: regEx}}, //if using index above will want to separate this?
                //sort them now so we can take advantage of any index
                {$sort: {density: -1}},
                //start is where you left off on the client
                {$skip: start},
                //limit the results over the wire to the size of search display???
                {$limit: page_size},


                //join them with the attribute data
                {
                    $lookup: {
                        from: "AttribDB",
                        localField: "attribute_name",
                        foreignField: "attribute_name",
                        as: "attrMetaData"
                    }
                }

            ]
        );

    return longListArray;
}
//end of helper functions of native longList queries
/////////////////////////////////////////

function makeJsonData(nodes, vals){
    //make a nodes->value JSON object
    var Json = {};
    for (var i = 0 ; i < vals.length; i++){
        Json[nodes[i]] = vals[i];
    }
    return Json;
}
Meteor.methods(
    {
        longListQuery: function (queryObj) {
            //the querry responds with a
            // res.listResponse : the longList entries for the query
            // and
            // res.qcount : the count of documents for the particular query

            var queryResult = {};

            //determine which case is present,and execute appropriate function
            switch (queryCaseMaker(queryObj)) {
                case 'tagsAndSearch':
                    queryResult.listResponse = searchLongListTags(queryObj);
                    break;

                case 'tagsAndNotSearch':
                    queryResult = scrollLongListTags(queryObj);
                    break;

                case 'notTagsAndNotSearch':
                    queryResult.listResponse = scrollLongListNoTags(queryObj);
                    break;

                case 'notTagsAndSearch':
                    queryResult.listResponse = searchLongListNoTags(queryObj);
                    break;
                
                case 'userDefined':
                    queryResult = clientDefinedOrder(queryObj);
                    break;
                
                default :
                    break;
            }

            //getCount also uses a 'switch' for the appropriate case
            //queryResult.qcount = getCountofLongListQuerry(queryObj);

            return queryResult;
        }
    }
);
    Meteor.methods(
        {
        getEntryForShortList: function (qObj) {
            if (!qObj) {
                return
            }
            //input should be a querry object with following feilds
            // {
            //   namespace : ,
            //   attribute_name : ,
            //   layout_name    : ,
            //   project         : ,
            //  }
            //when the data comes from here, you must change the format of the
            // colormap on the client, you can simply pass the entry to
            // the colorMapArrayToObj() function on the client.

            var densityDoc = DensityDB.findOne({
                project: qObj.project,
                layout_name: qObj.layout_name
            });

            var metadataDoc = AttribDB.findOne(
                {
                    namespace: qObj.namespace,
                    name: qObj.attribute_name
                });

            var dataDoc = AttrDataDB.findOne(
                {
                    namespace: qObj.namespace,
                    name: qObj.attribute_name
                },
                {
                    _id: 0,
                    node_ids: 1,
                    values: 1
                }
            );

            //if there is a dataDoc there then store the node ids.
            var node_ids = (!!dataDoc) ? dataDoc.node_ids : undefined;
            var values = (!!dataDoc) ? dataDoc.values : undefined;
            
            
            if (!node_ids || !values) {
                
            } else {
                //make data structure from the two parallel arrays
                var data = makeJsonData(node_ids, values);
            }
            var entryDoc = {
                data: data,
                datatype: metadataDoc.datatype,
                colormap: metadataDoc.colormap,
                max: metadataDoc.max,
                min: metadataDoc.min

            };

            var displayDoc = {
                datatype: metadataDoc.datatype,
                denstiy: densityDoc.density,
                n: metadataDoc.n,
                p: metadataDoc.positives
            };

            var retDoc = {
                short_entry: entryDoc,
                display: displayDoc
            };
            return retDoc;

        }
    }
    );

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
    return ManagerAddressBook.find({mapId: currMapId, operation: 'reflection'});
});

Meteor.publish('ManagerFileCabinet',function(mapId) {
    //publishes a subset of the fileCabinet, mainly so the client is aware of
    // nodes reflection is available to
    
    // if not logged in function won't do anything
    if(!this.userId) { return this.stop(); }

    return ManagerFileCabinet.find({mapId: mapId},{fields:{mapId:1,available_nodes:1, datatype:1,toMapId:1,operation:1}});

});

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
//end Windows collection manipulators
