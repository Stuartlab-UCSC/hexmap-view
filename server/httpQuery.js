
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var url = Meteor.absoluteUrl(),

    // TODO fixed map and layout for now
    map = 'CKCC/v1',
    layout = 'mRNA';

function respond (code, res, msg) {

    // Send a response to the client.
    var data = msg;
    if (code === 200) {
        res.setHeader('Content-Type', 'application/json');
        data = JSON.stringify(msg);
    }
    res.writeHead(code);
    res.end(data + '\n');
}

function pythonCallStub(dataIn, res) {

    // For this stub, we'll return a fake xy position for each node requested
    var resData = {
           map: map,
           layouts: {},
           },
        i = 1;
    resData.layouts[layout] = {}

    for (node in dataIn.layouts.mRNA) {

        // Assuming our map has a max coordinates of (110, 110)
        // and there are no more that 10 nodes.
        var x = 10 * i;
        i += 1;
        resData.layouts[layout][node] = {x: x, y: x};
        if (i > 10) {
            break;
        }
    }
    console.log('resData.layouts.mRNA:', resData.layouts.mRNA);
    return resData;
}

saveBookmark = function(state) {

    // TODO replace this with a hash of the state so the same state may reuse an
    // existing bookmark of the same state
    var crypto = Npm.require('crypto');
    var id = crypto.randomBytes(4).readUInt32LE(0).toString();
    
    // TODO fibers/future should be used here
    var Fiber = Npm.require('fibers');
    var f = Fiber(function(id) {
        Bookmarks.insert({
            "_id": id,
            "jsonState": JSON.stringify(state),
            "createdAt": new Date(),
        });
    }).run(id);
    return id
}

function saveBookmarkFromOverlayNodes(pythonDataIn) {
    var state = {
            page: 'mapPage',
            //project: "data/CKCC/v1/",
            project: 'data/' + pythonDataIn.map + '/',
            current_layout_name: "mRNA",
            overlayNodes: pythonDataIn.layouts.mRNA,
        },
        bookmark = saveBookmark(state);
    
        console.log('bookmark id:', bookmark);
    return bookmark;
    
    // TODO for now we return a fake bookmark for testing
    return "18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"

    //{"background":"black","page":"mapPage","project":"data/swat/pancan33+/",
    // "center":[9.66796875,9.999894245993346e-9],
    // "current_layout_name":"PANCAN33+","first_layer":"Disease","gridZoom":1,
    // "shortlist":["Disease"],"zoom":1}
}

function pythonCall(queryDataIn, res) {

    var pythonDataIn = pythonCallStub(queryDataIn, res);
    
    // TODO handle errors in python call
    
    // Save state as a bookmark
    var bookmark = saveBookmarkFromOverlayNodes(pythonDataIn);
    
    var dataOut = {bookmark: url + '?b=' + bookmark};
    respond(200, res, dataOut);
}

function overlayNodes(dataIn, res) {

    // Process the data in the request.

    // Validate a specific map and layout for now.
    var map = 'CKCC/v1',
        layout = 'mRNA';
    
    // Validate that certain properties are included
    if (!dataIn.hasOwnProperty('map')) {
        respond(400, res, 'Map missing or malformed');
    } else if (!dataIn.hasOwnProperty('layouts')) {
        respond(400, res, 'Layouts missing or malformed');
    } else if (typeof dataIn.layouts !== 'object') {
        respond(400, res, 'Layouts type should be an object')
    
    // Validate a specific map and layout for now.
    } else if (dataIn.map !== map) {
        respond(400, res, 'The only frozen map available is ' + map);
    } else if (!dataIn.layouts.hasOwnProperty(layout)) {
        respond(400, res, 'The only map layout available is ' + layout);
        
        
    } else if (dataIn.hasOwnProperty('testPythonCallStub')) {

        // All validations have passed, so process the data
        // TODO this is throwing error:
        // Error: Meteor code must always run within a Fiber.
        // Try wrapping callbacks that you pass to non-Meteor libraries with Meteor.bindEnvironment.
        Meteor.call('pythonCall', 'overlayNodes', dataIn, true,
            function (error, result) {
                if (error) {
                    respond(400, res, error);
                } else if (result.slice(0,5) === 'Error'
                        || result.slice(0,4) === 'Warning') {
                    respond(400, res, result);
                } else {
                
                    if (dataIn.hasOwnProperty('testPythonCallStub')) {
                    
                        // A funky way to test the pipeline from query request
                        // to receiving data from our overlayNodes.py stub
                        dataOut = results;
                        respond(200, res, dataOut);
                    
                    } else {
                    
                        // TODO
                        respond(200, res, dataOut);
                    }
                }
            }
        );
        
    } else if (dataIn.hasOwnProperty('testBookmarkStub')) {

        // TODO for now we return a fake URL for testing
        var dataOut = {bookmark: url + "?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"};
        respond(200, res, dataOut);

    } else {
    
        pythonCall(dataIn, res);
    }
}

function passBasicChecks (req, res) {

    // Do some basic checks on the request headers, returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respond(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respond(400, res, 'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    
    // Receive query requests and process them
    // TODO use this to process all queries, not just overlayNodes
    
    if (!passBasicChecks(req, res)) {
        return;
    }
    
    req.setEncoding('utf8');
    var jsonDataIn = '';
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    var queryFx = overlayNodes;
    req.on('end', function () {
    
        // Process the data in the request.
        //console.log('jsonDataIn:', jsonDataIn);
        try {
            var dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respond(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the query-specific function and let it complete the response
        queryFx(dataIn, res);
    });
});
