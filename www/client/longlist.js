// layerLists.js
// Manage the layer lists.

var app = app || {}; 

(function (hex) { 

    // How many layer results should we display at once?
    var SEARCH_PAGE_SIZE = 10,
        $search, numOfAttributes,
        layout_name, project;
    /*
    Meteor.call("getNumAttribute",ctx.project,"0",function(err,res) {
        if (err) {
            console.log("there was an error getting the number of attributes" +
            "for the longlist",err);
        }
        else {
            console.log("number of attributes,",res);
            numOfAttributes = res;
        }
    });
    */
    function binaryDescription(n,p,hexCount){
        return p + '/' + n + ' (' + (hexCount - n) + ' missing)';
    }
    function formatValue(value){
        //Format a value for display in the longList
        var value_formatted;
        if (typeof value === "number") {
            if(value % 1 == 0) {
                // It's an int!
                // Display the default way
                value_formatted = value;
            } else {
                // It's a float!
                // Format the number for easy viewing
                value_formatted = value.toExponential(1);
            }
        } else {
            // Just put the thing in as a string
            value_formatted = value;
        }
        return value_formatted;
    }

    function addTextToLongListContainer(container,value,attribute){
        console.log("addTestToLongContainer called with container,value,attribute",container,value , attribute);
        //attribute is the kind of data we are placeing in
        // and value is the value of that attribute
        var metadata = $("<div\>").addClass("layer-metadata");
        var text;

        //if no attribute is passed to this function we will assume value
        // holds the string we want to display
        if (_.isUndefined(attribute)){
            text = value;
        } else { //if we have specified the attribute use
                 // lookup to make fancy string we want to display
            var lookup = {
                n: "Non-empty values",
                positives: "Number of ones",
                inside_yes: "Ones in A",
                outside_yes: "Ones in background",
                density: "Density score",
                p_value: "Single test p-value",
                correlation: "Correlation",
                adjusted_p_value: "BH FDR",
                adjusted_p_value_b: "Bonferroni p-value",
            };

            if (lookup[attribute]) {
                // Replace a boring short name with a useful long name
                attribute = lookup[attribute];
            }

            text = attribute + " = " + formatValue(value);

        }

        metadata.text(text);
        console.log("the metadatacontainer before appending",metadata);
        container.append(metadata);
        console.log("the metadatacontainer after appending",metadata);
    }
    function fill_longList_entry(container, qresult) {
        //now we explicittly state what we want in the long list,
        // this means that thing like pvals or correction numbers are going to break
        // at first because I'm not going to hit all the cases first try

        var density      = qresult.density;
        var attrMetaData = qresult.attrMetaData[0];


        // Empty the given jQuery container element, and fill it with layer metadata
        // for the layer with the given name.

        // Empty the container.
        container.html("");

        var n = attrMetaData.n;
        /*
        // if the attribute is binary then we are interested in
        if (attrMetaData.datatype === "Binary") {
            var p = attrMetaData.positives;
            var hexCount = Object.keys(polygons).length;
            var bintext =  p + '/' + n + ' (' + (hexCount - n) + ' missing)';
            addTextToLongListContainer(container,bintext)
        }
        */
        addTextToLongListContainer(container,density,"density");
    }        
    
    function make_longListUi(qresult) {
        //input is the result from a query
        //console.log(qresult);
        var layer_name = qresult.name;

        // This holds a jQuery element that's the root of the structure we're
        // building.
        var root = $("<div/>").addClass("layer-entry");
        root.data("layer-name", layer_name);

        // Put in the layer name in a div that makes it wrap.
        root.append($("<div/>").addClass("layer-name").text(layer_name));

        // Put in a layer metadata container div
        var metadata_container = $("<div/>").addClass("layer-metadata-container");

        fill_longList_entry(metadata_container,qresult);

        root.append(metadata_container);
    }
    function make_browse_ui(layer_name,displayDoc) {
        //console.log("longlist filler being called for:",layer_name);
        //ATTRDB:
        // this function is what loads the longlist with stuff that you can see
        // this could be replaced with an infinite scroll tactic much like 
        // the to-dos app
        
        //console.log("make browse ui is called")
        // Returns a jQuery element to represent the layer with the given name in
        // the browse panel.
        
        // This holds a jQuery element that's the root of the structure we're
        // building.
        var root = $("<div/>").addClass("layer-entry");
        root.data("layer-name", layer_name);
        
        // Put in the layer name in a div that makes it wrap.
        root.append($("<div/>").addClass("layer-name").text(layer_name));
        
        // Put in a layer metadata container div
        var metadata_container = $("<div/>").addClass("layer-metadata-container");

        fill_layer_metadata2(metadata_container, displayDoc);
        //fill_layer_metadata(metadata_container, layer_name);
        
        root.append(metadata_container);
        
        return root;
    }

    updateLonglist = function() {
    
        // Make the layer browse UI reflect the current list of layers in sorted
        // order.
        
        // Re-sort the sorted list that we maintain
        sort_layers();

        // Close the select if it was open, forcing the data to refresh when it
        // opens again.
        $("#search").select2("close");
    };
        /*
    myAjaxFunct = function() {
      $.ajax(
          {
              type: "POST",
              url: "http://localhost:2347/query/attributes",
              data: '{str : "HERE YOU CAN PUT DATA TO PASS AT THE SERVICE"}',
              contentType: "application/json; charset=utf-8",
              dataType: "json",
              success: function (msg) {
                  //do something
                  console.log("success ajax,",msg)
              },
              error: function (errormessage) {
                    console.log("ajaxErr",errormessage)
                  //do something else

              }
          });
    };
    */
    /*
    function populateLongList() {
        //eventually want a wrapper function that can choose how to populate the longlist
        // on second thought, this should just be an object with different querry functions
        // for the select2
    }
    */
    var amountQuerried = 0;
    initLayerLists = function () {
        //this needs to happen after these are set...

        project = ctx.project;
        var namespace = Session.get("namespace");
        layout_name = String(Session.get('layoutIndex'));
        

        //TIMING
        console.log('intiing the LongList');
        $search = $("#search");

        // Set up the layer search
        //ATTRDB:
        $search.select2({
            /*
            ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
                //url: "https://api.github.com/search/repositories",
                type: "GET",
                url : "http://localhost:2347/query/attributes",
                dataType: 'json',
                quietMillis: 250,

                // this is what passes data through your ajax call,
                // we are going to want to pass the layout name, namespace,
                // mapID/project, and the querry term...
                // going to have to fix that little 1-1 density -> attrDB necessity hiccup
                
                data: function (term, page) { //so the term is what was querried and the page is a select2 reminder for scrolling...
                    console.log("term page",term,page);
                    return {
                        q: term, // search term
                    };
                },
                
                results: function (data, page) { // parse the results into the format expected by Select2.
                    // since we are using custom formatting functions we do not need to alter the remote JSON data
                    console.log('results from ajax called')
                    console.log(data);
                    var selectFormat =[{id: 0, text: "hello"}];
                    var index=0;
                    /*
                    data.forEach(function(dat){
                        selectFormat.push({id: index, text: "hello"})
                        index+=1;
                    });

                    return selectFormat;
                },
                cache: true
            },
            initSelection: function(element, callback) {
                // the input tag has a value attribute preloaded that points to a preselected repository's id
                // this function resolves that id attribute to an object that select2 can render
                // using its formatResult renderer - that way the repository name is shown preselected
                var id = $(element).val();
                console.log("https://api.github.com/repositories/" + id);

                if (id !== "") {
                    $.ajax("https://api.github.com/repositories/" + id, {
                        dataType: "json"
                    }).done(function(data) { callback(data); });
                }
            },
            */

            /*

            ajax : {
                url : "http://localhost:2347/query/attributes/0/density",
                dataType: 'json',
                quietMillis: 250,
                data: function (term, page) {
                    return {
                        q: term, // search term
                    };
                },
                results: function (data, page) { // parse the results into the format expected by Select2.
                    // since we are using custom formatting functions we do not need to alter the remote JSON data
                    var selectFormat =[]
                    var index=0;
                    data.forEach(function(dat){
                        selectFormat.push({id: index, text: "hello"})
                        index+=1;
                    });
                    
                    return selectFormat ;
                },
                cache: true
            },
            */
            //closeOnSelect: false, doesn't work, maybe because of old version of select2?
            placeholder: "Select Attributes...",
            query: function(query) {
                //querry is how it does the search...
                // Given a select2 query object, call query.callback with an object
                // with a "results" array.
                
                // This is the array of result objects we will be sending back.
                var results = [];

                //console.log("the query.context is:",query.context);
                // Get where we should start in the layer list, from select2's
                // infinite scrolling.
                /*
                var start_position = 0;
                if(query.context !== undefined || query.context !== null ) {
                    start_position = query.context;
                }
                */
                var filters = getSelectedTags(); //grab the selected filters from UI

                // most of what we need make a query to the server
                var queryObj = {
                    namespace : namespace,
                    layout_name : layout_name,
                    term : query.term,
                    project : project,
                    start : query.context || 0,
                    tags : filters.tags,
                    dtypes : filters.dtypes,
                    page_size : SEARCH_PAGE_SIZE,// that should probably be put in above, and only what we don't know added here
                };
                //if we are not searching on a term
                // then we will use the 'sortedLayers' object
                //var browsing = (query.term === '');
                //if (browsing){
                //    queryObj.nodes = Session.get('sortedLayers').slice(queryObj.start,queryObj.start + 10)
                //    numOfAttributes = Session.get('sortedLayers').length
                //}
                //console.log(queryObj.nodes);
                Meteor.call("longListQuery",queryObj,function(err,res){
                    if (err) {
                        console.log("longListQuery failed with error:", err);
                    }
                    else {
                        //put in the format we want for further processing
                        res.listResponse.forEach(function (doc) {
                            results.push({
                                id: doc.name,
                                doc: doc
                            });
                        });

                        numOfAttributes = res.qcount;

                        //if (!browsing) {
                            //then we are searching on a query term
                        //    numOfAttributes = res.qcount;
                        //}
                        //onsole.log("count from the query is:",numOfAttributes);
                        //console.log("the number skipped was:",res.skip);
                        //console.log("longlist query esxecuted with:",queryObj);
                        //console.log("calced num of attributes:",numOfAttributes);

                        //pass over to select2
                        query.callback({
                            results: results,//res.listResponse,//results,
                            // Say there's more if we broke out of the loop.
                            more: (query.context || 0) < numOfAttributes, //Session.get('sortedLayers').length,
                            // If there are more results, start after where we left off.
                            context: (query.context || 0) + SEARCH_PAGE_SIZE + 1
                        });
                    }
                });
                /* the overly verbose code, if statements now handled on the server
                if(queryObj.term !== "") {
                    Meteor.call("longListSearch", queryObj, function (err, res) {
                        if (err) {
                            console.log("longListSearch failed with err:", err);
                        } else {
                            console.log("search called with", queryObj);
                            res.forEach(function (doc) {
                                resALT.push({
                                    id: doc.attribute_name
                                });
                            });
                            amountQuerried += queryObj.page_size;
                            console.log("amount querried, page size:",amountQuerried,queryObj.page_size);
                            query.callback({

                                results: resALT,
                                // Say there's more if we broke out of the loop.
                                more: amountQuerried < numOfAttributes,//Session.get('sortedLayers').length,
                                // If there are more results, start after where we left off.
                                context: amountQuerried + 1
                            });

                        }
                    });
                } else {
                    Meteor.call("getDefaultLongList", queryObj, function (err, res) {
                        if (err) {
                            console.log("longListSearch failed with err:", err);
                        } else {
                            console.log("getDefalut called with",queryObj);
                            res.forEach(function (doc) {
                                resALT.push({
                                    id: doc.attribute_name
                                });
                            });
                            console.log("amount querried, page size:",amountQuerried,queryObj.page_size);
                            amountQuerried += queryObj.page_size;
                            query.callback({

                                results: resALT,
                                // Say there's more if we broke out of the loop.
                                more: amountQuerried < numOfAttributes,//Session.get('sortedLayers').length,
                                // If there are more results, start after where we left off.
                                context: amountQuerried + 1
                            });

                        }
                    });
                }
                */
                /* // The old code
                var displayLayers = Session.get('displayLayers'),
                    sortedLayers = Session.get('sortedLayers');
                for (var i = start_position; i < sortedLayers.length; i++) {

                    // Check for the sort layer being in the display layers
                    // and the sort term in the layer name
                    if (displayLayers.indexOf(sortedLayers[i]) > -1
                        && sortedLayers[i].toLowerCase().indexOf(
                        query.term.toLowerCase()) > -1) {
                        
                        // Query search term is in this layer's name. Add a select2
                        // record to our results. Don't specify text: our custom
                        // formatter looks up by ID and makes UI elements
                        // dynamically.
                        results.push({
                            id: sortedLayers[i]
                        });
                        
                        if(results.length >= SEARCH_PAGE_SIZE) {
                            // Page is full. Send it on.
                            break;
                        }
                        
                    }
                }
                */
                /*
                // Give the results back to select2 as the results parameter.
                query.callback({

                    results: results,
                    // Say there's more if we broke out of the loop.
                    more: i < numOfAttributes,//Session.get('sortedLayers').length,
                    // If there are more results, start after where we left off.
                    context: i + 1
                });
                */
            },

            formatResult: function(result, container, query) {
                // Given a select2 result record, the element that our results go
                // in, and the query used to get the result, return a jQuery element
                // that goes in the container to represent the result.
                
                // Get the layer name, and make the browse UI for it.
                //return make_longListUi(result.id);

                //take the results of the query and put them in a format
                // we are going to place on displace

                //var metaData = result.doc.attrMetaData[0];

                //everything except for datatype will be displayed on the UI
                // if there are extra things to pull from, like p-values ect,
                // this is where you want to make a case and stuff them in...
                /*
                var displayDoc = {
                    datatype : metaData.datatype,
                    density : result.doc.density,
                    n : metaData.n,
                    p : metaData.positives
                };
                 */
                return make_browse_ui(result.id,result.doc);
            },
        });

        // Make the bottom of the list within the main window
        $search.parent().on('select2-open', function () {
            var results = $('#select2-drop .select2-results');
            results.css('max-height', $(window).height() - results.offset().top - 15);
            
            // Allow the rest of the UI to remain active
            $('#select2-drop-mask').css('display', 'none');
        });

        // Handle result selection
        $search.on("select2-selecting", function(event) {
            // The select2 id of the thing clicked (the layer's name) is event.val
            var layer_name = event.val;
            
            // User chose this layer. Add it to the global shortlist.
            Shortlist.update_shortlist(layer_name);
            
            // Don't actually change the selection.
            // This keeps the dropdown open when we click.
            event.preventDefault();
        });
 
        // Make the dropdown close if there is a click anywhere on the screen
        // other than the dropdown and search box
        $(window).on('mousedown', function (ev) {
            $("#search").select2("close");
        });
    };
})(app);
