
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var Future = Npm.require('fibers/future');
var exec = Future.wrap(Npm.require('child_process').exec);

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
    var map = 'CKCC/v1',
        layout = 'mRNA';
    
    // Validate that certain properties are included
    if (!dataIn.hasOwnProperty('map') && !dataIn.hasOwnProperty('map2')) {
    
        // TODO use this ?:
        //  throw new Meteor.Error(403, "Access denied")

        respond(400, res, 'Map missing or malformed');
        return false;

    } else if (!dataIn.hasOwnProperty('layout')) {
        respond(400, res, 'Layout missing or malformed');
        return false;

    } else if (!dataIn.hasOwnProperty('nodes')) {
        respond(400, res, 'Nodes missing or malformed');
        return false;

    } else if (typeof dataIn.nodes !== 'object') {
        respond(400, res, 'Nodes type should be an object')
        return false;

    // Validate a specific map and layout for now.
    } else if (dataIn.map !== map) {
        respond(400, res, 'The only frozen map available is ' + map);
        return false;
        
    } else if (dataIn.layout !== layout) {
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

function sendMail(users, subject, msg) {

    // Send mail to user(s) with the given subject and message.
    // TODO handle email array or singleton
    var command =
        'echo "'
        + msg
        + '" | '
        + 'mail -s "'
        + subject
        + '" '
        + users;

    exec(command, function (error, stdout, stderr) {
        if (error) {
            console.log('sendMail had an error:', error);
        }
    });
}

function overlayNodes (dataIn, res) {
    
    // Process the data in the overlayNodes request where dataIn is the
    // request data as a javascript object.
    
    // Let the validator send the response on invalid data.
    if (!passOverlayNodeChecks(dataIn, res)) return;
    
    // Set up some static options for the python call
    var opts = {
        neighborhood_size: 6,
        num_jobs: 0,
        data: dataIn,
    };
    
    if (dataIn.TESTbookmarkStub) {

        // Return this fake URL for this test
        respond(200, res, {bookmark: url + "?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"});
        return;
    } else if (dataIn.TESTpythonCall || dataIn.TESTpythonCallBookmark) {

        // Point to the test data for this test
        opts.in_pivot = TEST_DATA_DIR + 'overlayNodesQuery.json';
        opts.in_meta = TEST_DATA_DIR + 'overlayNodesMeta.json';
        opts.out_file = TEMP_DIR + 'overlayNodesGetXyResults.json';
        opts.log = TEMP_DIR + 'overlayNodes.log';
    } else {
    
        // Build up the filenames
        //TODO
    }
    
    callPython('compute_pivot_vs_background', opts, function (result) {
        
        if (result.code !== 0) {
            respond(500, res, result.data);
            return;
        }
        
        var dataIn = opts.data,
            data = result.data;
        
        if (dataIn.TESTpythonCallStub || dataIn.TESTpythonCall) {
            respond(result.code === 0 ? 200 : 500, res, data);
            return;
        }
        
        // Send the http response to the original caller
        var urls = _.map(data, function (node) {
            return node.url;
        });
        respond(200, res, {bookmarks: urls});
        
        // Send email to interested parties
            
        // TODO for testing then remove
        dataIn.email = 'hexmap.ucsc.edu';
        //dataIn.email = ['hexmap.ucsc.edu', 'swat@soe.ucsc.edu'];
        
        var subject = 'tumor map results: ',
            msg = 'The tumor map calculation of overlay node position is complete for map: '
                + dataIn.map
                + ', layout: '
                + dataIn.layout
                + ' and available for viewing.\n\n';
        
        _.each(data, function (node, nodeName) {
            msg += nodeName + ' : ' + node.url + '\n';
            subject += node.url + ' ';
        });
        
        sendMail(dataIn.email, subject, msg);

        /* TODO bookmarks for later
        var state = {
            page: 'mapPage',
            project: xyData.map + '/',
            current_layout_name: xyData.layout,
            overlayNodes: xyData.nodes,
        };
        var bookmark = saveBookmark(state);
        respond(200, res, {bookmark: url + '?b=' + bookmark});
        */
    });
}

function passHttpChecks (req, res) {

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

respondToHttp = function (code, res, msg) {
    respond(code, res, msg);
}

WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    
    // Receive query requests and process them
    // TODO use this to process all queries, not just overlayNodes
    
    if (!passHttpChecks(req, res)) {
        return;
    }
    
    var queryFx = overlayNodes;
    var jsonDataIn = '';
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this request
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
