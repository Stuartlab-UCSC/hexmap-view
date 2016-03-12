
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var url = Meteor.absoluteUrl();

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

function passOverlayNodeChecks (dataIn, res) {

    // Do some checks on the overlayNodes request content, returning false if
    // not passing.
    
    // TODO Validate a specific map and layout for now.
    // Eventually we will want to check for any maps we have deemed frozen
    var map = 'CKCC/stable',
        layout = 'mRNA';
    
    // Validate that certain properties are included
    if (!dataIn.hasOwnProperty('map')) {
        respond(400, res, 'Map missing or malformed');
        return false;

    } else if (!dataIn.hasOwnProperty('layouts')) {
        respond(400, res, 'Layouts missing or malformed');
        return false;

    } else if (typeof dataIn.layouts !== 'object') {
        respond(400, res, 'Layouts type should be an object')
        return false;
    
    // Validate a specific map and layout for now.
    } else if (dataIn.map !== map) {
        respond(400, res, 'The only frozen map available is ' + map);
        return false;
    } else if (!dataIn.layouts.hasOwnProperty(layout)) {
        respond(400, res, 'The only map layout available is ' + layout);
        return false;
    }
        
    return true;
}
    
saveBookmark = function(state) {

    // TODO replace this with a hash of the state so the same state may reuse an
    // existing bookmark of the same state
    var crypto = Npm.require('crypto');
    var id = crypto.randomBytes(4).readUInt32LE(0).toString();
    
    // TODO should fibers/future be used here?
    // TODO put this into dbMethods.js
    var Fiber = Npm.require('fibers');
    var f = Fiber(function(id) {
        Bookmarks.insert({
            "_id": id,
            "jsonState": state,
            "createdAt": new Date(),
        });
    }).run(id);
    return id
}

function overlayNodesGetXy(dataIn) {

    // For now this is a stub and we return the positions for our mock samples.
    var xyData = '{"map": "CKCC/stable", "layout": "mRNA", "nodes": {"PNOC003-009": {"x": "64.5", "y": "228.3333333"}, "PNOC003-011": {"x": "43", "y": "227.1666667"}}}';
    return JSON.parse(xyData);
}

function overlayNodes(dataIn, res) {

    // Process the data in the overlayNodes request.
    
    if (!passOverlayNodeChecks(dataIn, res)) return;
    
    if (dataIn.hasOwnProperty('testBookmarkStub')) {

        // Return this fake URL for this test
        var dataOut = {bookmark: url + "?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"};
        respond(200, res, dataOut);

    } else {
        var xyData = overlayNodesGetXy(dataIn);
        var state = {
            page: 'mapPage',
            project: 'data/' + xyData.map + '/',
            current_layout_name: xyData.layout,
            overlayNodes: xyData.nodes,
        };
        var bookmark = saveBookmark(state);
        respond(200, res, {bookmark: url + '?b=' + bookmark});
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
    
    var queryFx = overlayNodes;
    var jsonDataIn = '';
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this requests
    req.on('end', function () {
    
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
