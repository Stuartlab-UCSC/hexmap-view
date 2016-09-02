
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var Future = Npm.require('fibers/future');
var exec = Future.wrap(Npm.require('child_process').exec);
// TODO use spawn instead of exec

var url = Meteor.absoluteUrl();

function passHttpChecks (req, res) {

    // Do some basic checks on the request headers, returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respondToHttp(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respondToHttp(400, res, 'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    
    // Receive query requests and process them
    
    // TODO make this generic so it works with more than overlayNodes.
    
    if (!passHttpChecks(req, res)) {
        return;
    }
    
    var queryFx = overlayNodesQuery;
    var jsonDataIn = '';
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
    
        try {
            var dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respondToHttp(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the query-specific function and let it complete the response
        queryFx(dataIn, res);
    });
});

respondToHttp = function (code, res, msg, future) {

    // This responds to an http request or handles a future for those cases
    // where the client is making the query.

    if (res) {
    
        // Send an HTTP response to the client.
        var data = msg;
        if (code === 200) {
            res.setHeader('Content-Type', 'application/json');
            data = JSON.stringify(msg);
        }
        res.writeHead(code);
        res.end(data + '\n');

    } else if (future) {
    
        // Return the message to the client.
        if (code === 200) {
            future.return(msg);
        } else {
            future.throw(msg);
        }
    }
}
