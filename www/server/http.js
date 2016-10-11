
// http.js
// Handle incoming HTTP requests, and outgoing HTTP requests to other servers.
// We only support POST requests for incoming and outgoing.
//
// Outgoing HTTP Requests:
//
// The request and response bodies contain a json-formatted file name on a
// volume that is shared between the local server and remote calc server. This
// prevents reading and writing the files twice and reduces the size of the
// HTTP content.
//
// The file referenced in the request body contains the list of parameters to
// be passed to the remote pythonCall.py which then reads and translates the
// file contents from json to a python dict.
//
// The file referenced in the response body contains the results of the
// of the remote server calculation which is read and translated from json to
// a javascript object by the local pythonCall.js.
//
// TODO do we want the user to be able to cancel the calc ?

function passPostChecks (req, res) {

    // Do some basic checks on the request headers,
    // returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respondToHttp(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respondToHttp(400, res,
            'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

function receive (url, req_in, res) {
    
    // Receive http post requests and process them
    
    var fx,
        jsonDataIn = '',
        req = req_in;
    
    // Set the handler function based on the url
    if (url === '/query/overlayNodes') {
        fx = overlayNodesQuery;
        
    } else if (url === '/calc/layout') {
        fx = create_map_http_request;
        
    } else { // We should not be able to get here
        console.log('http.js: post() not a good request url:',  url);
        respondToHttp(404, res, '');
        return;
    }

    if (!passPostChecks(req, res)) { return; }
    
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
    
        var dataIn;
        try {
            dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respondToHttp(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the handler function and let it complete the response
        fx(dataIn, res);
    });
}

WebApp.connectHandlers.use('/calc/layout', function (req, res, next) {
    receive('/calc/layout', req, res, next);
});

WebApp.connectHandlers.use('/query/overlayNodes', function (req, res, next) {
    receive('/query/overlayNodes', req, res, next);
});

respondToHttp = function (code, res, msg, future) {

    // This responds to an http request or handles a future for those cases
    // where our client is making the request, rather than an outsider.
    // TODO authenticate request for known users ?

    if (res) {
    
        console.log('respondToHttp: msg:', msg);
    
        // Send an HTTP response to an outsider.
        var data = msg;
        if (code === 200) {
            res.setHeader('Content-Type', 'application/json');
            data = JSON.stringify(msg);
        }
        res.writeHead(code);
        res.end(data + '\n');

    } else if (future) {

        // Return the message to our client.
        if (code === 200) {
            future.return(msg);
        } else {
            future.throw(msg);
        }
    }
};
